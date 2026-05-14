// config/database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

function runMigrations(db) {
  db.serialize(() => {
    console.log("🛠️  Running database migrations...");

    // 1. Gawa muna ang Users table
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

      // 2. Patakbuhin ang ALTER columns (status, 2FA, etc.)
      // Note: Kahit nandun na sa CREATE TABLE, kailangan ito para sa mga existing DB files.
      db.run(`ALTER TABLE Users ADD COLUMN status TEXT DEFAULT 'active';`, () => {});
      db.run(`ALTER TABLE Users ADD COLUMN two_fa_code TEXT;`, () => {});
      db.run(`ALTER TABLE Users ADD COLUMN two_fa_expires DATETIME;`, () => {
        
        // --- 3. SEEDING LOGIC: Dito dapat sa dulo para siguradong may table at columns na ---
        db.get("SELECT COUNT(*) AS count FROM Users", (err, row) => {
          if (row && row.count === 0) {
            console.log("⚠️  Empty Users table. Seeding default admin...");
            
            const defaultUser = 'SEAdmin';
            const defaultPass = 'password123'; // TANDAAN: Kung hashed dapat ang pass sa code mo, i-hash mo muna ito.
            const defaultRole = 'Administrator';

            db.run(`
              INSERT INTO Users (username, password, role, status) 
              VALUES (?, ?, ?, 'active')
            `, [defaultUser, defaultPass, defaultRole], (err) => {
              if (err) console.error("❌ Seed Error:", err.message);
              else console.log(`✅ Default user '${defaultUser}' created successfully!`);
            });
          }
        });
      });
    });
  });
}

// --- REST OF YOUR DATABASE SETUP CODE ---
console.log("--- DATABASE SETUP STARTED ---");

const CODE_DB_PATH = path.resolve(__dirname, '..', 'data', 'BRIGHTDatabase.db');
const VOLUME_FOLDER = '/app/data'; 
const VOLUME_DB_PATH = path.join(VOLUME_FOLDER, 'BRIGHTDatabase.db');

let dbPath;
const isRailway = process.env.NODE_ENV === 'production';

if (isRailway || fs.existsSync(VOLUME_FOLDER)) {
    if (!fs.existsSync(VOLUME_FOLDER)) fs.mkdirSync(VOLUME_FOLDER, { recursive: true });

    if (!fs.existsSync(VOLUME_DB_PATH)) {
        if (fs.existsSync(CODE_DB_PATH)) {
            try { fs.copyFileSync(CODE_DB_PATH, VOLUME_DB_PATH); } 
            catch (err) { console.error("❌ Failed to copy DB:", err); }
        }
    }
    dbPath = VOLUME_DB_PATH;
} else {
    dbPath = CODE_DB_PATH;
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('❌ FATAL ERROR opening database:', err.message);
  else {
    console.log('✅ Connected to SQLite database.');
    db.exec('PRAGMA foreign_keys = ON;');
    runMigrations(db); 
  }
});

module.exports = db;