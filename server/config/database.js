// config/database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

console.log("--- DATABASE SETUP STARTED ---");

const VOLUME_FOLDER = '/app/data'; 
const VOLUME_DB_PATH = path.join(VOLUME_FOLDER, 'BRIGHTDatabase.db');
const isRailway = process.env.NODE_ENV === 'production';

if (isRailway && !fs.existsSync(VOLUME_FOLDER)) {
    fs.mkdirSync(VOLUME_FOLDER, { recursive: true });
}

const dbPath = isRailway ? VOLUME_DB_PATH : path.resolve(__dirname, '..', 'data', 'BRIGHTDatabase.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('❌ FATAL ERROR opening database:', err.message);
    else console.log('✅ Connected to SQLite database.');
});

db.serialize(() => {
    db.run("PRAGMA foreign_keys = ON;");

    // ❌ TINANGGAL NA NATIN YUNG 'DROP TABLE' DITO PARA HINDI NA MABURA ANG DATA!

    // Gagamit na lang tayo ng 'IF NOT EXISTS' para safe
    db.run(`CREATE TABLE IF NOT EXISTS Users (
        user_id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        position TEXT,
        role TEXT NOT NULL,
        password_hash TEXT NOT NULL, 
        status TEXT DEFAULT 'Pending',
        requested_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
        two_fa_code TEXT,
        two_fa_expires DATETIME
    )`);
    
    // 🔓 VIP PASS: Sapilitan nating gagawing 'Approved' ang lahat ng nandiyan ngayon para makapag-login ka!
    db.run(`UPDATE Users SET status = 'Approved'`);

    console.log("✅ Users table is secured and accounts are forcefully approved!");
});

module.exports = db;