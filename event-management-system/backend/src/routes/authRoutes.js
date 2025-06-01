// Authentication Routes
const express = require('express');
const authController = require('../controllers/authController');
const { 
  authenticateToken, 
  rateLimit, 
  validateRequired, 
  sanitizeInput 
} = require('../middleware/authMiddleware');

const router = express.Router();

// Apply input sanitization to all routes
router.use(sanitizeInput);

// User registration
router.post('/register', 
  rateLimit(15 * 60 * 1000, 5), // 5 attempts per 15 minutes
  validateRequired(['name', 'email', 'password']),
  authController.register
);

// User login
router.post('/login',
  rateLimit(15 * 60 * 1000, 10), // 10 attempts per 15 minutes
  validateRequired(['email', 'password']),
  authController.login
);

// Organizer registration
router.post('/organizer/register',
  rateLimit(15 * 60 * 1000, 3), // 3 attempts per 15 minutes
  validateRequired(['name', 'email', 'password', 'company']),
  authController.organizerRegister
);

// Organizer login
router.post('/organizer/login',
  rateLimit(15 * 60 * 1000, 10), // 10 attempts per 15 minutes
  validateRequired(['email', 'password']),
  authController.organizerLogin
);

// Logout
router.post('/logout',
  authController.logout
);

// Get current user profile
router.get('/profile',
  authenticateToken,
  authController.getProfile
);

// Change password
router.post('/change-password',
  authenticateToken,
  rateLimit(15 * 60 * 1000, 3), // 3 attempts per 15 minutes
  validateRequired(['currentPassword', 'newPassword']),
  authController.changePassword
);

module.exports = router;