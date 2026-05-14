const Transaction = require('../models/Transaction');
const { json2csv } = require('json-2-csv');

exports.getAllTransactions = (req, res) => {
  Transaction.getAll((err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

exports.exportTransactions = (req, res) => {
  Transaction.getAllForExport((err, rows) => {
    if (err) {
      console.error("Error fetching transactions for export:", err);
      return res.status(500).json({ error: 'Failed to fetch transaction data for export.' });
    }

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'No transaction data found to export.' });
    }

    try {
      // Options for the CSV converter (optional, but good practice)
      const options = {
        keys: [
          'block_number', 
          'transaction_id', 
          'type', 
          'category', 
          'amount', 
          'initiated_by', 
          'timestamp', 
          'validations', 
          'hash', 
          'status'
        ],
        header: true,
      };

      // Convert JSON data to CSV string
      const csv = json2csv(rows, options);

      // Set headers to trigger browser download
      const fileName = `bright_transactions_${new Date().toISOString().split('T')[0]}.csv`;
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      
      // Send the CSV data
      res.status(200).send(csv);

    } catch (csvError) {
      console.error("Error converting data to CSV:", csvError);
      res.status(500).json({ error: 'Failed to generate CSV file.' });
    }
  });
};