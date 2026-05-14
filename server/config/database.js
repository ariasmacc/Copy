const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

function runMigrations(db) {
  console.log("🛠️  Running database migrations...");
  
  const migrations = [
    `ALTER TABLE Users ADD COLUMN two_fa_code TEXT`,
    `ALTER TABLE Users ADD COLUMN two_fa_expires DATETIME`,
    `ALTER TABLE Users ADD COLUMN reset_token TEXT`,
    `ALTER TABLE Users ADD COLUMN reset_token_expires DATETIME`
  ];

  db.serialize(() => {
    migrations.forEach((sql, index) => {
      db.run(sql, function(err) {
        if (err) {
          if (err.message.includes('duplicate column name')) {
            console.log(`✅ Column already exists (migration ${index + 1})`);
          } else {
            console.log(`⚠️  Migration ${index + 1} failed (non-critical):`, err.message);
          }
        } else {
          console.log(`✅ Migration ${index + 1} completed`);
        }
      });
    });
    
    // Verify Users table structure
    db.all("PRAGMA table_info(Users)", (err, rows) => {
      if (err) {
        console.error("❌ Failed to check Users table:", err);
        return;
      }
      
      const requiredColumns = ['id', 'email', 'password', 'two_fa_code', 'two_fa_expires', 'reset_token', 'reset_token_expires'];
      const userColumns = rows.map(row => row.name);
      
      console.log("📋 Users table columns:", userColumns);
      
      const missing = requiredColumns.filter(col => !userColumns.includes(col));
      if (missing.length > 0) {
        console.error("❌ MISSING COLUMNS:", missing);
      } else {
        console.log("✅ Users table structure verified!");
      }
    });
  });
}

function verifyDatabaseIntegrity(db) {
  console.log("🔍 Verifying database integrity...");
  
  // Check if Users table exists and has data
  db.get("SELECT COUNT(*) as count FROM Users", (err, row) => {
    if (err) {
      console.error("❌ Users table doesn't exist or is corrupted:", err);
      return;
    }
    console.log(`✅ Users table has ${row.count} records`);
  });

  // Check a sample user (first one)
  db.get("SELECT id, email, password FROM Users LIMIT 1", (err, row) => {
    if (err) {
      console.error("❌ Cannot read from Users table:", err);
    } else if (row) {
      console.log("✅ Sample user found:", row.email);
    } else {
      console.log("⚠️  No users in database - login will fail");
    }
  });
}

console.log("--- DATABASE SETUP STARTED ---");

const CODE_DB_PATH = path.resolve(__dirname, '..', 'data', 'BRIGHTDatabase.db');
const VOLUME_FOLDER = '/app/data'; 
const VOLUME_DB_PATH = path.join(VOLUME_FOLDER, 'BRIGHTDatabase.db');

let dbPath;

if (fs.existsSync(VOLUME_FOLDER)) {
    console.log("✅ Volume folder found. Running in Production/Railway.");
    
    // Remove old database first
    if (fs.existsSync(VOLUME_DB_PATH)) {
        fs.unlinkSync(VOLUME_DB_PATH);
        console.log("🗑️  Removed old database file");
    }
    
    // Copy fresh database from code
    if (fs.existsSync(CODE_DB_PATH)) {
        try {
            fs.copyFileSync(CODE_DB_PATH, VOLUME_DB_PATH);
            const stats = fs.statSync(VOLUME_DB_PATH);
            console.log(`✅ SUCCESS: Fresh database copied (${stats.size} bytes)`);
        } catch (err) {
            console.error("❌ FATAL: Failed to copy database:", err);
            process.exit(1);
        }
    } else {
        console.error("❌ FATAL: CODE_DB_PATH doesn't exist:", CODE_DB_PATH);
        process.exit(1);
    }
    dbPath = VOLUME_DB_PATH;
} else {
    console.log("ℹ️ Volume folder NOT found. Using local file.");
    dbPath = CODE_DB_PATH;
}

console.log("Final Database Path:", dbPath);

// Verify file exists and has content
if (!fs.existsSync(dbPath)) {
    console.error("❌ FATAL: Database file doesn't exist:", dbPath);
    process.exit(1);
}

const stats = fs.statSync(dbPath);
if (stats.size === 0) {
    console.error("❌ FATAL: Database file is empty:", dbPath);
    process.exit(1);
}

console.log(`📁 Database file size: ${stats.size} bytes`);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ FATAL ERROR opening database:', err.message);
    process.exit(1);
  } else {
    console.log('✅ Connected to SQLite database.');
    db.exec('PRAGMA foreign_keys = ON;', (err) => {
      if (err) console.error('⚠️  Foreign keys error:', err);
    });
    
    runMigrations(db);
    verifyDatabaseIntegrity(db);
  }
});

module.exports = db;