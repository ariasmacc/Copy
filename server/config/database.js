const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

/**
 * Run database migrations safely.
 */
function runMigrations(db) {
  console.log('🔄 Running database migrations...');

  const migrations = [
    {
      name: 'two_fa_code',
      sql: `ALTER TABLE Users ADD COLUMN two_fa_code TEXT`
    },
    {
      name: 'two_fa_expires',
      sql: `ALTER TABLE Users ADD COLUMN two_fa_expires DATETIME`
    },
    {
      name: 'reset_token',
      sql: `ALTER TABLE Users ADD COLUMN reset_token VARCHAR(255)`
    },
    {
      name: 'reset_token_expires',
      sql: `ALTER TABLE Users ADD COLUMN reset_token_expires DATETIME`
    }
  ];

  db.serialize(() => {
    migrations.forEach((migration) => {
      db.run(migration.sql, (err) => {
        if (err) {
          // Ignore if the column already exists
          if (
            err.message.includes('duplicate column name') ||
            err.message.includes('already exists')
          ) {
            console.log(`ℹ️ ${migration.name} column already exists.`);
          } else {
            console.error(
              `❌ Migration Error (${migration.name}):`,
              err.message
            );
          }
        } else {
          console.log(`✅ Migration: Added ${migration.name} column.`);
        }
      });
    });
  });
}

// =====================================================
// Database Paths
// =====================================================

const CODE_DB_PATH = path.resolve(
  __dirname,
  '..',
  'data',
  'BRIGHTDatabase.db'
);

const VOLUME_FOLDER = '/app/data';
const VOLUME_DB_PATH = path.join(VOLUME_FOLDER, 'BRIGHTDatabase.db');

let dbPath;

console.log('--- DATABASE SETUP STARTED ---');

// =====================================================
// Detect Railway Production Environment
// =====================================================

if (fs.existsSync(VOLUME_FOLDER)) {
  console.log('✅ Volume folder found. Running in Production/Railway.');

  // Seed database only if it does not exist yet
  if (!fs.existsSync(VOLUME_DB_PATH)) {
    console.log('⚠️ Database NOT found in Volume. Seeding from code...');

    if (fs.existsSync(CODE_DB_PATH)) {
      try {
        fs.copyFileSync(CODE_DB_PATH, VOLUME_DB_PATH);
        console.log('✅ SUCCESS: Copied initial database to Volume.');
      } catch (err) {
        console.error('❌ ERROR: Failed to copy database file:', err.message);
      }
    } else {
      console.warn(
        '⚠️ Source database file not found. SQLite will create a new one.'
      );
    }
  } else {
    console.log('✅ Existing database found in Volume. Using it.');
  }

  dbPath = VOLUME_DB_PATH;
} else {
  console.log('ℹ️ Volume folder NOT found. Using local database file.');

  // Ensure local data folder exists
  const localFolder = path.dirname(CODE_DB_PATH);
  if (!fs.existsSync(localFolder)) {
    fs.mkdirSync(localFolder, { recursive: true });
  }

  dbPath = CODE_DB_PATH;
}

console.log('Final Database Path:', dbPath);

// =====================================================
// Open Database
// =====================================================

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ FATAL ERROR opening database:', err.message);
    return;
  }

  console.log('✅ Connected to SQLite database.');

  db.serialize(() => {
    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON;', (pragmaErr) => {
      if (pragmaErr) {
        console.error(
          '❌ Could not enable foreign keys:',
          pragmaErr.message
        );
      }
    });

    // Run migrations
    runMigrations(db);
  });
});

// =====================================================
// Export Database
// =====================================================

module.exports = db;