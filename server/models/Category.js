const db = require('../config/database');

const Category = {
  getAll: (callback) => {
    // Kukunin nito lahat ng data mula sa 'Categories' table
    const sql = `SELECT * FROM Categories ORDER BY name`;
    db.all(sql, [], callback);
  }
};

module.exports = Category;