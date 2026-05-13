// This is a special middleware that returns a function.
// This lets us pass arguments to it (like 'Validator' or 'Admin').

const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    // req.user was set by the 'auth' middleware
    if (!req.user || !req.user.role) {
      return res.status(401).json({ error: 'Access denied. No user role found.' });
    }

    // Check if the user's role is in the list of allowedRoles
    if (!allowedRoles.includes(req.user.role)) {
      
      // If it's an API request, send JSON
      if (req.path.startsWith('/api/')) {
        return res.status(403).json({ error: 'Forbidden. You do not have permission for this role.' });
      }
      
      // If it's a page request, just redirect them to their main page
      // (This is friendlier than showing an error)
      return res.redirect('/admin/overview');
    }

    // Role is allowed, continue
    next();
  };
};

module.exports = checkRole;