const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

function runMigrations(db) {
  db.run(`ALTER TABLE Users ADD COLUMN two_fa_code TEXT;`, (err) => {
    if (err && err.message && !err.message.includes("duplicate column name")) {
      console.error("Migration Error (two_fa_code):", err.message);
    }
  });
  db.run(`ALTER TABLE Users ADD COLUMN two_fa_expires DATETIME;`, (err) => {
    if (err && err.message && !err.message.includes("duplicate column name")) {
      console.error("Migration Error (two_fa_expires):", err.message);
    }
  });
}

const CODE_DB_PATH = path.resolve(__dirname, '..', 'data', 'BRIGHTDatabase.db');
const VOLUME_FOLDER = '/app/data'; 
const VOLUME_DB_PATH = path.join(VOLUME_FOLDER, 'BRIGHTDatabase.db');
const VERSION_FILE = path.join(VOLUME_FOLDER, '.db_version');
const CURRENT_VERSION = '3';

let dbPath;

console.log("--- DATABASE SETUP STARTED ---");

if (fs.existsSync(VOLUME_FOLDER)) {
    console.log("✅ Volume folder found. Running in Production/Railway.");
    
    const savedVersion = fs.existsSync(VERSION_FILE) ? fs.readFileSync(VERSION_FILE, 'utf8').trim() : '0';
    
    if (!fs.existsSync(VOLUME_DB_PATH) || savedVersion !== CURRENT_VERSION) {
        console.log("⚠️ Copying fresh database to Volume...");
        if (fs.existsSync(CODE_DB_PATH)) {
            try {
                fs.copyFileSync(CODE_DB_PATH, VOLUME_DB_PATH);
                fs.writeFileSync(VERSION_FILE, CURRENT_VERSION);
                console.log("✅ Database copied successfully!");
            } catch (err) {
                console.error("❌ Failed to copy database:", err);
            }
        }
    } else {
        console.log("✅ Existing database found. Using it.");
    }
    dbPath = VOLUME_DB_PATH;
} else {
    console.log("ℹ️ Local environment. Using local file.");
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