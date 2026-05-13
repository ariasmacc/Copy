const db = require('../config/database');

const Document = {
  // For the table in admin-documents.html
  getAll: (callback) => {
    const sql = `
      SELECT
        d.file_name,
        d.description,
        d.file_type AS type,
        d.file_size_kb AS size,
        d.related_item_id AS related_transaction,
        -- Use COALESCE in case the category is deleted
        COALESCE(c.name, 'N/A') AS category,
        -- Use COALESCE in case the user is deleted
        COALESCE(u.full_name, 'Unknown User') AS uploaded_by,
        d.uploaded_at AS date,
        d.status,
        d.file_hash AS hash,
        d.file_path AS file_path
      FROM Documents d
      -- FIX: Changed to LEFT JOIN
      LEFT JOIN Users u ON d.uploaded_by_user_id = u.user_id
      LEFT JOIN Expenses e ON d.related_item_id = e.expense_id AND d.related_item_type = 'expense'
      LEFT JOIN BudgetAllocations ba ON d.related_item_id = ba.allocation_id AND d.related_item_type = 'allocation'
      LEFT JOIN Categories c ON e.category_id = c.category_id OR ba.category_id = c.category_id
      WHERE d.file_path IS NOT NULL -- This is a good check
      ORDER BY d.uploaded_at DESC
    `;
    db.all(sql, [], callback);
  }
};

module.exports = Document;