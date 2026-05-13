// server/middleware/auth.js
const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  const JWT_SECRET = process.env.JWT_SECRET;

  if (!JWT_SECRET) {
    console.error("❌ CRITICAL: JWT_SECRET is not defined in .env");
    return res.status(500).json({ error: "Internal Server Configuration Error" });
  }

  // Check cookie first, then Authorization header as fallback
  let token = req.cookies.token;
  
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }
  
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
    console.error("JWT Auth Error:", err.message);
    res.clearCookie('token');
    return res.status(401).json({ error: 'Session expired or invalid. Please login again.' });
  }
};