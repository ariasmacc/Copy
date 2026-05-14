const Category = require('../models/Category');

exports.getAllCategories = (req, res) => {
  Category.getAll((err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};