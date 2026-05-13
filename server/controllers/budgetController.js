// controllers/budgetController.js
const BudgetAllocation = require('../models/BudgetAllocation');

exports.getAllAllocations = (req, res) => {
  BudgetAllocation.getAll((err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

// --- ITO ANG INAYOS NA createAllocation FUNCTION ---
exports.createAllocation = (req, res) => {
  // 1. Kunin ang user ID nang dinamiko mula sa JWT token
  //    Ang req.user ay galing sa iyong 'auth.js' middleware.
  const submittedByUserId = req.user.userId;

  // Maglagay ng check para sigurado
  if (!submittedByUserId) {
    return res.status(401).json({ error: 'Authentication error: User ID not found in token.' });
  }

  // 2. Pagsamahin ang form data (req.body) at ang DYNAMIC na User ID
  const allocationData = {
      ...req.body, // Ito yung (name, amount, category, description, businessJustification)
      submitted_by_user_id: submittedByUserId // Ito na ang ID ng naka-login na user
  };


  // 3. Ipasa ang kumpletong data (kasama na ang tamang ID) sa Model
  BudgetAllocation.create(allocationData, function (err, result) { 
    if (err) {
      console.error("Error in budgetController.createAllocation calling model:", err.message);
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ message: 'Allocation created!', data: result });
  });
};
// --- WAKAS NG UPDATED FUNCTION ---


exports.getSummary = (req, res) => {
  BudgetAllocation.getSummary((err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row);
  });
};

exports.getUtilizationByCategory = (req, res) => {
  BudgetAllocation.getUtilizationByCategory((err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows); // Ibalik ang data as JSON array
  });
};

exports.getAllocationById = (req, res) => {
  const allocationId = req.params.id;
  BudgetAllocation.getById(allocationId, (err, details) => {
    if (err) {
      if (err.message.includes('not found')) {
        return res.status(404).json({ error: err.message });
      }
      return res.status(500).json({ error: err.message });
    }
    res.json(details);
  });
};