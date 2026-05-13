const db = require('../config/database');

const Overview = {
  /**
   * Gets the main summary numbers for the 4 cards at the top.
   */
  getSummaryCards: (callback) => {
    // A complex query to get all data in one call
    const sql = `
      SELECT
        (SELECT COALESCE(SUM(amount), 0) FROM BudgetAllocations WHERE status = 'Approved') AS totalBudget,
        (SELECT COALESCE(SUM(amount), 0) FROM Expenses WHERE status = 'Approved') AS totalSpent,
        (SELECT COUNT(*) FROM BudgetAllocations WHERE status = 'Pending') + 
        (SELECT COUNT(*) FROM Expenses WHERE status = 'Pending') AS pendingCount
    `;
    db.get(sql, [], callback);
  },

  /**
   * Gets the budget utilization data (for the progress bars).
   */
  getBudgetUtilization: (callback) => {
    // A query that combines Categories, Allocations, and Expenses
    const sql = `
      SELECT 
        c.name AS category,
        COALESCE(SUM(ba.amount), 0) AS totalAllocated,
        COALESCE(e_spent.totalSpent, 0) AS totalSpent
      FROM Categories c
      LEFT JOIN BudgetAllocations ba ON c.category_id = ba.category_id AND ba.status = 'Approved'
      LEFT JOIN (
          -- Subquery to get the total spent for each category
          SELECT category_id, SUM(amount) AS totalSpent
          FROM Expenses
          WHERE status = 'Approved'
          GROUP BY category_id
      ) e_spent ON c.category_id = e_spent.category_id
      GROUP BY c.name
      HAVING totalAllocated > 0 OR totalSpent > 0 -- Only show categories with data
      ORDER BY totalAllocated DESC
    `;
    db.all(sql, [], callback);
  },
  
  /**
   * Gets spending data for the last 6 months for the trend chart.
   */
  getMonthlySpending: (callback) => {
    const sql = `
      SELECT
        strftime('%Y-%m', expense_date) AS month,
        SUM(amount) AS totalSpent
      FROM Expenses
      WHERE status = 'Approved'
        AND expense_date >= date('now', '-6 months')
      GROUP BY month
      ORDER BY month ASC
    `;
    db.all(sql, [], callback);
  }
};

module.exports = Overview;