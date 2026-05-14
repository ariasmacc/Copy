// config/database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// --- NEW MIGRATION FUNCTION ---
function runMigrations(db) {
  // Migration 1: Add two_fa_code
  db.run(`
    ALTER TABLE Users ADD COLUMN two_fa_code TEXT;
  `, (err) => {
    if (err && err.message && !err.message.includes("duplicate column name")) {
      console.error("Migration Error (two_fa_code):", err.message);
    } else if (!err) {
      console.log("✅ Migration: Added two_fa_code column to Users.");
    }
  });
  
  // Migration 2: Add two_fa_expires
  db.run(`
    ALTER TABLE Users ADD COLUMN two_fa_expires DATETIME;
  `, (err) => {
    if (err && err.message && !err.message.includes("duplicate column name")) {
      console.error("Migration Error (two_fa_expires):", err.message);
    } else if (!err) {
      console.log("✅ Migration: Added two_fa_expires column to Users.");
    }
  });
}
// -----------------------------

console.log("--- DATABASE SETUP STARTED ---");

// 1. Define the paths
const CODE_DB_PATH = path.resolve(__dirname, '..', 'data', 'BRIGHTDatabase.db');
const VOLUME_FOLDER = '/app/data'; 
const VOLUME_DB_PATH = path.join(VOLUME_FOLDER, 'BRIGHTDatabase.db');

let dbPath;

// 2. Check if we are running on Railway using NODE_ENV
const isRailway = process.env.NODE_ENV === 'production';

if (isRailway || fs.existsSync(VOLUME_FOLDER)) {
    console.log("✅ Volume/Production environment detected.");

    // Ensure volume folder exists
    if (!fs.existsSync(VOLUME_FOLDER)) {
        fs.mkdirSync(VOLUME_FOLDER, { recursive: true });
    }

    // --- SAFE LOGIC: Only copy if missing ---
    if (!fs.existsSync(VOLUME_DB_PATH)) {
        console.log("⚠️ Database NOT found in Volume. Seeding from code...");
        if (fs.existsSync(CODE_DB_PATH)) {
            try {
                fs.copyFileSync(CODE_DB_PATH, VOLUME_DB_PATH);
                console.log("✅ SUCCESS: Copied initial database to Volume.");
            } catch (err) {
                console.error("❌ ERROR: Failed to copy database file:", err);
            }
        }
    } else {
        console.log("✅ Existing database found in Volume. Using it.");
    }
    // ----------------------------------------

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
    db.exec('PRAGMA foreign_keys = ON;', (err) => {
      if (err) console.error("Could not enable foreign keys:", err.message);
    });
    
    // --- CRITICAL: RUN MIGRATIONS HERE ---
    runMigrations(db); 
    // -------------------------------------
  }
});

module.exports = db;