const db = require('./config/database');
const bcrypt = require('bcryptjs');

db.get('SELECT username, password_hash FROM Users WHERE username = ?', ['SEadmin'], (err, r) => {
  bcrypt.compare('password123', r.password_hash, (err, isMatch) => {
    console.log('Password match:', isMatch);
    process.exit();
  });
});