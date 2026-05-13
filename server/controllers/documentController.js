const Document = require('../models/Document');
const path = require('path');
const fs = require('fs');

exports.getAllDocuments = (req, res) => {
  Document.getAll((err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

exports.downloadFile = (req, res) => {
    const { filename } = req.params;
    
    // Use the same path logic you have in server.js
    const UPLOAD_DIR = process.env.RAILWAY_ENVIRONMENT 
        ? '/app/data/uploads' 
        : path.join(__dirname, '..', 'uploads'); // Adjust '..' based on folder depth

    const filePath = path.join(UPLOAD_DIR, filename);

    if (fs.existsSync(filePath)) {
        // This is the magic function that forces the download
        res.download(filePath, filename, (err) => {
            if (err) {
                console.error("Error during file download:", err);
                res.status(500).send("Could not download the file.");
            }
        });
    } else {
        res.status(404).json({ error: "File not found on server." });
    }
};