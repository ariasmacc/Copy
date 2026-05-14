const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

function runMigrations(db) {
  db.serialize(() => {
    console.log("🛠️  Running database migrations...");
    db.run(`ALTER TABLE Users ADD COLUMN two_fa_code TEXT;`, () => {});
    db.run(`ALTER TABLE Users ADD COLUMN two_fa_expires DATETIME;`, () => {});
    db.run(`ALTER TABLE Users ADD COLUMN reset_token TEXT;`, () => {});
    db.run(`ALTER TABLE Users ADD COLUMN reset_token_expires DATETIME;`, () => {
      console.log("✅ Users table is ready.");
    });
  });
}

console.log("--- DATABASE SETUP STARTED ---");

const CODE_DB_PATH = path.resolve(__dirname, '..', 'data', 'BRIGHTDatabase.db');
const VOLUME_FOLDER = '/app/data'; 
const VOLUME_DB_PATH = path.join(VOLUME_FOLDER, 'BRIGHTDatabase.db');

let dbPath;

if (fs.existsSync(VOLUME_FOLDER)) {
    console.log("✅ Volume folder found. Running in Production/Railway.");
    
    // ALWAYS copy fresh database from code
    if (fs.existsSync(CODE_DB_PATH)) {
        try {
            fs.copyFileSync(CODE_DB_PATH, VOLUME_DB_PATH);
            console.log("✅ SUCCESS: Fresh database copied to Volume.");
        } catch (err) {
            console.error("❌ ERROR: Failed to copy database file:", err);
        }
    }
    dbPath = VOLUME_DB_PATH;
} else {
    console.log("ℹ️ Volume folder NOT found. Using local file.");
    dbPath = CODE_DB_PATH;
}

console.log("Final Database Path:", dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ FATAL ERROR opening database:', err.message);
  } else {
    console.log('✅ Connected to SQLite database.');
    db.exec('PRAGMA foreign_keys = ON;');
    runMigrations(db); 
  }
});

module.exports = db;