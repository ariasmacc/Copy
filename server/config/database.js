const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// ---------- SCHEMA DEFINITION ----------
const createTablesSQL = `
  CREATE TABLE IF NOT EXISTS Users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'Validator',
    email TEXT,
    two_fa_code TEXT,
    two_fa_expires DATETIME,
    reset_token TEXT,
    reset_token_expires DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS transactions (
    transaction_id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    category TEXT,
    amount REAL DEFAULT 0,
    name_or_vendor TEXT,
    description TEXT,
    initiated_by TEXT,
    status TEXT DEFAULT 'Pending',
    hash TEXT,
    previous_hash TEXT,
    block_number INTEGER,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    validations INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_name TEXT NOT NULL,
    file_path TEXT,
    type TEXT,
    size REAL DEFAULT 0,
    description TEXT,
    related_transaction TEXT,
    category TEXT,
    uploaded_by TEXT,
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'Pending',
    hash TEXT
  );

  CREATE TABLE IF NOT EXISTS budget (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    allocated REAL DEFAULT 0,
    spent REAL DEFAULT 0,
    year INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS validation (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id TEXT NOT NULL,
    validator TEXT,
    status TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`;

// ---------- PATHS ----------
const CODE_DB_PATH = path.resolve(__dirname, '..', 'data', 'BRIGHTDatabase.db');
const VOLUME_FOLDER = '/app/data'; 
const VOLUME_DB_PATH = path.join(VOLUME_FOLDER, 'BRIGHTDatabase.db');
const VERSION_FILE = path.join(VOLUME_FOLDER, '.db_version');
const CURRENT_VERSION = '4'; // increment when schema changes

let dbPath;

console.log("--- DATABASE SETUP STARTED ---");

// Determine final database path
if (fs.existsSync(VOLUME_FOLDER)) {
    console.log("✅ Volume folder found. Running in Production/Railway.");
    
    const savedVersion = fs.existsSync(VERSION_FILE) ? fs.readFileSync(VERSION_FILE, 'utf8').trim() : '0';
    
    // Copy fresh DB from code if volume DB doesn't exist or version changed
    if (!fs.existsSync(VOLUME_DB_PATH) || savedVersion !== CURRENT_VERSION) {
        console.log("⚠️ Volume DB missing or outdated. Copying fresh database...");
        if (fs.existsSync(CODE_DB_PATH)) {
            try {
                fs.copyFileSync(CODE_DB_PATH, VOLUME_DB_PATH);
                fs.writeFileSync(VERSION_FILE, CURRENT_VERSION);
                console.log("✅ Fresh database copied to volume.");
            } catch (err) {
                console.error("❌ Failed to copy database:", err);
            }
        } else {
            console.error("❌ Source database missing at", CODE_DB_PATH);
        }
    } else {
        console.log("✅ Existing database found in Volume. Using it.");
    }
    dbPath = VOLUME_DB_PATH;
} else {
    console.log("ℹ️ Local environment. Using local file.");
    dbPath = CODE_DB_PATH;
}

console.log("Final Database Path:", dbPath);

// ---------- CONNECT AND INITIALIZE ----------
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ FATAL ERROR opening database:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to SQLite database.');
  
  // Enable foreign keys
  db.exec('PRAGMA foreign_keys = ON;', (pragmaErr) => {
    if (pragmaErr) console.error('Pragma error:', pragmaErr.message);
  });

  // Create all tables if they don't exist
  console.log('🔄 Running schema creation...');
  db.exec(createTablesSQL, (schemaErr) => {
    if (schemaErr) {
      console.error('❌ Schema creation failed:', schemaErr.message);
    } else {
      console.log('✅ All tables verified/created successfully.');
    }
  });
});

module.exports = db;