const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.resolve(__dirname, 'data', 'BRIGHTDatabase.db'));

db.serialize(() => {
  db.run(`DELETE FROM Users WHERE user_id IN (2, 3, 4, 5, 6, 7)`, (err) => {
    if (err) console.error('Error:', err.message);
    else console.log('✅ Deleted users 2-5');
    
    db.all('SELECT user_id, username, status FROM Users', [], (err, rows) => {
      console.log('Remaining:', JSON.stringify(rows, null, 2));
      db.close();
      process.exit();
    });
  });
});