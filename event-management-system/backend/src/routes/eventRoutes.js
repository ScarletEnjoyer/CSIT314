// Event Routes
const express = require('express');
const eventController = require('../controllers/eventController');
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

// Get all events (public, with optional auth for personalization)
router.get('/',
  optionalAuth,
  eventController.getAllEvents
);

// Get single event by ID (public)
router.get('/:id',
  optionalAuth,
  eventController.getEventById
);

// Create new event (organizers only)
router.post('/',
  authenticateToken,
  requireOrganizer,
  validateRequired(['title', 'description', 'date', 'time', 'location', 'category']),
  eventController.createEvent
);

// Update event (organizers only, own events)
router.put('/:id',
  authenticateToken,
  requireOrganizer,
  checkOwnership('event'),
  eventController.updateEvent
);

// Delete event (organizers only, own events)
router.delete('/:id',
  authenticateToken,
  requireOrganizer,
  checkOwnership('event'),
  eventController.deleteEvent
);

// Get events by organizer
router.get('/organizer/:organizerId',
  authenticateToken,
  eventController.getOrganizerEvents
);

module.exports = router;