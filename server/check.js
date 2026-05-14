const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.resolve(__dirname, 'data', 'BRIGHTDatabase.db'));

db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, rows) => {
  console.log('Tables:', JSON.stringify(rows));
  db.close();
  process.exit();
});