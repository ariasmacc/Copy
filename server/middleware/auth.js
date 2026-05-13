// server/middleware/auth.js
const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // 1. MOVE THIS INSIDE: 
  // Pulling it from process.env inside the function ensures it is 
  // loaded even if the server takes a millisecond to read the .env file.
  const JWT_SECRET = process.env.JWT_SECRET;

  // 2. CRITICAL SAFETY CHECK:
  // If the secret is missing, the server will crash anyway. 
  // This log will tell us immediately in the terminal if the .env is failing.
  if (!JWT_SECRET) {
    console.error("❌ CRITICAL: JWT_SECRET is not defined in .env");
    return res.status(500).json({ error: "Internal Server Configuration Error" });
  }

  const token = req.cookies.token;
  
  if (!token) {
    return res.status(401).json({ 
        error: 'Unauthorized. No session token found.' 
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; 
    next();
  } catch (err) {
    // 3. DEBUG LOG:
    // This will tell us if the token is actually expired or just "fake"
    console.error("JWT Auth Error:", err.message);
    
    res.clearCookie('token');
    return res.status(401).json({ error: 'Session expired or invalid. Please login again.' });
  }
};