const db = require('./config/database');

const categories = [
  [1, 'Events & Activities'],
  [2, 'Travel & Conferences'],
  [3, 'Supplies & Materials'],
  [4, 'Marketing & Outreach'],
  [5, 'Equipment & Technology'],
  [6, 'Emergency Fund']
];

db.serialize(() => {
  const stmt = db.prepare("INSERT OR IGNORE INTO Categories (category_id, name) VALUES (?, ?)");
  categories.forEach(cat => stmt.run(cat));
  stmt.finalize();
  console.log("✅ Categories seeded successfully!");
});