const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    
    // --- FIX: MATCH SERVER.JS LOGIC FOR RAILWAY ---
    let uploadPath;
    
    // Check kung nasa Railway tayo (Production)
    if (process.env.RAILWAY_ENVIRONMENT) {
        uploadPath = '/app/data/uploads'; // Dito dapat sa Volume para di mabura
    } else {
        // Local Development
        uploadPath = path.join(__dirname, '../uploads');
    }
    // ----------------------------------------------
    
    // 1. CHECK IF FOLDER EXISTS, IF NOT, CREATE IT
    if (!fs.existsSync(uploadPath)) {
      console.log(`Creating missing upload directory: ${uploadPath}`);
      try {
          fs.mkdirSync(uploadPath, { recursive: true });
      } catch (err) {
          console.error("Error creating upload directory:", err);
          // Fallback kung sakaling magka-permission error sa Railway (bihira mangyari pero safety net)
          return cb(err);
      }
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Create a unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'file-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter (Security: Only allow images, PDFs, and Docs)
const fileFilter = (req, file, cb) => {
  // Regex para sa extension
  const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  
  // NOTE: Ang 'doc' at 'docx' minsan may mahabang mimetype kaya minsan nagfe-fail ang strict check.
  // Pero sa ngayon, okay lang itong check na ito.
  const mimetype = allowedTypes.test(file.mimetype) || 
                   file.mimetype === 'application/msword' || 
                   file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, PDFs, and Word documents are allowed!'));
  }
};

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 10 // 10MB limit
  },
  fileFilter: fileFilter
});

// Export: Expects <input type="file" name="supportingDocuments" multiple>
module.exports = upload.array('supportingDocuments', 5);