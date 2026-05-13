const Overview = require('../models/Overview');

// Handles the request for the summary cards
exports.getSummary = (req, res) => {
  Overview.getSummaryCards((err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row);
  });
};

// Handles the request for the budget utilization (progress bars)
exports.getUtilization = (req, res) => {
  Overview.getBudgetUtilization((err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

// Handles the request for the monthly spending trend chart
exports.getSpendingTrend = (req, res) => {
  Overview.getMonthlySpending((err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};