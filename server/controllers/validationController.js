const Validation = require('../models/Validation');

// Para sa table
exports.getValidationQueue = (req, res) => {
  Validation.getQueue((err, rows) => {
    if (err) {
      console.log(`DEBUG: Submitting validation for User ID: ${validatorUserId}`);
      console.error("Error in validationController.getValidationQueue calling model:", err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
};

// Para sa summary cards
exports.getSummary = (req, res) => {
  Validation.getSummary((err, row) => {
    if (err) {
      console.error("Error in validationController.getSummary calling model:", err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json(row);
  });
};

// --- ITO ANG INAYOS NA submitDecision FUNCTION ---
exports.submitDecision = (req, res) => {
  console.log("!!! PUMASOK SA submitDecision CONTROLLER !!!"); 
  console.log("Request Body:", req.body); 

  // 1. Kunin ang data mula sa request body
  const { itemId, itemType, decision, comments } = req.body;

  // DITO ANG PAG-AYOS: Kunin ang user ID mula sa token
  const validatorUserId = req.user.userId;

  // --- ADD THIS LOG HERE ---
  console.log("------------------------------------------");
  console.log(`DEBUG: Validation attempt for Item: ${itemId}`);
  console.log(`DEBUG: Validator User ID from Token: ${validatorUserId}`);
  console.log("------------------------------------------");

  // 3. Basic validation ng input
  if (!itemId || !itemType || !decision || !comments) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // 4. Data object para ipasa sa model
  const data = { 
    itemId, 
    itemType: itemType.toLowerCase(), 
    decision, 
    comments, 
    userId: validatorUserId // Gamitin ang tamang user ID
  };

  // 5. STEP 1: I-CHECK MUNA KUNG NAKAPAG-VALIDATE NA
  Validation.checkIfAlreadyValidated(data.itemId, data.itemType, data.userId, (errCheck, hasValidated) => {
    if (errCheck) {
      console.error("Error checking existing validation:", errCheck.message);
      return res.status(500).json({ error: "Database error checking validation status." });
    }

    // 6. KUNG NAKAPAG-VALIDATE NA, MAG-ERROR
    if (hasValidated) {
      console.warn(`User ${data.userId} already validated item ${data.itemType}-${data.itemId}.`);
      return res.status(400).json({ error: 'You have already submitted a validation for this item.' });
    }

    // 7. KUNG HINDI PA, ITULOY ANG PAG-SUBMIT NG DECISION
    Validation.submitDecision(data, (errSubmit, result) => {
      if (errSubmit) {
        // Ang UNIQUE constraint error ay dapat hindi na mangyari dito, pero just in case
        if (errSubmit.message.includes('UNIQUE constraint failed')) {
             console.error("UNIQUE constraint failed despite check:", errSubmit.message);
             return res.status(400).json({ error: 'You have already submitted a validation for this item (constraint).' });
        }
        console.error("Error in validationController.submitDecision calling model:", errSubmit.message);
        return res.status(500).json({ error: errSubmit.message });
      }
      res.status(200).json({ message: `Decision '${decision}' recorded!`, data: result });
    }); // End Validation.submitDecision
  }); // End Validation.checkIfAlreadyValidated
};
// --- WAKAS NG INAYOS NA submitDecision FUNCTION ---


// Para kunin ang validation history ng item
exports.getValidators = (req, res) => {
  const { itemType, itemId } = req.params; 
  if (!itemType || !itemId) {
      return res.status(400).json({ error: 'Missing itemType or itemId in URL parameters' });
  }
  Validation.getValidatorsForItem(itemId, itemType, (err, rows) => {
    if (err) {
      console.error(`Error in validationController.getValidators for ${itemType} ${itemId}:`, err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
};

// Para kunin ang documents ng item
exports.getDocuments = (req, res) => {
  const { itemType, itemId } = req.params; 
   if (!itemType || !itemId) {
      return res.status(400).json({ error: 'Missing itemType or itemId in URL parameters' });
 }
  Validation.getDocumentsForItem(itemId, itemType, (err, rows) => {
    if (err) {
      console.error(`Error in validationController.getDocuments for ${itemType} ${itemId}:`, err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
};