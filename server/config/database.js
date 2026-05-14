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

// --- FORCE SEED LOGIC ---
if (fs.existsSync(VOLUME_FOLDER)) {
    console.log("✅ Volume folder found.");

    if (fs.existsSync(CODE_DB_PATH)) {
        try {
            console.log("🔄 Force copying database from code to Volume...");
            fs.copyFileSync(CODE_DB_PATH, VOLUME_DB_PATH);
            console.log("✅ SUCCESS: Database forcefully synced to Volume.");
        } catch (err) {
            console.error("❌ ERROR: Failed to force copy database:", err);
        }
    } else {
        console.error("❌ ERROR: Hindi mahanap ang database file sa VS Code (server/data/)!");
    }

    dbPath = VOLUME_DB_PATH;
} else {
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