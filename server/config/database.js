// config/database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// --- NEW MIGRATION FUNCTION ---
function runMigrations(db) {
  db.run(`ALTER TABLE Users ADD COLUMN two_fa_code TEXT;`, (err) => {
    if (err && !err.message.includes("duplicate column name")) console.error("Migration Error:", err.message);
  });
  db.run(`ALTER TABLE Users ADD COLUMN two_fa_expires DATETIME;`, (err) => {
    if (err && !err.message.includes("duplicate column name")) console.error("Migration Error:", err.message);
  });
}

console.log("--- DATABASE SETUP STARTED ---");

const CODE_DB_PATH = path.resolve(__dirname, '..', 'data', 'BRIGHTDatabase.db');
const VOLUME_FOLDER = '/app/data'; 
const VOLUME_DB_PATH = path.join(VOLUME_FOLDER, 'BRIGHTDatabase.db');

let dbPath;
const isRailway = process.env.NODE_ENV === 'production';

if (isRailway || fs.existsSync(VOLUME_FOLDER)) {
    console.log("✅ Volume/Production environment detected.");
    if (!fs.existsSync(VOLUME_FOLDER)) fs.mkdirSync(VOLUME_FOLDER, { recursive: true });

    let isDbValid = false;
    if (fs.existsSync(VOLUME_DB_PATH)) {
        const stats = fs.statSync(VOLUME_DB_PATH);
        if (stats.size > 5000) isDbValid = true; 
    }

    if (!isDbValid) {
        console.log("⚠️ Volume DB is missing or EMPTY! Forcing copy from code...");
        if (fs.existsSync(CODE_DB_PATH)) {
            try {
                fs.copyFileSync(CODE_DB_PATH, VOLUME_DB_PATH);
                console.log("✅ SUCCESS: Overwrote empty Volume DB with actual database.");
            } catch (err) {
                console.error("❌ ERROR: Failed to copy database file:", err);
            }
        } else {
            console.error("❌ ERROR: Hindi mahanap ang database sa VS Code. Did you push it?");
        }
    } else {
        console.log("✅ Valid database found in Volume. Using it.");
    }

    dbPath = VOLUME_DB_PATH;
} else {
    console.log("ℹ️ Local environment. Using local file.");
    dbPath = CODE_DB_PATH;
}

console.log("📂 Final Database Path:", dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ FATAL ERROR opening database:', err.message);
  } else {
    console.log('✅ Connected to SQLite database.');
    db.exec('PRAGMA foreign_keys = ON;', () => {});
    runMigrations(db); 
  }
});

module.exports = db;