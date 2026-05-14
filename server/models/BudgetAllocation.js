// models/BudgetAllocation.js
const db = require('../config/database');
const crypto = require('crypto');
const recordToLedger = require('../utils/ledger');

const BudgetAllocation = {
  getAll: (callback) => {
    // This query uses LEFT JOIN, which is safer.
    // It will still show allocations even if the user or category is deleted.
    const sql = `
      SELECT
        ba.allocation_id AS id,
        ba.name,
        -- COALESCE returns 'Unknown Category' if c.name is null
        COALESCE(c.name, 'Unknown Category') AS category, 
        ba.amount,
        -- COALESCE returns 'Unknown User' if u.full_name is null
        COALESCE(u.full_name, 'Unknown User') AS created_by, 
        ba.created_at AS date,
        ba.priority,
        ba.status,
        (SELECT COUNT(*) FROM Validations v WHERE v.item_id = ba.allocation_id AND v.item_type = 'allocation' AND v.decision = 'Approved') AS validations
      FROM BudgetAllocations ba
      -- Use LEFT JOIN instead of JOIN
      LEFT JOIN Users u ON ba.submitted_by_user_id = u.user_id
      LEFT JOIN Categories c ON ba.category_id = c.category_id
      ORDER BY ba.created_at DESC
    `;
    db.all(sql, [], (err, rows) => {
        if(err) console.error("SQL Error in BudgetAllocation.getAll:", err.message);
        callback(err, rows);
    });
  },

  // --- HETO ANG INAYOS NA getUtilizationByCategory FUNCTION (Fixes P300k Sum) ---
  getUtilizationByCategory: (callback) => {
    // Gumagamit na ng subqueries para maiwasan ang maling SUM dahil sa JOINs
    const sql = `
      SELECT
          c.name AS category_name,
          COALESCE(Alloc.total_allocated, 0) AS total_allocated, -- Kunin ang total galing sa Alloc subquery
          COALESCE(Spent.total_spent, 0) AS total_spent       -- Kunin ang total galing sa Spent subquery
      FROM Categories c
      LEFT JOIN (
          -- Subquery para kunin ang total APPROVED allocation per category
          SELECT
              category_id,
              SUM(amount) AS total_allocated
          FROM BudgetAllocations
          WHERE status = 'Approved'
          GROUP BY category_id
      ) Alloc ON c.category_id = Alloc.category_id
      LEFT JOIN (
          -- Subquery para kunin ang total APPROVED expense per category
          SELECT
              category_id,
              SUM(amount) AS total_spent
          FROM Expenses
          WHERE status = 'Approved'
          GROUP BY category_id
      ) Spent ON c.category_id = Spent.category_id
      -- Ipakita lang ang category kung may allocation MAN LANG o may spending MAN LANG
      WHERE Alloc.total_allocated > 0 OR Spent.total_spent > 0
      ORDER BY c.name;
    `;
    db.all(sql, [], (err, rows) => {
        if(err) console.error("SQL Error in BudgetAllocation.getUtilizationByCategory (SUBQUERY VERSION):", err.message);
        callback(err, rows);
    });
  },
  // --- WAKAS NG INAYOS NA FUNCTION ---

  // --- HETO ANG INAYOS NA getSummary FUNCTION (Fixes Approved Today) ---
  getSummary: (callback) => {
    const sql = `
      SELECT
        (SELECT SUM(amount) FROM BudgetAllocations WHERE status = 'Approved') AS totalBudget,
        (SELECT COUNT(*) FROM BudgetAllocations WHERE status = 'Pending') AS pendingCount,
        
        -- HETO ANG INAYOS: Idinagdag ang 'localtime' para sa tamang date comparison
        (SELECT COUNT(*) FROM BudgetAllocations 
            WHERE status = 'Approved' 
            AND DATE(created_at) = DATE('now', 'localtime')
        ) AS approvedToday,
        
        (SELECT COUNT(*) FROM BudgetAllocations) AS totalAllocations
    `;
    db.get(sql, [], (err, row) => {
        if (err) console.error("SQL Error in BudgetAllocation.getSummary:", err.message);
        callback(err, row);
    });
  },
  // --- WAKAS NG INAYOS NA FUNCTION ---

  // create function (kasama na ang priority)
  create: (data, callback) => {
    const { name, category, amount, description, businessJustification, submitted_by_user_id, priority } = data;
    if (!submitted_by_user_id) {
      console.error("CRITICAL ERROR: No submitted_by_user_id passed to BudgetAllocation.create");
      return callback(new Error("No user ID provided for budget creation. Controller or middleware issue."));
    }
    const itemPriority = priority || 'Normal';
    const newBudgetId = 'BGT-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
    const currentTimeForHash = new Date().toISOString();
    let previousHash = '0000000000000000000000000000000000000000000000000000000000000000';
    let newBlockNumber = 1;

    db.serialize(() => {
        const sqlGetLatest = `
            SELECT block_number, hash, the_timestamp FROM (
                SELECT block_number, hash, created_at AS the_timestamp FROM Expenses WHERE block_number IS NOT NULL AND created_at IS NOT NULL
                UNION ALL
                SELECT block_number, hash, created_at AS the_timestamp FROM BudgetAllocations WHERE block_number IS NOT NULL AND created_at IS NOT NULL
            ) ORDER BY block_number DESC, the_timestamp DESC LIMIT 1
        `;
        db.get(sqlGetLatest, [], function (err, latestBlock) {
            if (err) { /* ... handle error ... */ return callback(err); }
            if (latestBlock) { previousHash = latestBlock.hash; }

            const sqlGetMaxBlock = `SELECT MAX(block_number) AS max_block FROM (SELECT block_number FROM Expenses UNION ALL SELECT block_number FROM BudgetAllocations)`;
             db.get(sqlGetMaxBlock, [], function (errMax, rowMax) {
                if(errMax){ /* ... handle error ... */ return callback(errMax); }
                newBlockNumber = (rowMax.max_block == null) ? 1 : rowMax.max_block + 1;

                const dataToHash = JSON.stringify({
                    block: newBlockNumber, id: newBudgetId, name: name, category: category, amount: amount,
                    desc: description, justification: businessJustification, submitter: submitted_by_user_id,
                    priority: itemPriority, timestamp: currentTimeForHash, prevHash: previousHash
                });
                const newHash = crypto.createHash('sha256').update(dataToHash).digest('hex');

                // --- IDAGDAG MO ITO (THE BLACK BOX LOGGER) ---
                recordToLedger('BUDGET', newBudgetId, newHash, dataToHash);
                // ---------------------------------------------

                // --- BAGONG DAGDAG NA PHT TIMESTAMP ---
                const nowPHT = new Date(); // Ito ay PHT na dahil sa server.js fix mo
                const phtTimestamp = `${nowPHT.getFullYear()}-${(nowPHT.getMonth() + 1).toString().padStart(2, '0')}-${nowPHT.getDate().toString().padStart(2, '0')} ${nowPHT.getHours().toString().padStart(2, '0')}:${nowPHT.getMinutes().toString().padStart(2, '0')}:${nowPHT.getSeconds().toString().padStart(2, '0')}`;
                // --- WAKAS NG BAGONG DAGDAG --

                const sqlAlloc = `
                  INSERT INTO BudgetAllocations
                    (allocation_id, name, category_id, amount, description, business_justification,
                     submitted_by_user_id, status, priority, block_number, hash, previous_hash, created_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?, ?, ?, ?)
                `;
                
                const categoryMap = {
                  'eventsandactivities': 1, 'travelandconferences': 2, 'suppliesandmaterials': 3,
                  'marketingandoutreach': 4, 'equipmentandtechnology': 5, 'emergencyfund': 6
                };
                const paramsAlloc = [
                    newBudgetId, name, categoryMap[category], amount, description, businessJustification,
                    submitted_by_user_id, itemPriority,
                    newBlockNumber, newHash, previousHash,
                    phtTimestamp
                ];

                
                db.run(sqlAlloc, paramsAlloc, function (err) {
                    if (err) { /* ... handle error ... */ return callback(err); }
                    callback(null, { id: newBudgetId });
                });
             });
        });
    });
  },

  // getById function (kasama ang debug logging)
  getById: (allocationId, callback) => {
    console.log(`---> [BudgetAllocation.getById] Searching for ID: "${allocationId}" (Type: ${typeof allocationId}, Length: ${allocationId ? allocationId.length : 'N/A'})`);
    const sqlAlloc = `
      SELECT
        ba.*,
        c.name AS category_name,
        u.full_name AS submitted_by
      FROM BudgetAllocations ba
      LEFT JOIN Categories c ON ba.category_id = c.category_id
      LEFT JOIN Users u ON ba.submitted_by_user_id = u.user_id
      WHERE ba.allocation_id = ?
    `;

    db.get(sqlAlloc, [allocationId], (err, allocDetails) => {
      if (err) {
        console.error(`---> [BudgetAllocation.getById] SQL Error for ID "${allocationId}":`, err.message);
        return callback(err);
      }
      if (!allocDetails) {
          console.log(`---> [BudgetAllocation.getById] Record NOT FOUND for ID: "${allocationId}"`);
          return callback(new Error(`Allocation not found with ID ${allocationId}`));
      } else {
          console.log(`---> [BudgetAllocation.getById] Record FOUND for ID: "${allocationId}"`);
      }

      // Fetch documents
      const sqlDocs = `SELECT * FROM Documents WHERE related_item_id = ? AND related_item_type = 'allocation'`;
      db.all(sqlDocs, [allocationId], (errDocs, documents) => {
        if (errDocs) {
            console.error(`SQL Error fetching documents for allocation ${allocationId}:`, errDocs.message);
            return callback(errDocs);
        }
        allocDetails.documents = documents || [];

        // Fetch validations
        const sqlValidations = `
          SELECT v.*, u.full_name as validator_name
          FROM Validations v
          JOIN Users u ON v.validator_user_id = u.user_id
          WHERE v.item_id = ? AND v.item_type = 'allocation'
          ORDER BY v.validated_at DESC
        `;
        db.all(sqlValidations, [allocationId], (errVals, validations) => {
          if (errVals) {
            console.error(`SQL Error fetching validations for allocation ${allocationId}:`, errVals.message);
            return callback(errVals);
          }
          allocDetails.validations_history = validations || [];
          callback(null, allocDetails);
        });
      });
    });
  }
};

module.exports = BudgetAllocation;