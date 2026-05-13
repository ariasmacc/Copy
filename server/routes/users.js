// routes/users.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/userController');
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');

// --- LOGIN ROUTE ---
router.post('/login', controller.login);

// Verify 2FA code
router.post('/verify-2fa', controller.verify2fa);

// --- SIGNUP ROUTE ---
router.post(
  '/signup',
  [
    // Rules
    body('username', 'Username is required').notEmpty().trim(),
    body('full_name', 'Full name is required').notEmpty().trim(),
    body('password', 'Password must be at least 6 characters long')
    .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/[A-Z]/)
      .withMessage('Password must contain at least one uppercase letter')
      .matches(/[0-9]/)
      .withMessage('Password must contain at least one number')
      .matches(/[a-zA-Z0-9]/)
      .withMessage('Password must be alphanumeric')
      .matches(/[!@#$%^&*.]/)
      .withMessage('Password must consist of at least one special character'),
    body('email', 'Please include a valid email').isEmail().normalizeEmail(),
    body('role', 'Role must be Admin or Validator').isIn(['Admin', 'Validator']),
    body('position', 'Position is required').notEmpty().trim()
  ],
  controller.register
);

// --- PASSWORD RESET ROUTES (NEW) ---

// 1. Forgot Password (User submits email)
router.post(
  '/forgot-password',
  [ body('email', 'Please include a valid email').isEmail().normalizeEmail() ],
  controller.forgotPassword // <-- This was missing
);

// 2. Reset Password (User submits new password and token)
router.post(
  '/reset-password',
  [
    body('token', 'Token is required').notEmpty(),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/[A-Z]/)
      .withMessage('Password must contain at least one uppercase letter')
      .matches(/[0-9]/)
      .withMessage('Password must contain at least one number')
      .matches(/[a-zA-Z0-9]/)
      .withMessage('Password must be alphanumeric')
      .matches(/[!@#$%^&*.]/)
      .withMessage('Password must consist of at least one special character')
  ],
  controller.resetPassword // <-- This was missing
);

// ==========================================================
// === MGA BAGONG ADMIN-ONLY ROUTES PARA SA USER MANAGEMENT ===
// ==========================================================

// Route para kunin ang summary data (pending, approved, rejected counts)
router.get(
    '/summary',
    auth,
    checkRole('Admin'),
    controller.getUserSummary
);

// Route para kunin lahat ng user access requests para sa table
router.get(
    '/requests',
    auth,
    checkRole('Admin'),
    controller.getAllUserRequests
);

// Route para i-update ang status ng isang user (approve/reject)
router.put(
    '/status/:userId',
    auth,
    checkRole('Admin'),
    controller.updateUserStatus
);

// --- ACCOUNT MANAGEMENT ROUTES ---
// These require the user to be logged in (auth middleware)

router.put(
  '/account/settings', 
  auth, 
  controller.updateAccountSettings
);

router.put(
  '/account/password', 
  auth, 
  controller.changePassword
);

module.exports = router;