// models/Transaction.js
const db = require('../config/database');

// This is the main, correct query logic from your typed code.
const buildLedgerQuery = () => {
  return `
    SELECT
      tl.transaction_id,
      tl.type,
      tl.name_or_vendor,
      tl.timestamp,
      u.full_name AS initiated_by,
      c.name AS category,
      tl.amount,
      tl.status,
      tl.block_number,
      tl.hash,
      tl.previous_hash,
      (SELECT COUNT(*) FROM Validations v WHERE v.item_id = tl.transaction_id AND v.decision = 'Approved') AS validations
    FROM (
      -- Part for Budget Allocations
      SELECT
        allocation_id AS transaction_id,
        'Allocation' AS type,
        name AS name_or_vendor,
        created_at AS timestamp,
        submitted_by_user_id,
        category_id,
        amount,
        status,
        block_number,
        hash,
        previous_hash
      FROM BudgetAllocations
      
      UNION ALL
      
      -- Part for Expenses
      SELECT
        expense_id AS transaction_id,
        'Expense' AS type,
        name AS name_or_vendor,
        created_at AS timestamp, -- This fixes the date sorting
        submitted_by_user_id,
        category_id,
        amount,
        status,
        block_number,
        hash,
        previous_hash
      FROM Expenses
    ) AS tl
    -- JOIN Users and Categories *after* the UNION
    LEFT JOIN Users u ON tl.submitted_by_user_id = u.user_id
    LEFT JOIN Categories c ON tl.category_id = c.category_id
    -- Sort by the correct timestamp
    ORDER BY tl.timestamp DESC, tl.block_number DESC 
  `;
};

const Transaction = {
  // For the main table on admin-TL.html
  getAll: (callback) => {
    const sql = buildLedgerQuery(); // Use the main query
    
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error("SQL Error in Transaction.getAll (UNION VERSION):", err.message);
        }
        callback(err, rows); // Send result to controller
    });
  },

  // --- ADDED THIS FUNCTION BACK ---
  // For the "Export CSV" button
  getAllForExport: (callback) => {
    const sql = buildLedgerQuery(); // Use the exact same query
    
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error("SQL Error in Transaction.getAllForExport (UNION VERSION):", err.message);
        }
        callback(err, rows); // Send result to controller
    });
  }
};

module.exports = Transaction;