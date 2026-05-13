// config/database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

console.log("--- DATABASE SETUP STARTED ---");

const VOLUME_FOLDER = '/app/data'; 
const VOLUME_DB_PATH = path.join(VOLUME_FOLDER, 'BRIGHTDatabase.db');
const isRailway = process.env.NODE_ENV === 'production';

// Siguraduhing may folder sa Railway
if (isRailway && !fs.existsSync(VOLUME_FOLDER)) {
    fs.mkdirSync(VOLUME_FOLDER, { recursive: true });
}

// Direkta na siyang gagamit ng database sa Volume kapag nasa Railway
const dbPath = isRailway ? VOLUME_DB_PATH : path.resolve(__dirname, '..', 'data', 'BRIGHTDatabase.db');

console.log("📂 Database Path:", dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ FATAL ERROR opening database:', err.message);
    } else {
        console.log('✅ Connected to SQLite database.');
    }
});

// 🛡️ THE ULTIMATE ANTI-CRASH: Gagawin niya agad ang table bago mag-run ang website!
db.serialize(() => {
    db.run("PRAGMA foreign_keys = ON;");

    // Piliting buuin ang Users table!
    db.run(`CREATE TABLE IF NOT EXISTS Users (
        user_id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        position TEXT,
        role TEXT NOT NULL,
        password TEXT NOT NULL,
        status TEXT DEFAULT 'Pending',
        requested_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        two_fa_code TEXT,
        two_fa_expires DATETIME
    )`);

    // Siguraduhing nandiyan ang 2FA columns kung sakaling luma ang table
    db.run(`ALTER TABLE Users ADD COLUMN two_fa_code TEXT`, (err) => {});
    db.run(`ALTER TABLE Users ADD COLUMN two_fa_expires DATETIME`, (err) => {});
    
    console.log("✅ Users table is secured and ready!");
});

module.exports = db;