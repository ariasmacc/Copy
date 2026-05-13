// models/Validation.js
const db = require('../config/database');

const Validation = {
  // --- INAYOS ANG 'getQueue' PARA IBALIK SA 'created_at' ---
  // models/Validation.js

  getQueue: (callback) => {
    const sql = `
      SELECT
        item.id, item.name, item.type, item.category, item.amount, 
        item.submitted_by, item.date, item.priority, item.validations
      FROM (
        SELECT 
          ba.allocation_id AS id, ba.name, 'Allocation' AS type, 
          COALESCE(c.name, 'Unknown Category') AS category,
          ba.amount, 
          COALESCE(u.full_name, 'Unknown User') AS submitted_by,
          ba.created_at AS date, 
          ba.priority,
          (SELECT COUNT(*) FROM Validations v WHERE v.item_id = ba.allocation_id AND v.item_type = 'allocation' AND v.decision = 'Approved') AS validations
        FROM BudgetAllocations ba
        LEFT JOIN Users u ON ba.submitted_by_user_id = u.user_id 
        LEFT JOIN Categories c ON ba.category_id = c.category_id
        WHERE ba.status = 'Pending'
        
        UNION ALL
        
        SELECT 
          e.expense_id AS id, e.name AS name, 'Expense' AS type, 
          COALESCE(c.name, 'Unknown Category') AS category,
          e.amount, 
          COALESCE(u.full_name, 'Unknown User') AS submitted_by,
          e.created_at AS date, 
          'Normal' AS priority,
          (SELECT COUNT(*) FROM Validations v WHERE v.item_id = e.expense_id AND v.item_type = 'expense' AND v.decision = 'Approved') AS validations
        FROM Expenses e
        LEFT JOIN Users u ON e.submitted_by_user_id = u.user_id -- <-- FIXED: Changed 'user' to 'used'
        LEFT JOIN Categories c ON e.category_id = c.category_id
        WHERE e.status = 'Pending'
      ) AS item
      ORDER BY item.date DESC
    `;
    db.all(sql, [], (err, rows) => {
      if (err) console.error("SQL Error in Validation.getQueue:", err.message);
      callback(err, rows); 
    });
  },

  // getSummary function (Inayos ang 'localtime' para sa 'validatedThisMonth')
  getSummary: (callback) => {
    const sql = `
      SELECT
        ( (SELECT COUNT(*) FROM BudgetAllocations WHERE status = 'Pending') + 
          (SELECT COUNT(*) FROM Expenses WHERE status = 'Pending')
        ) AS pendingCount,
        (SELECT COUNT(*) FROM BudgetAllocations WHERE status = 'Pending' AND priority = 'High') AS highPriorityCount,
        (SELECT COUNT(*) FROM Validations WHERE strftime('%Y-%m', validated_at) = strftime('%Y-%m', 'now', 'localtime')) AS validatedThisMonth,
        ( SELECT COUNT(DISTINCT item_id || '-' || item_type) 
          FROM Validations 
          WHERE decision = 'Approved' 
          AND item_id || '-' || item_type NOT IN (
              SELECT item_id || '-' || item_type 
              FROM Validations 
              GROUP BY item_id, item_type 
              HAVING COUNT(*) >= 2
          )
        ) AS readyForApproval
    `;
    db.get(sql, [], (err, row) => {
        if (err) console.error("SQL Error in Validation.getSummary:", err.message);
        callback(err, row);
    });
  }, 

  // checkIfAlreadyValidated function (walang pagbabago)
  checkIfAlreadyValidated: (itemId, itemType, userId, callback) => {
    const sqlTypeLower = itemType.toLowerCase(); 
    const sqlCheck = `
        SELECT COUNT(*) as count 
        FROM Validations 
        WHERE item_id = ? AND item_type = ? AND validator_user_id = ?
    `;
    db.get(sqlCheck, [itemId, sqlTypeLower, userId], (err, row) => {
        if (err) {
            console.error("SQL Error in Validation.checkIfAlreadyValidated:", err.message);
            return callback(err); 
        }
        callback(null, row.count > 0); 
    });
  },

  // --- INAYOS ANG 'submitDecision' PARA IPASA ANG phtTimestamp ---
  submitDecision: (data, callback) => {
    const { itemId, itemType, decision, comments, userId } = data; 
    
    const itemTypeLower = itemType.toLowerCase(); 
    const tableToUpdate = itemTypeLower === 'allocation' ? 'BudgetAllocations' : 'Expenses'; 
    const idColumn = itemTypeLower === 'allocation' ? 'allocation_id' : 'expense_id';
    const finalItemStatus = 'Approved'; 
    const newDocStatus = decision; 
    
    db.serialize(() => {
      // 1. Gumawa ng PHT timestamp
      const nowPHT = new Date(); // Ito ay PHT na dahil sa server.js fix
      const phtTimestamp = `${nowPHT.getFullYear()}-${(nowPHT.getMonth() + 1).toString().padStart(2, '0')}-${nowPHT.getDate().toString().padStart(2, '0')} ${nowPHT.getHours().toString().padStart(2, '0')}:${nowPHT.getMinutes().toString().padStart(2, '0')}:${nowPHT.getSeconds().toString().padStart(2, '0')}`;
      
      // 2. Insert Validation gamit ang PHT timestamp
      const sqlInsert = `
        INSERT INTO Validations (item_id, item_type, validator_user_id, decision, comments, validated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      // 3. IPASA ANG 'phtTimestamp' DITO (IKA-ANIM NA PARAMETER)
      db.run(sqlInsert, [itemId, itemTypeLower, userId, decision, comments, phtTimestamp], function(err) {
        if (err) { console.error("Error inserting validation:", err.message); return callback(err); }

        // 4. Update Document Status
        const sqlDocUpdate = `
            UPDATE Documents 
            SET "status" = ? 
            WHERE related_item_id = ? AND related_item_type = ?
        `;
        db.run(sqlDocUpdate, [newDocStatus, itemId, itemTypeLower], (errDoc) => {
            if (errDoc) {
                console.error(`ERROR UPDATING DOCUMENTS status for ${itemId}:`, errDoc.message);
            } 

            // 5. Update Item Status (kung Rejected o 2+ Approvals)
            if (decision === 'Rejected') {
                const sqlUpdate = `UPDATE ${tableToUpdate} SET status = 'Rejected' WHERE ${idColumn} = ?`;
                db.run(sqlUpdate, [itemId], (errUpdate) => {
                    if (errUpdate) console.error(`Error updating item status to Rejected for ${itemId}:`, errUpdate.message); 
                    callback(null, { status: 'Rejected', validationId: this.lastID }); 
                });
            
            } else { // decision === 'Approved'
                const sqlCount = `
                    SELECT COUNT(*) AS approval_count FROM Validations
                    WHERE item_id = ? AND item_type = ? AND decision = 'Approved'
                `;
                db.get(sqlCount, [itemId, itemTypeLower], (errCount, row) => {
                    if (errCount) { console.error("Error counting approvals:", errCount.message); return callback(errCount); }

                    if (row.approval_count >= 2) {
                        const sqlUpdateItem = `UPDATE ${tableToUpdate} SET status = ? WHERE ${idColumn} = ?`;
                        const sqlUpdateDocFinal = `UPDATE Documents SET "status" = ? WHERE related_item_id = ? AND related_item_type = ?`; 

                        db.run(sqlUpdateItem, [finalItemStatus, itemId], (errUpdateItem) => {
                            if (errUpdateItem) console.error(`Error updating item status to ${finalItemStatus}:`, errUpdateItem.message); 
                            
                            db.run(sqlUpdateDocFinal, [finalItemStatus, itemId, itemTypeLower], (errUpdateDoc) => {
                                if (errUpdateDoc) console.error(`Error updating final Doc status to Approved for ${itemId}:`, errUpdateDoc.message); 
                                
                                callback(null, { status: finalItemStatus, approvals: row.approval_count, validationId: this.lastID });
                            });
                        });
                    } else {
                        callback(null, { status: 'Pending', approvals: row.approval_count, validationId: this.lastID });
                    }
                }); 
            }
        }); 
      }); 
    }); 
  },


  // getValidatorsForItem function (walang pagbabago)
  getValidatorsForItem: (itemId, itemType, callback) => {
    const sql = `
      SELECT v.*, u.full_name as validator_name 
      FROM Validations v
      JOIN Users u ON v.validator_user_id = u.user_id
      WHERE v.item_id = ? AND v.item_type = ?
      ORDER BY v.validated_at DESC
    `;
    db.all(sql, [itemId, itemType.toLowerCase()], (err, rows) => { 
        if (err) console.error(`SQL Error fetching validators for ${itemType} ${itemId}:`, err.message);
        callback(err, rows);
    });
  },

  // getDocumentsForItem function (walang pagbabago)
  getDocumentsForItem: (itemId, itemType, callback) => {
    const sql = `
      SELECT * FROM Documents 
      WHERE related_item_id = ? AND related_item_type = ?
    `;
    db.all(sql, [itemId, itemType.toLowerCase()], (err, rows) => {
        if (err) console.error(`SQL Error fetching documents for ${itemType} ${itemId}:`, err.message);
        callback(err, rows);
    });
  }
};

module.exports = Validation;