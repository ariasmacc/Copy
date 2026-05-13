// models/User.js

// Make sure this path is correct
const db = require('../config/database'); 

const User = {
  // --- USER LOOKUP FUNCTIONS ---
  findByUsername: (username, callback) => {
    // --- BINAGO --- Dinagdagan ng "AND status = 'approved'"
    const sql = "SELECT * FROM Users WHERE username = ? AND status = 'approved'";
    db.get(sql, [username], (err, user) => {
        if (err) {
            console.error("SQL Error in User.findByUsername:", err.message);
        }
        callback(err, user);
    });
  },

  findByEmail: (email, callback) => {
    const sql = 'SELECT * FROM Users WHERE email = ?';
    db.get(sql, [email], (err, user) => {
      if (err) {
        console.error("SQL Error in User.findByEmail:", err.message);
      }
      callback(err, user);
    });
  },

  // --- USER CREATION ---
  create: (username, full_name, passwordHash, email, role, position, callback) => {
    const now = new Date();

    const timestamp = now.getFullYear() + '-' +
                    ('0' + (now.getMonth() + 1)).slice(-2) + '-' +
                    ('0' + now.getDate()).slice(-2) + ' ' +
                    ('0' + now.getHours()).slice(-2) + ':' +
                    ('0' + now.getMinutes()).slice(-2) + ':' +
                    ('0' + now.getSeconds()).slice(-2);

    const sql = `
      INSERT INTO Users (username, full_name, password_hash, role, email, position, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.run(sql, [username, full_name, passwordHash, role, email, position, timestamp], function(err) {
      if (err) {
        console.error("SQL Error in User.create:", err.message);
      }
      callback(err, { id: this.lastID }); 
    });
  },

  // --- USER GET ALL ---
  getAll: (callback) => {
    db.all("SELECT user_id, full_name, role FROM Users ORDER BY full_name", [], (err, rows) => {
         if (err) {
            console.error("SQL Error in User.getAll:", err.message);
        }
        callback(err, rows);
    });
  },

  // --- MGA BAGONG FUNCTIONS PARA SA USER MANAGEMENT ---

  // Para kunin lahat ng user para sa table
  getAllRequests: (callback) => {
    const sql = `
      SELECT user_id, full_name, position, role, email, created_at AS requested_date, status
      FROM Users
      ORDER BY CASE status WHEN 'pending' THEN 1 WHEN 'approved' THEN 2 WHEN 'rejected' THEN 3 END, created_at DESC`;
    db.all(sql, [], callback);
  },

  // Para i-update ang status (approve/reject)
  updateStatus: (userId, newStatus, callback) => {
    const sql = `UPDATE Users SET status = ? WHERE user_id = ?`;
    db.run(sql, [newStatus, userId], function(err) {
      callback(err, { changes: this.changes });
    });
  },

  // Para sa summary cards (pending, approved, rejected counts)
  getStatusSummary: (callback) => {
    const sql = `
      SELECT
        COUNT(CASE WHEN status = 'pending' THEN 1 END) AS pending,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) AS approved,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) AS rejected
      FROM Users`;
    db.get(sql, [], callback);
  },

  // --- PASSWORD RESET FUNCTIONS ---

  saveResetToken: (userId, token, expires, callback) => {
    const sql = 'UPDATE Users SET reset_token = ?, reset_token_expires = ? WHERE user_id = ?';
    db.run(sql, [token, expires, userId], function(err) {
      if (err) {
        console.error("SQL Error in User.saveResetToken:", err.message);
      }
      callback(err, this.changes);
    });
  },

  findByResetToken: (token, callback) => {
    const sql = "SELECT * FROM Users WHERE reset_token = ? AND reset_token_expires > datetime('now')";
    db.get(sql, [token], (err, user) => {
      if (err) {
        console.error("SQL Error in User.findByResetToken:", err.message);
      }
      callback(err, user);
    });
  },

  updatePassword: (userId, hashedPassword, callback) => {
    const sql = 'UPDATE Users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE user_id = ?';
    db.run(sql, [hashedPassword, userId], function(err) {
      if (err) {
        console.error("SQL Error in User.updatePassword:", err.message);
      }
      callback(err, this.changes);
    });
  },
  updateAccountDetails: (userId, data, callback) => {
    const { username, full_name, email, position } = data;
    const sql = `
      UPDATE Users 
      SET username = ?, full_name = ?, email = ?, position = ? 
      WHERE user_id = ?
    `;
    db.run(sql, [username, full_name, email, position, userId], function(err) {
      if (err) console.error("SQL Error in User.updateAccountDetails:", err.message);
      callback(err, { changes: this.changes });
    });
  },

  // Updates the password hash
  changePassword: (userId, newPasswordHash, callback) => {
    const sql = `UPDATE Users SET password_hash = ? WHERE user_id = ?`;
    db.run(sql, [newPasswordHash, userId], function(err) {
      if (err) console.error("SQL Error in User.changePassword:", err.message);
      callback(err, { changes: this.changes });
    });
  },

  // --- NEW 2FA FUNCTIONS ---
  saveTwoFACode: (userId, hashedCode, expires, callback) => {
    const sql = 'UPDATE Users SET two_fa_code = ?, two_fa_expires = ? WHERE user_id = ?';
    db.run(sql, [hashedCode, expires, userId], function(err) {
      if (err) {
        console.error("SQL Error in User.saveTwoFACode:", err.message);
      }
      callback(err, this.changes);
    });
  },
  
  findByTwoFACode: (userId, hashedCode, callback) => {
    // Finds user only if code matches AND is not expired
    const sql = "SELECT * FROM Users WHERE user_id = ? AND two_fa_code = ? AND two_fa_expires > datetime('now')";
    db.get(sql, [userId, hashedCode], (err, user) => {
      if (err) {
        console.error("SQL Error in User.findByTwoFACode:", err.message);
      }
      callback(err, user);
    });
  },

  clearTwoFACode: (userId, callback) => {
    const sql = 'UPDATE Users SET two_fa_code = NULL, two_fa_expires = NULL WHERE user_id = ?';
    db.run(sql, [userId], function(err) {
        if (err) {
            console.error("SQL Error in User.clearTwoFACode:", err.message);
        }
        callback(err, this.changes);
    });
  }
};
module.exports = User;