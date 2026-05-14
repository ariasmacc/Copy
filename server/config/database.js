const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt'); // Siguraduhin mong may bcrypt ka

const VOLUME_FOLDER = '/app/data'; 
const VOLUME_DB_PATH = path.join(VOLUME_FOLDER, 'BRIGHTDatabase.db');
const isRailway = process.env.NODE_ENV === 'production';

const dbPath = isRailway ? VOLUME_DB_PATH : path.resolve(__dirname, '..', 'data', 'BRIGHTDatabase.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('❌ Database Error:', err.message);
    else console.log('✅ Connected to SQLite database.');
});

db.serialize(async () => {
    db.run("PRAGMA foreign_keys = ON;");

    // 1. Buuin ulit ang Users table (kung wala pa)
    db.run(`CREATE TABLE IF NOT EXISTS Users (
        user_id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        position TEXT,
        role TEXT NOT NULL,
        password_hash TEXT NOT NULL, 
        status TEXT DEFAULT 'Approved',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // 2. ISALPAK SI SEadmin (The Resurrection)
    // Password nito: Admin123!
    const saltRounds = 10;
    const plainPassword = 'Admin123!'; 
    const hash = await bcrypt.hash(plainPassword, saltRounds);

    db.run(`INSERT OR IGNORE INTO Users (full_name, username, email, role, password_hash, status) 
            VALUES ('System Administrator', 'SEadmin', 'admin@bright.com', 'Admin', ?, 'Approved')`, 
            [hash], (err) => {
        if (err) console.error("❌ Seed Error:", err.message);
        else console.log("✅ SEadmin is back! Password: Admin123!");
    });
});

module.exports = db;