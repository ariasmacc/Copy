// 1. First, we import the path module
const path = require('path');

// 2. Now that 'path' is defined, we can safely use it to find your .env
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// 3. Set the timezone
process.env.TZ = 'Asia/Manila';
console.log("Server time set to:", new Date().toString());

// 4. Import the rest of your tools
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const fs = require('fs');

// --- FILE RESCUE OPERATION (Database + Uploads) ---
function syncUploadsToVolume() {
   console.log("🔄 Starting File Rescue Operation...");
  
   const dbFileName = 'BRIGHTDatabase.db';
   const sourceDb = path.join(__dirname, 'data', dbFileName);
   const sourceUploads = path.join(__dirname, 'data'); 

   let destRoot;
   if (process.env.RAILWAY_ENVIRONMENT_NAME) {
       destRoot = '/app/data';
   } else {
       console.log("ℹ️ Local environment. Skipping rescue.", sourceDb);
       return;
   }

   const destUploads = path.join(destRoot, 'uploads');
   const destDb = path.join(destRoot, dbFileName);

   if (!fs.existsSync(destRoot)){
       fs.mkdirSync(destRoot, { recursive: true });
   }

   if (!fs.existsSync(destDb)) {
       if (fs.existsSync(sourceDb)) {
           try {
               fs.copyFileSync(sourceDb, destDb);
               console.log(`✅ [DB RESTORE] Database copied to Volume successfully!`);
           } catch (err) {
               console.error(`❌ [DB ERROR] Failed to copy database:`, err.message);
           }
       } else {
           console.error(`⚠️ Source database not found at ${sourceDb}.`);
       }
   } else {
       console.log(`ℹ️ Database already exists in Volume. Skipping copy to prevent overwrite.`);
   }

   if (!fs.existsSync(destUploads)){
       fs.mkdirSync(destUploads, { recursive: true });
   }

   if (fs.existsSync(sourceUploads)) {
       const files = fs.readdirSync(sourceUploads);
       files.forEach(file => {
           const srcFile = path.join(sourceUploads, file);
           const destFile = path.join(destUploads, file);
           if (!fs.existsSync(destFile)) {
               try { fs.copyFileSync(srcFile, destFile); } catch (err) { }
           }
       });
       console.log(`✅ [UPLOADS] Synced missing files.`);
   }
}

// --- IMPORTS ---
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const auth = require('./middleware/auth');
const checkRole = require('./middleware/checkRole');

// --- Import ALL Routes ---
const budget = require('./routes/budget');
const expenses = require('./routes/expenses');
const documents = require('./routes/documents');
const transaction = require('./routes/transaction');
const validation = require('./routes/validation');
const users = require('./routes/users');
const overview = require('./routes/overview');
const categoryRoutes = require('./routes/categoryRoutes');

// --- Initialization ---
const app = express();
const PORT = process.env.PORT || 8080;

// --- UPLOAD CONFIGURATION ---
const UPLOAD_DIR = process.env.RAILWAY_ENVIRONMENT_NAME
   ? '/app/data/uploads'
   : path.join(__dirname, 'uploads'); 

if (!fs.existsSync(UPLOAD_DIR)) {
   fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// --- SERVE STATIC FILES EARLY ---
app.use('/uploads', express.static(UPLOAD_DIR));
app.get('/favicon.ico', (req, res) => res.status(204).end());

// --- CORS Middleware ---
app.use((req, res, next) => {
  const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:5173';
  res.header('Access-Control-Allow-Origin', allowedOrigin);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); 

console.log("Checking Env:", process.env.EMAIL_USER ? "✅ User Found" : "❌ User Missing");
console.log("Checking Env:", process.env.EMAIL_PASS ? "✅ Pass Found" : "❌ Pass Missing");

// --- EMAIL TRANSPORTER ---
const transporter = nodemailer.createTransport({
   host: 'smtp.gmail.com',
   port: 587,
   secure: false,
   family: 4, // Force IPv4 to fix Railway issues
   auth: {
       user: process.env.EMAIL_USER,
       pass: process.env.EMAIL_PASS
   },
   tls: {
       rejectUnauthorized: false
   }
});

transporter.verify((error, success) => {
   if (error) {
       console.error("❌ Email Transporter Error:", error.message);
   } else {
       console.log("✅ Gmail Server is ready to send OTPs!");
   }
});

app.set('transporter', transporter);

// ============================================================
// PUBLIC API ROUTES (No Authentication Required)
// MUST be defined BEFORE authenticated routes
// ============================================================

// --- PUBLIC OVERVIEW ROUTES ---

// Get budget summary
app.get('/api/public/overview/summary', (req, res) => {
  const db = require('./config/database');
  
  const query = `
    SELECT 
      COALESCE(SUM(CASE WHEN type = 'Allocation' AND status = 'Approved' THEN amount ELSE 0 END), 0) as totalBudget,
      COALESCE(SUM(CASE WHEN type = 'Expense' AND status = 'Approved' THEN amount ELSE 0 END), 0) as totalSpent
    FROM transactions
  `;
  
  db.get(query, [], (err, row) => {
    if (err) {
      console.error('Public summary error:', err);
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    res.json(row || { totalBudget: 0, totalSpent: 0 });
  });
});

// Get budget utilization by category
app.get('/api/public/overview/utilization', (req, res) => {
  const db = require('./config/database');
  
  const query = `
    SELECT 
      COALESCE(category, 'Uncategorized') as category,
      COALESCE(SUM(CASE WHEN type = 'Allocation' AND status = 'Approved' THEN amount ELSE 0 END), 0) as totalAllocated,
      COALESCE(SUM(CASE WHEN type = 'Expense' AND status = 'Approved' THEN amount ELSE 0 END), 0) as totalSpent
    FROM transactions
    WHERE status = 'Approved'
    GROUP BY category
    ORDER BY category
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Public utilization error:', err);
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    res.json(rows || []);
  });
});

// Get monthly spending trend
app.get('/api/public/overview/spending-trend', (req, res) => {
  const db = require('./config/database');
  
  const query = `
    SELECT 
      strftime('%Y-%m', timestamp) as month,
      COALESCE(SUM(amount), 0) as totalSpent
    FROM transactions
    WHERE type = 'Expense' 
      AND status = 'Approved'
      AND timestamp >= datetime('now', '-6 months')
    GROUP BY strftime('%Y-%m', timestamp)
    ORDER BY month ASC
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Public trend error:', err);
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    res.json(rows || []);
  });
});

// --- PUBLIC TRANSACTIONS ROUTES ---

// Get all public transactions
app.get('/api/public/transactions', (req, res) => {
  const db = require('./config/database');
  
  const query = `
    SELECT 
      t.*,
      (SELECT COUNT(*) FROM validation v WHERE v.transaction_id = t.transaction_id) as validations
    FROM transactions t
    WHERE t.status = 'Approved'
    ORDER BY t.timestamp DESC
    LIMIT 100
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Public transactions error:', err);
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    res.json(rows || []);
  });
});

// Export public transactions to CSV
app.get('/api/public/transactions/export', (req, res) => {
  const db = require('./config/database');
  
  const query = `
    SELECT 
      transaction_id, type, category, amount, name_or_vendor,
      initiated_by, status, timestamp, hash, block_number
    FROM transactions
    WHERE status = 'Approved'
    ORDER BY timestamp DESC
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Public export error:', err);
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    
    // Generate CSV
    const headers = ['Transaction ID', 'Type', 'Category', 'Amount', 'Description', 'Initiated By', 'Status', 'Date', 'Hash', 'Block'];
    let csv = headers.join(',') + '\n';
    
    rows.forEach(row => {
      csv += [
        row.transaction_id || '',
        row.type || '',
        row.category || '',
        row.amount || 0,
        `"${(row.name_or_vendor || '').replace(/"/g, '""')}"`,
        row.initiated_by || '',
        row.status || '',
        row.timestamp || '',
        row.hash || '',
        row.block_number || ''
      ].join(',') + '\n';
    });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=public_transactions.csv');
    res.send(csv);
  });
});

// --- PUBLIC DOCUMENTS ROUTES ---

// Get all public documents
app.get('/api/public/documents', (req, res) => {
  const db = require('./config/database');
  
  const query = `
    SELECT 
      id, file_name, file_path, type, size, description,
      related_transaction, category, uploaded_by, date, status, hash
    FROM documents
    WHERE status = 'Approved' OR status = 'Verified'
    ORDER BY date DESC
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Public documents error:', err);
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    res.json(rows || []);
  });
});

// Download public document
app.get('/api/public/documents/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(UPLOAD_DIR, filename);
  
  console.log('Download request for:', filename);
  console.log('Looking in:', filePath);
  
  if (fs.existsSync(filePath)) {
    res.download(filePath, filename, (err) => {
      if (err) {
        console.error('Download error:', err);
        res.status(500).json({ error: 'Download failed' });
      }
    });
  } else {
    res.status(404).json({ error: 'File not found', path: filePath });
  }
});

// ============================================================
// AUTHENTICATED API ROUTES (Require Login)
// ============================================================

app.use('/api/budget', auth, checkRole('Admin', 'Validator'), budget);
app.use('/api/expenses', auth, checkRole('Admin', 'Validator'), expenses);
app.use('/api/categories', auth, checkRole('Admin'), categoryRoutes);
app.use('/api/transactions', auth, checkRole('Admin', 'Validator'), transaction);
app.use('/api/documents', auth, checkRole('Admin', 'Validator'), documents);
app.use('/api/overview', auth, checkRole('Admin', 'Validator'), overview);
app.use('/api/validation', auth, checkRole('Admin', 'Validator'), validation);
app.use('/api/users', users);

// --- API Error Handlers ---
app.use('/api', (err, req, res, next) => {
    console.error("🔥 API CRASH:", err);
    res.status(500).json({ error: "Backend error: " + err.message });
});

app.use('/api/*', (req, res) => {
    res.status(404).json({ error: `API Link missing: ${req.method} ${req.originalUrl}` });
});

// --- AUDIT TRAIL VIEWER ---
app.get('/admin/view-audit-ledger', (req, res) => {
   let logPath = process.env.RAILWAY_ENVIRONMENT_NAME
       ? '/app/data/blockchain_audit_ledger.txt'
       : path.join(__dirname, 'blockchain_audit_ledger.txt');

   if (fs.existsSync(logPath)) {
       fs.readFile(logPath, 'utf8', (err, data) => {
           if (err) return res.status(500).send("Error reading log file.");
           res.send(`<html><body style="font-family: monospace; background: #1e1e1e; color: #00ff00; padding: 20px;"><h1>📜 Blockchain Audit Ledger</h1><textarea style="width: 100%; height: 800px; background: #000; color: #0f0; border: 1px solid #555; padding: 15px;">${data}</textarea></body></html>`);
       });
   } else {
       res.send("<h1>📜 Blockchain Audit Ledger</h1><p>No records found yet.</p>");
   }
});

// --- AUDIT TRAIL DOWNLOADER ---
app.get('/admin/download-ledger', auth, checkRole('Admin'), (req, res) => {
   let logPath = process.env.RAILWAY_ENVIRONMENT_NAME
       ? '/app/data/blockchain_audit_ledger.txt'
       : path.join(__dirname, 'blockchain_audit_ledger.txt');

   if (fs.existsSync(logPath)) {
       res.download(logPath, 'OFFICIAL_AUDIT_LEDGER.txt');
   } else {
       res.status(404).send("Ledger file not found.");
   }
});

// --- DB DOWNLOAD ROUTE ---
app.get('/admin/download-db', auth, checkRole('Admin'), (req, res) => {
   const volumePath = '/app/data/BRIGHTDatabase.db';
   const localPath = path.join(__dirname, 'data','BRIGHTDatabase.db');
   const dbFile = fs.existsSync(volumePath) ? volumePath : localPath;

   if (fs.existsSync(dbFile)) {
       res.download(dbFile, 'BRIGHTDatabase_Backup.db', (err) => {
           if (err) res.status(500).send("Error downloading database.");
       });
   } else {
       res.status(404).send("Database file not found.");
   }
});

// --- DATABASE MIGRATIONS ---
const db = require('./config/database');

db.serialize(() => {
   db.run("ALTER TABLE Users ADD COLUMN two_fa_code TEXT", () => {});
   db.run("ALTER TABLE Users ADD COLUMN two_fa_expires DATETIME", () => {});
   db.run("ALTER TABLE Users ADD COLUMN reset_token TEXT", () => {});
   db.run("ALTER TABLE Users ADD COLUMN reset_token_expires DATETIME", () => {});
});

// --- EXECUTE RESCUE OPERATION ---
syncUploadsToVolume();

// --- SECRET UPLOAD TEST ---
const uploadMiddleware = require('./middleware/upload');

app.get('/secret-upload-test', (req, res) => {
   res.send(`<html><body style="font-family: sans-serif; padding: 50px; text-align: center;"><h1>🕵️ Secret Storage Tester</h1><form action="/secret-upload-test" method="post" enctype="multipart/form-data"><input type="file" name="supportingDocuments" required><br><br><button type="submit">Test Upload</button></form></body></html>`);
});

app.post('/secret-upload-test', uploadMiddleware, (req, res) => {
   if (!req.files || req.files.length === 0) return res.send('❌ Upload Failed: No file received.');
   res.send(`<h1 style="color: green;">✅ Upload Successful!</h1><p>File: <b>${req.files[0].filename}</b></p>`);
});

// ============================================================
// DEBUG ROUTE (Remove in production)
// ============================================================
app.get('/api/debug', (req, res) => {
  const database = require('./config/database');
  
  database.get("SELECT COUNT(*) as count FROM transactions", [], (err, txRow) => {
    if (err) {
      return res.json({ error: err.message });
    }
    
    database.get("SELECT COUNT(*) as count FROM documents", [], (err2, docRow) => {
      if (err2) {
        return res.json({ error: err2.message, transactions: txRow });
      }
      
      database.get("SELECT COUNT(*) as count FROM Users", [], (err3, userRow) => {
        res.json({
          success: true,
          database: 'Connected',
          tables: {
            transactions: txRow?.count || 0,
            documents: docRow?.count || 0,
            users: userRow?.count || 0
          },
          uploads: {
            path: UPLOAD_DIR,
            exists: fs.existsSync(UPLOAD_DIR),
            files: fs.existsSync(UPLOAD_DIR) ? fs.readdirSync(UPLOAD_DIR).length : 0
          }
        });
      });
    });
  });
});

// ============================================================
// SERVE REACT FRONTEND (MUST BE LAST)
// ============================================================
const clientBuildPath = path.resolve(__dirname, '..', 'client', 'dist');

app.use(express.static(clientBuildPath));

app.get('*', (req, res) => {
    // Only serve index.html for non-API routes
    if (!req.path.startsWith('/api/') && !req.path.startsWith('/admin/') && !req.path.startsWith('/uploads/')) {
        const indexPath = path.join(clientBuildPath, 'index.html');
        if (fs.existsSync(indexPath)) {
            res.sendFile(indexPath);
        } else {
            res.status(404).send(`<div style="font-family: sans-serif; padding: 40px; text-align: center;"><h2>Backend is running! 🚀</h2><p>Frontend build not found yet. Please run: npm run build in the client folder</p></div>`);
        }
    } else {
        res.status(404).json({ error: 'Route not found' });
    }
});

// --- Start Server ---
app.listen(PORT, () => {
 console.log(`\n========================================`);
 console.log(`✅ Server is running on port ${PORT}`);
 console.log(`📁 Uploads directory: ${UPLOAD_DIR}`);
 console.log(`🌐 Public API: http://localhost:${PORT}/api/public`);
 console.log(`🔍 Debug endpoint: http://localhost:${PORT}/api/debug`);
 console.log(`========================================\n`);
});