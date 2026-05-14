// config/database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

/**
 * --- FINAL CORRECTED MIGRATION LOGIC ---
 * Sinisiguro nito ang tamang order ng table creation at column updates.
 */
function runMigrations(db) {
  db.serialize(() => {
    console.log("🛠️  Running database migrations...");

    // 1. Siguraduhin na gawa ang Users table (kasama ang 'status' column para sa fresh setup)
    db.run(`
      CREATE TABLE IF NOT EXISTS Users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        email TEXT,
        status TEXT DEFAULT 'active'
      );
    `, (err) => {
      if (err) {
        console.error("❌ Error creating Users table:", err.message);
        return;
      }
      console.log("✅ Users table is ready.");

      // 2. Migration: Add 'status' column (para sa mga existing DB na luma ang schema)
      db.run(`ALTER TABLE Users ADD COLUMN status TEXT DEFAULT 'active';`, (err) => {
        if (err && !err.message.includes("duplicate column name")) {
          console.error("Migration Error (status):", err.message);
        }
      });

      // 3. Migration: Add 'two_fa_code'
      db.run(`ALTER TABLE Users ADD COLUMN two_fa_code TEXT;`, (err) => {
        if (err && !err.message.includes("duplicate column name")) {
          console.error("Migration Error (two_fa_code):", err.message);
        }
      });

      // 4. Migration: Add 'two_fa_expires'
      db.run(`ALTER TABLE Users ADD COLUMN two_fa_expires DATETIME;`, (err) => {
        if (err && !err.message.includes("duplicate column name")) {
          console.error("Migration Error (two_fa_expires):", err.message);
        }
      });
    });
  });
}

console.log("--- DATABASE SETUP STARTED ---");

// Path resolution para sa Railway at Local
const CODE_DB_PATH = path.resolve(__dirname, '..', 'data', 'BRIGHTDatabase.db');
const VOLUME_FOLDER = '/app/data'; 
const VOLUME_DB_PATH = path.join(VOLUME_FOLDER, 'BRIGHTDatabase.db');

let dbPath;
const isRailway = process.env.NODE_ENV === 'production';

if (isRailway || fs.existsSync(VOLUME_FOLDER)) {
    console.log("✅ Volume/Production environment detected.");

    if (!fs.existsSync(VOLUME_FOLDER)) {
        fs.mkdirSync(VOLUME_FOLDER, { recursive: true });
    }

    if (!fs.existsSync(VOLUME_DB_PATH)) {
        console.log("⚠️ Database NOT found in Volume. Seeding from code...");
        if (fs.existsSync(CODE_DB_PATH)) {
            try {
                fs.copyFileSync(CODE_DB_PATH, VOLUME_DB_PATH);
                console.log("✅ SUCCESS: Copied initial database to Volume.");
            } catch (err) {
                console.error("❌ ERROR: Failed to copy database file:", err);
            }
        } else {
            console.log("ℹ️ No source DB in /data/ to copy. Creating a fresh one.");
        }
    } else {
        console.log("✅ Existing database found in Volume. Using it.");
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
    
    db.exec('PRAGMA foreign_keys = ON;', (err) => {
      if (err) console.error("Could not enable foreign keys:", err.message);
    });
    
    // Execute the migration logic
    runMigrations(db); 
  }
});

module.exports = db;