const Expense = require('../models/Expense');
const crypto = require('crypto');
const recordToLedger = require('../utils/ledger');

// --- RESTORED: GET ALL EXPENSES ---
exports.getAllExpenses = (req, res) => {
  Expense.getAll((err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

// --- RESTORED: GET SUMMARY ---
exports.getSummary = (req, res) => {
  Expense.getSummary((err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row);
  });
};

// --- THE PERMANENT FIX: CREATE EXPENSE ---
exports.createExpense = (req, res) => {
  const data = req.body;
  const files = req.files; 

  // --- PERMANENT FIX START ---
  // Bago ipasa sa Model, ayusin natin ang path para maging Web URL
  if (files && Array.isArray(files)) {
      files.forEach(file => {
          // O-overwrite natin ang system path ng web path
          file.path = '/uploads/' + file.filename;
      });
  }
  // --- PERMANENT FIX END ---

  // 1. Simpleng validation
  if (!data.name || !data.budgetName || !data.amount || !data.vendor || !data.expenseDate) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // 2. DATA CLEANING & PREP
  const cleanData = {};
  for (const key in data) {
    if (typeof data[key] === 'string') {
        cleanData[key] = data[key].trim(); 
    } else {
        cleanData[key] = data[key]; 
    }
  }

  // 3. ATTACH KRITIKAL DATA
  // Siguraduhing may nakalog-in na user
  if (!req.user || !req.user.userId) {
    return res.status(401).json({ error: 'Authentication error: User ID not found in token.' });
  }
  
  const submittedByUserId = req.user.userId;
  cleanData.submitted_by_user_id = submittedByUserId;

  // 4. Tawagin ang 'create' function 
  Expense.create(cleanData, files, (err, result) => { 
    if (err) {
      console.error("Error in expenseController.createExpense calling model:", err.message);
      return res.status(500).json({ error: 'Failed to create expense due to server error.' });
    }

  // --- [UPDATED] AUDIT TRAIL LOGIC ---
    try {
        // Kunin ang data GALING SA MODEL result (para match sa DB)
        const { id, hash, rawString } = result;

        console.log(`📝 Recording Official Blockchain Hash for ID: ${id}`);
        
        // I-record sa Ledger at Discord ang EXACT DATA na nasa Database
        recordToLedger('EXPENSE', id, hash, rawString);

    } catch (auditError) {
        console.error("⚠️ Audit Log Failed:", auditError);
    }
    // -----------------------------------
    
    res.status(201).json({ message: 'Expense created successfully!', data: result });
  });
};

// --- RESTORED: GET EXPENSE BY ID ---
exports.getExpenseById = (req, res) => {
  const expenseId = req.params.id;
  
  Expense.getById(expenseId, (err, details) => {
    if (err) {
      if (err.message.includes('not found')) {
        return res.status(404).json({ error: err.message });
      }
      return res.status(500).json({ error: err.message });
    }
    res.json(details); 
  });
};