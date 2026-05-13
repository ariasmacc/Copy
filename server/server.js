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


// IMPORTANT: Do NOT include 'const path = require('path');' again
// further down in the file, or it will cause a "Redeclaration" error.


// --- [UPDATED] FILE RESCUE OPERATION (Database + Uploads) ---
function syncUploadsToVolume() {
   console.log("🔄 Starting File Rescue Operation...");
  
   // 1. Setup Paths
   const dbFileName = 'BRIGHTDatabase.db';
   const sourceDb = path.join(__dirname, 'data', dbFileName);
   const sourceUploads = path.join(__dirname, 'data'); 


   let destRoot;
   if (process.env.RAILWAY_ENVIRONMENT_NAME) {
       destRoot = '/app/data'; // Railway Volume
   } else {
       console.log("ℹ️ Local environment. Skipping rescue.", sourceDb);
       return;
   }


   const destUploads = path.join(destRoot, 'uploads');
   const destDb = path.join(destRoot, dbFileName);


   // 2. Ensure Volume Exists
   if (!fs.existsSync(destRoot)){
       fs.mkdirSync(destRoot, { recursive: true });
   }


   // --- PART A: RESCUE DATABASE ---
   if (!fs.existsSync(destDb)) {
       if (fs.existsSync(sourceDb)) {
           try {
               fs.copyFileSync(sourceDb, destDb);
               console.log(`✅ [DB RESTORE] Database copied to Volume successfully!`);
           } catch (err) {
               console.error(`❌ [DB ERROR] Failed to copy database:`, err.message);
           }
       } else {
           console.error(`⚠️ Source database not found at ${sourceDb}. Make sure it is committed to GitHub!`);
       }
   } else {
       console.log(`ℹ️ Database already exists in Volume. Skipping copy to prevent overwrite.`);
   }


   // --- PART B: RESCUE UPLOADS ---
   if (!fs.existsSync(destUploads)){
       fs.mkdirSync(destUploads, { recursive: true });
   }


   if (fs.existsSync(sourceUploads)) {
       const files = fs.readdirSync(sourceUploads);
       files.forEach(file => {
           const srcFile = path.join(sourceUploads, file);
           const destFile = path.join(destUploads, file);
           if (!fs.existsSync(destFile)) {
               try {
                   fs.copyFileSync(srcFile, destFile);
               } catch (err) { }
           }
       });
       console.log(`✅ [UPLOADS] Synced missing files.`);
   }
}


// --- NEW IMPORTS ---
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
const PORT = process.env.PORT || 3000;//binago ko sana tama na siya whhhwdn


// --- UPLOAD CONFIGURATION (FIXED) ---
const UPLOAD_DIR = process.env.RAILWAY_ENVIRONMENT
   ? '/app/data/uploads'
   : path.join(__dirname, 'uploads'); //changed


if (!fs.existsSync(UPLOAD_DIR)) {
   fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}


app.use('/uploads', express.static(UPLOAD_DIR));


app.get('/favicon.ico', (req, res) => res.status(204).end());


// --- Middleware ---
// REPLACE the old app.use(cors()) with this:
const corsOptions = {
   origin: 'http://localhost:5173', // Your React Dev Port
   credentials: true,               // REQUIRED: Allows cookies to be sent back and forth
};
app.use(cors(corsOptions));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Make sure this is right below CORS


console.log("Checking Env:", process.env.EMAIL_USER ? "✅ User Found" : "❌ User Missing");
console.log("Checking Env:", process.env.EMAIL_PASS ? "✅ Pass Found" : "❌ Pass Missing");


// --- DEBUG CHECK: Let's see if the variables are actually loading ---
console.log("DEBUG: Testing .env load...");
console.log("EMAIL_USER exists:", process.env.EMAIL_USER ? "✅ YES" : "❌ NO");
console.log("EMAIL_PASS exists:", process.env.EMAIL_PASS ? "✅ YES" : "❌ NO");


const transporter = nodemailer.createTransport({
   service: 'gmail',
   host: 'smtp.gmail.com', // Explicitly setting the host can help
   port: 465,
   secure: true,
   auth: {
       user: process.env.EMAIL_USER,
       pass: process.env.EMAIL_PASS
   }
});


// Verify connection configuration
transporter.verify((error, success) => {
   if (error) {
       console.error("❌ Email Transporter Error:", error);
   } else {
       console.log("✅ Gmail Server is ready to send OTPs!");
   }
});


app.set('transporter', transporter);


// =====================================================================
// NA-COMMENT OUT/BURADO NA ANG HTML ROUTES:
// Hindi na natin kailangan i-serve ang .html files dito sa server.js.
// Ang React (Vite) na sa localhost:5173 ang mag-ha-handle ng frontend UI natin.
// Backend na lang ito (Pure API).
// =====================================================================


// --- API Routes ---


// Public API Routes (No Auth)
app.use('/api/public/overview', overview);
app.use('/api/public/transactions', transaction);
app.use('/api/public/documents', documents);


// Secure API Routes
app.use('/api/budget', auth, checkRole('Admin', 'Validator'), budget);
app.use('/api/expenses', auth, checkRole('Admin', 'Validator'), expenses);
app.use('/api/categories', auth, checkRole('Admin'), categoryRoutes);
app.use('/api/transactions', auth, checkRole('Admin', 'Validator'), transaction);
app.use('/api/documents', auth, checkRole('Admin', 'Validator'), documents);
app.use('/api/overview', auth, checkRole('Admin', 'Validator'), overview);
app.use('/api/validation', auth, checkRole('Admin', 'Validator'), validation);
app.use('/api/users', users);


// --- [NEW] AUDIT TRAIL VIEWER ---
app.get('/admin/view-audit-ledger', (req, res) => {
   let logPath = process.env.RAILWAY_ENVIRONMENT
       ? '/app/data/blockchain_audit_ledger.txt'
       : path.join(__dirname, 'blockchain_audit_ledger.txt');


   if (fs.existsSync(logPath)) {
       fs.readFile(logPath, 'utf8', (err, data) => {
           if (err) return res.status(500).send("Error reading log file.");
           res.send(`
               <html>
               <body style="font-family: monospace; background: #1e1e1e; color: #00ff00; padding: 20px;">
                   <h1>📜 Blockchain Audit Ledger</h1>
                   <p style="color: #fff">This is the permanent record of all transactions.</p>
                   <textarea style="width: 100%; height: 800px; background: #000; color: #0f0; border: 1px solid #555; padding: 15px;">${data}</textarea>
               </body>
               </html>
           `);
       });
   } else {
       res.send("<h1>📜 Blockchain Audit Ledger</h1><p>No records found yet.</p>");
   }
});


// --- [NEW] AUDIT TRAIL DOWNLOADER ---
app.get('/admin/download-ledger', auth, checkRole('Admin'), (req, res) => {
   let logPath = process.env.RAILWAY_ENVIRONMENT
       ? '/app/data/blockchain_audit_ledger.txt'
       : path.join(__dirname, 'blockchain_audit_ledger.txt');


   if (fs.existsSync(logPath)) {
       res.download(logPath, 'OFFICIAL_AUDIT_LEDGER.txt');
   } else {
       res.status(404).send("Ledger file not found.");
   }
});


// --- TEMPORARY DOWNLOAD ROUTE ---
app.get('/admin/download-db', auth, checkRole('Admin'), (req, res) => {
   const volumePath = '/app/data/BRIGHTDatabase.db';
   const localPath = path.join(__dirname, 'data','BRIGHTDatabase.db');
   const dbFile = fs.existsSync(volumePath) ? volumePath : localPath;


   if (fs.existsSync(dbFile)) {
       res.download(dbFile, 'BRIGHTDatabase_Backup.db', (err) => {
           if (err) {
               console.error("Error downloading DB:", err);
               res.status(500).send("Error downloading database.");
           }
       });
   } else {
       console.error(`❌ Download Error: File not found at ${dbFile}`);
       res.status(404).send("Database file not found.");
   }
});


// =====================================================================
// --- DATABASE MIGRATIONS (2FA & Password Reset) ---
// =====================================================================
// We declare 'db' ONLY ONCE here.
const db = require('./config/database');


db.serialize(() => {
   // 1. Add 2FA Columns
   db.run("ALTER TABLE Users ADD COLUMN two_fa_code TEXT", (err) => {
       if (err) console.log("ℹ️ two_fa_code column already exists.");
       else console.log("✅ Added two_fa_code column successfully!");
   });
   db.run("ALTER TABLE Users ADD COLUMN two_fa_expires DATETIME", (err) => {
       if (err) console.log("ℹ️ two_fa_expires column already exists.");
       else console.log("✅ Added two_fa_expires column successfully!");
   });


   // 2. Add Reset Token Columns
   db.run("ALTER TABLE Users ADD COLUMN reset_token TEXT", (err) => {
       if (err) console.log("ℹ️ reset_token column already exists.");
       else console.log("✅ Added reset_token column successfully!");
   });
   db.run("ALTER TABLE Users ADD COLUMN reset_token_expires DATETIME", (err) => {
       if (err) console.log("ℹ️ reset_token_expires column already exists.");
       else console.log("✅ Added reset_token_expires column successfully!");
   });
});


// --- EXECUTE RESCUE OPERATION ---
syncUploadsToVolume();


// --- Start Server ---
app.listen(PORT, () => {
 console.log(`Server is running on http://localhost:${PORT}`);
});


// --- DEBUGGING ROUTE (Delete this later) ---
app.get('/secret-file-check', (req, res) => {
   const fs = require('fs');
   const path = require('path');
   const volumePath = '/app/data';
   let output = '<h1>Server Storage Check</h1>';
  
   output += `<h3>📂 Checking: ${volumePath}</h3>`;
   try {
       if (fs.existsSync(volumePath)) {
           const files = fs.readdirSync(volumePath);
           output += `<ul>`;
           files.forEach(f => output += `<li>${f}</li>`);
           output += `</ul>`;
       } else {
           output += `<p style="color:red">❌ Volume Folder NOT Found!</p>`;
       }
   } catch (err) {
       output += `<p>Error: ${err.message}</p>`;
   }


   const uploadsPath = path.join(volumePath, 'uploads');
   output += `<h3>📂 Checking: ${uploadsPath}</h3>`;
   try {
       if (fs.existsSync(uploadsPath)) {
           const files = fs.readdirSync(uploadsPath);
           if (files.length === 0) output += `<p><i>(Folder is empty)</i></p>`;
           output += `<ul>`;
           files.forEach(f => output += `<li>${f}</li>`);
           output += `</ul>`;
       } else {
           output += `<p style="color:orange">⚠️ Uploads folder not created yet (Normal if no uploads yet)</p>`;
       }
   } catch (err) {
       output += `<p>Error: ${err.message}</p>`;
   }
  
   output += `<hr><p>Server Time: ${new Date().toString()}</p>`;
   res.send(output);
});


// --- SECRET TESTING ZONE (Start) ---
const uploadMiddleware = require('./middleware/upload');


app.get('/secret-upload-test', (req, res) => {
   res.send(`
       <html>
           <body style="font-family: sans-serif; padding: 50px; text-align: center;">
               <h1>🕵️ Secret Storage Tester</h1>
               <p>This uploads to the Server Volume ONLY. No Database record.</p>
               <form action="/secret-upload-test" method="post" enctype="multipart/form-data">
                   <input type="file" name="supportingDocuments" required>
                   <br><br>
                   <button type="submit" style="padding: 10px 20px; cursor: pointer;">Test Upload</button>
               </form>
           </body>
       </html>
   `);
});


app.post('/secret-upload-test', uploadMiddleware, (req, res) => {
   if (!req.files || req.files.length === 0) {
       return res.send('❌ Upload Failed: No file received.');
   }
   const file = req.files[0];
   const webPath = '/uploads/' + file.filename;


   res.send(`
       <html>
           <body style="font-family: sans-serif; padding: 50px; text-align: center;">
               <h1 style="color: green;">✅ Upload Successful!</h1>
               <p>File saved to Volume: <b>${file.filename}</b></p>
               <hr>
               <h3>Testing "View" & "Download":</h3>
               <p>Click the link below. If you see the image, FIXED NA ANG SERVER.</p>
               <a href="${webPath}" target="_blank" style="font-size: 24px; font-weight: bold; color: blue;">
                   👁️ VIEW DOCUMENT HERE
               </a>
               <br><br>
               <a href="/secret-upload-test">Test Another File</a>
           </body>
       </html>
   `);
});

