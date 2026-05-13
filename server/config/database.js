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
console.log("📂 Database Path:", dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('❌ FATAL ERROR opening database:', err.message);
    else console.log('✅ Connected to SQLite database.');
});

db.serialize(() => {
    db.run("PRAGMA foreign_keys = ON;");

    // 1. Burahin muna natin yung maling table na ginawa natin kanina
    db.run("DROP TABLE IF EXISTS Users;");

    // 2. Buuin ulit nang may tamang 'password_hash' column!
    db.run(`CREATE TABLE Users (
        user_id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        position TEXT,
        role TEXT NOT NULL,
        password_hash TEXT NOT NULL, 
        status TEXT DEFAULT 'Pending',
        requested_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        two_fa_code TEXT,
        two_fa_expires DATETIME
    )`);
    
    console.log("✅ Users table fixed and ready with password_hash!");
});

module.exports = db;