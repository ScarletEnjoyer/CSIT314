// Registration Routes
const express = require('express');
const registrationController = require('../controllers/registrationController');
const { 
  authenticateToken, 
  optionalAuth,
  requireOrganizer,
  validateRequired, 
  sanitizeInput,
  checkOwnership
} = require('../middleware/authMiddleware');

const router = express.Router();

// Apply input sanitization to all routes
router.use(sanitizeInput);

// Register for an event
router.post('/',
  optionalAuth, // Optional because guest registration is allowed
  validateRequired(['event_id', 'ticket_type', 'attendee_name', 'attendee_email']),
  registrationController.registerForEvent
);

// Get user's registrations
router.get('/user/:userId',
  authenticateToken,
  registrationController.getUserRegistrations
);

// Get event registrations (for organizers)
router.get('/event/:eventId',
  authenticateToken,
  requireOrganizer,
  registrationController.getEventRegistrations
);

// Get single registration details
router.get('/:id',
  authenticateToken,
  checkOwnership('registration'),
  registrationController.getRegistration
);

// Cancel registration
router.delete('/:id',
  authenticateToken,
  checkOwnership('registration'),
  registrationController.cancelRegistration
);

// Check in attendee (for organizers)
router.post('/checkin',
  authenticateToken,
  requireOrganizer,
  validateRequired(['ticketCode']),
  registrationController.checkInAttendee
);

// Get registration statistics for event (for organizers)
router.get('/stats/:eventId',
  authenticateToken,
  requireOrganizer,
  registrationController.getRegistrationStats
);

module.exports = router;