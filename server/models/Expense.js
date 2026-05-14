// models/Expense.js
const db = require('../config/database');
const crypto = require('crypto'); 
const fs = require('fs'); 
const path = require('path'); 

const Expense = {
  // Get all expenses for the table view
  getAll: (callback) => {
    const sql = `
      SELECT
        e.expense_id AS id,
        e.name,
        ba.name AS budget_name,
        c.name AS category,
        e.amount,
        e.vendor,
        e.expense_date AS date,
        e.status,
        (SELECT COUNT(*) FROM Documents d WHERE d.related_item_id = e.expense_id AND d.related_item_type = 'expense') AS documents_count,
        (SELECT COUNT(*) FROM Validations v WHERE v.item_id = e.expense_id AND v.item_type = 'expense' AND v.decision = 'Approved') AS validations
      FROM Expenses e
      LEFT JOIN BudgetAllocations ba ON e.budget_allocation_id = ba.allocation_id
      LEFT JOIN Categories c ON e.category_id = c.category_id
      ORDER BY e.created_at DESC
    `;
    db.all(sql, [], (err, rows) => {
      if (err) console.error("SQL Error in Expense.getAll:", err.message);
      callback(err, rows);
    });
  },

  // Get summary data for cards
  getSummary: (callback) => {
    const sql = `
      SELECT
        (SELECT SUM(amount) FROM Expenses WHERE status = 'Approved') AS totalExpenses,
        (SELECT COUNT(*) FROM Expenses WHERE status = 'Pending') AS pendingReview,
        (SELECT COUNT(*) FROM Expenses 
            WHERE status = 'Approved' 
            AND DATE(created_at) = DATE('now', 'localtime')
        ) AS approvedToday,
        (SELECT COUNT(*) FROM Documents WHERE related_item_type = 'expense') AS documentsUploaded
    `;
    db.get(sql, [], (err, row) => {
      if (err) console.error("SQL Error in Expense.getSummary:", err.message);
      callback(err, row);
    });
  },

  // Create a new expense and associated documents
  create: (data, files, callback) => {
    const { name, budgetName, budgetCategory, amount, expenseDate, vendor, description, receiptNumber, documentType, submitted_by_user_id } = data; 
    
    if (!submitted_by_user_id) { 
        console.error("CRITICAL ERROR: submitted_by_user_id is missing during expense creation.");
        return callback(new Error("User ID is required for expense creation."));
    }
    
    const newExpenseId = 'EXP-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
    const currentTimeForHash = new Date().toISOString(); 
    let previousHash = '0000000000000000000000000000000000000000000000000000000000000000';
    let newBlockNumber = 1;

    db.serialize(() => {
      // Step 1 & 2: Get latest block info
      const sqlGetLatest = `
         SELECT block_number, hash, the_timestamp FROM (
             SELECT block_number, hash, created_at AS the_timestamp FROM Expenses WHERE block_number IS NOT NULL AND created_at IS NOT NULL
             UNION ALL
             SELECT block_number, hash, created_at AS the_timestamp FROM BudgetAllocations WHERE block_number IS NOT NULL AND created_at IS NOT NULL
         ) ORDER BY block_number DESC, the_timestamp DESC LIMIT 1
      `;
      db.get(sqlGetLatest, [], function (err, latestBlock) {
        if (err) { console.error("Error getting latest block info (Expense):", err.message); return callback(err); }
        if (latestBlock) { previousHash = latestBlock.hash; }

        const sqlGetMaxBlock = `SELECT MAX(block_number) AS max_block FROM (SELECT block_number FROM Expenses UNION ALL SELECT block_number FROM BudgetAllocations)`;
        db.get(sqlGetMaxBlock, [], function (errMax, rowMax) {
          if (errMax) { console.error("Error getting max block number (Expense):", errMax.message); return callback(errMax); }
          newBlockNumber = (rowMax.max_block == null) ? 1 : rowMax.max_block + 1;

          // Step 3: Generate SHA-256 hash
          const dataToHash = JSON.stringify({ 
              block: newBlockNumber, id: newExpenseId, name: name, budgetId: budgetName, 
              category: budgetCategory, amount: amount, date: expenseDate, vendor: vendor, 
              desc: description, receipt: receiptNumber, submitter: submitted_by_user_id, 
              timestamp: currentTimeForHash, prevHash: previousHash
          });
          const newHash = crypto.createHash('sha256').update(dataToHash).digest('hex'); 

          // Create PHT Timestamp
          const nowPHT = new Date(); 
          const phtTimestamp = `${nowPHT.getFullYear()}-${(nowPHT.getMonth() + 1).toString().padStart(2, '0')}-${nowPHT.getDate().toString().padStart(2, '0')} ${nowPHT.getHours().toString().padStart(2, '0')}:${nowPHT.getMinutes().toString().padStart(2, '0')}:${nowPHT.getSeconds().toString().padStart(2, '0')}`;

          // Step 4: Insert expense
          const sqlExpense = `
            INSERT INTO Expenses
              (expense_id, name, budget_allocation_id, category_id, amount, expense_date,
               vendor, description, receipt_number, submitted_by_user_id, status,
               block_number, hash, previous_hash, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?, ?, ?)
          `;
          const paramsExpense = [
            newExpenseId, name, budgetName, budgetCategory, amount,
            expenseDate, vendor, description, receiptNumber,
            submitted_by_user_id,
            newBlockNumber, newHash, previousHash,
            phtTimestamp 
          ];

          db.run(sqlExpense, paramsExpense, function (err) {
            if (err) { console.error("Error inserting expense:", err.message); return callback(err); }

            // Step 5: Insert documents 
            if (files && files.length > 0) {
              const sqlDoc = `
                INSERT INTO Documents
                  (file_name, description, file_type, file_size_kb, file_path, file_hash,
                   status, related_item_id, related_item_type, uploaded_by_user_id)
                VALUES (?, ?, ?, ?, ?, ?, 'Pending Review', ?, 'expense', ?)
              `;
              let filesProcessed = 0;
              let docErrorOccurred = false;

              files.forEach(file => {
                if (docErrorOccurred) return;

                // --- FIX STARTS HERE: RECONSTRUCT SYSTEM PATH FOR HASHING ---
                let systemFilePath;
                
                // Determine where the actual file is on the disk
                if (process.env.RAILWAY_ENVIRONMENT) {
                    // Production (Railway Volume)
                    systemFilePath = path.join('/app/data/uploads', file.filename);
                } else {
                    // Local Development 
                    systemFilePath = path.join(__dirname, '../uploads', file.filename);
                }

                // Calculate Actual File Hash using System Path
                let fileHash = 'error-hashing-file-' + file.filename; 
                try {
                    // Use systemFilePath instead of file.path (which is a URL)
                    if (fs.existsSync(systemFilePath)) {
                        const fileBuffer = fs.readFileSync(systemFilePath);
                        fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
                    } else {
                        console.error(`File not found at system path: ${systemFilePath}`);
                    }
                } catch (hashError) {
                    console.error(`Error hashing file ${file.filename}:`, hashError);
                }
                // --- FIX ENDS HERE ---

                // Insert into DB (Note: We use file.path for the DB, which is the URL '/uploads/...')
                const paramsDoc = [
                  file.filename, description, documentType || 'Other', file.size / 1024, 
                  file.path, // Save the Web URL to the database
                  fileHash, 
                  newExpenseId, submitted_by_user_id 
                ];

                db.run(sqlDoc, paramsDoc, function (err) {
                  if (docErrorOccurred) return;
                  if (err) { console.error("Error inserting document:", err.message); docErrorOccurred = true; return callback(err); } 
                  else {
                    filesProcessed++;
                    if (filesProcessed === files.length) {
                      callback(null, { 
                          id: newExpenseId, 
                          hash: newHash,          // <--- IMPORTANTE
                          rawString: dataToHash   // <--- IMPORTANTE (Ito ang evidence)
                      });
                    }
                  }
                });
              });
            } else {
              callback(null, { 
                  id: newExpenseId, 
                  hash: newHash, 
                  rawString: dataToHash 
              });
            }
          }); 
        }); 
      }); 
    }); 
  },

  // Get a single expense by ID
  getById: (expenseId, callback) => {
    const sqlExpense = `
      SELECT
        e.*,
        ba.name AS budget_name,
        c.name AS category,
        u.full_name AS submitted_by
      FROM Expenses e
      LEFT JOIN BudgetAllocations ba ON e.budget_allocation_id = ba.allocation_id
      LEFT JOIN Categories c ON e.category_id = c.category_id
      LEFT JOIN Users u ON e.submitted_by_user_id = u.user_id
      WHERE e.expense_id = ?
    `;

    db.get(sqlExpense, [expenseId], (err, expenseDetails) => {
      if (err) { console.error(`SQL Error fetching expense ${expenseId}:`, err.message); return callback(err); }
      if (!expenseDetails) return callback(new Error(`Expense not found with ID ${expenseId}`));

      const sqlDocs = `SELECT * FROM Documents WHERE related_item_id = ? AND related_item_type = 'expense'`;
      db.all(sqlDocs, [expenseId], (errDocs, documents) => {
        if (errDocs) { console.error(`SQL Error fetching documents for expense ${expenseId}:`, errDocs.message); return callback(errDocs); }
        expenseDetails.documents = documents || [];

        const sqlValidations = `
          SELECT v.*, u.full_name as validator_name
          FROM Validations v
          JOIN Users u ON v.validator_user_id = u.user_id
          WHERE v.item_id = ? AND v.item_type = 'expense'
          ORDER BY v.validated_at DESC
        `;
        db.all(sqlValidations, [expenseId], (errVals, validations) => {
          if (errVals) { console.error(`SQL Error fetching validations for expense ${expenseId}:`, errVals.message); return callback(errVals); }
          expenseDetails.validations_history = validations || [];

          callback(null, expenseDetails);
        });
      });
    });
  }
};

module.exports = Expense;