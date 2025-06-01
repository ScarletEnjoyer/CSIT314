// User Routes
const express = require('express');
const userController = require('../controllers/userController');
const { 
  authenticateToken, 
  requireAdmin,
  validateRequired, 
  sanitizeInput
} = require('../middleware/authMiddleware');

const router = express.Router();

// Apply input sanitization to all routes
router.use(sanitizeInput);

// Get user profile
router.get('/:id',
  authenticateToken,
  userController.getUserProfile
);

// Update user profile
router.put('/:id',
  authenticateToken,
  userController.updateUserProfile
);

// Get user dashboard data
router.get('/:id/dashboard',
  authenticateToken,
  userController.getUserDashboard
);

// Get user notifications
router.get('/:id/notifications',
  authenticateToken,
  userController.getUserNotifications
);

// Mark notification as read
router.put('/:id/notifications/:notificationId/read',
  authenticateToken,
  userController.markNotificationRead
);

// Mark all notifications as read
router.put('/:id/notifications/read-all',
  authenticateToken,
  userController.markAllNotificationsRead
);

// Get user activity feed
router.get('/:id/activity',
  authenticateToken,
  userController.getUserActivity
);

// Delete user account
router.delete('/:id',
  authenticateToken,
  userController.deleteUserAccount
);

// Search users (admin only)
router.get('/',
  authenticateToken,
  requireAdmin,
  userController.searchUsers
);

module.exports = router;