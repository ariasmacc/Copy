const { Sequelize } = require('sequelize');
const path = require('path');

// This logic ensures the database path matches your 'Rescue Operation'
const dbPath = process.env.RAILWAY_ENVIRONMENT_NAME 
    ? '/app/data/BRIGHTDatabase.db' 
    : path.join(__dirname, '..', 'data', 'BRIGHTDatabase.db');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: false, 
});

// Verification check to confirm we are hitting the RIGHT file
const checkActualData = async () => {
  try {
    await sequelize.authenticate();
    const [results] = await sequelize.query("SELECT name FROM sqlite_master WHERE type='table' AND name='Users';");
    
    if (results.length > 0) {
      console.log('✅ SUCCESS: Users table found. Connected to the correct database file.');
    } else {
      console.error('❌ CRITICAL ERROR: Connected to database, but "Users" table is missing. You are likely hitting an empty file at:', dbPath);
    }
  } catch (error) {
    console.error('❌ DB Connection Error:', error.message);
  }
};

checkActualData();

module.exports = sequelize;