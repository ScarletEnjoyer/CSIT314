// Authentication Middleware
const jwt = require('jsonwebtoken');
const database = require('../config/database');

// Verify JWT token and authenticate user
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'Access token is required'
      });
    }

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'default_secret_change_in_production'
    );

    // Check if user/organizer still exists and is active
    let user;
    if (decoded.type === 'organizer') {
      user = await database.get(
        'SELECT id, name, email, is_active FROM organizers WHERE id = ?',
        [decoded.id]
      );
    } else {
      user = await database.get(
        'SELECT id, name, email, role, is_active FROM users WHERE id = ?',
        [decoded.id]
      );
    }

    if (!user) {
      return res.status(401).json({
        error: 'User not found'
      });
    }

    if (!user.is_active) {
      return res.status(401).json({
        error: 'Account is deactivated'
      });
    }

    // Add user info to request
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      type: decoded.type,
      role: user.role || null
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired'
      });
    }

    console.error('Authentication error:', error);
    return res.status(500).json({
      error: 'Authentication failed'
    });
  }
};

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      req.user = null;
      return next();
    }

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'default_secret_change_in_production'
    );

    // Check if user/organizer exists
    let user;
    if (decoded.type === 'organizer') {
      user = await database.get(
        'SELECT id, name, email, is_active FROM organizers WHERE id = ?',
        [decoded.id]
      );
    } else {
      user = await database.get(
        'SELECT id, name, email, role, is_active FROM users WHERE id = ?',
        [decoded.id]
      );
    }

    if (user && user.is_active) {
      req.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        type: decoded.type,
        role: user.role || null
      };
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    // If token is invalid, just continue without user
    req.user = null;
    next();
  }
};

// Require specific user type
const requireUserType = (userType) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    if (req.user.type !== userType) {
      return res.status(403).json({
        error: `${userType} access required`
      });
    }

    next();
  };
};

// Require organizer access
const requireOrganizer = requireUserType('organizer');

// Require user access
const requireUser = requireUserType('user');

// Require admin access
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Administrator access required'
    });
  }

  next();
};

// Rate limiting for sensitive operations
const rateLimitMap = new Map();

const rateLimit = (windowMs = 15 * 60 * 1000, maxAttempts = 5) => {
  return (req, res, next) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    
    // Clean old entries
    for (const [ip, data] of rateLimitMap.entries()) {
      if (now - data.firstAttempt > windowMs) {
        rateLimitMap.delete(ip);
      }
    }

    const userData = rateLimitMap.get(key);
    
    if (!userData) {
      rateLimitMap.set(key, {
        attempts: 1,
        firstAttempt: now
      });
      return next();
    }

    if (userData.attempts >= maxAttempts) {
      const timeLeft = Math.ceil((userData.firstAttempt + windowMs - now) / 1000);
      return res.status(429).json({
        error: 'Too many attempts. Please try again later.',
        retryAfter: timeLeft
      });
    }

    userData.attempts++;
    next();
  };
};

// Validate request body fields
const validateRequired = (fields) => {
  return (req, res, next) => {
    const missing = [];
    
    for (const field of fields) {
      if (req.body[field] === undefined || req.body[field] === null || req.body[field] === '') {
        missing.push(field);
      }
    }

    if (missing.length > 0) {
      return res.status(400).json({
        error: 'Missing required fields',
        missing_fields: missing
      });
    }

    next();
  };
};

// Sanitize input data
const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        // Trim whitespace
        obj[key] = obj[key].trim();
        
        // Basic XSS protection
        obj[key] = obj[key]
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;')
          .replace(/\//g, '&#x2F;');
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitize(obj[key]);
      }
    }
  };

  if (req.body) {
    sanitize(req.body);
  }

  if (req.query) {
    sanitize(req.query);
  }

  next();
};

// Check resource ownership
const checkOwnership = (resourceType) => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params.id;
      let resource;

      switch (resourceType) {
        case 'event':
          resource = await database.get(
            'SELECT organizer_id FROM events WHERE id = ?',
            [resourceId]
          );
          if (resource && req.user.type === 'organizer' && resource.organizer_id == req.user.id) {
            return next();
          }
          break;

        case 'registration':
          resource = await database.get(
            'SELECT user_id, event_id FROM registrations WHERE id = ?',
            [resourceId]
          );
          if (resource) {
            // User can access their own registrations
            if (req.user.type === 'user' && resource.user_id == req.user.id) {
              return next();
            }
            // Organizer can access registrations for their events
            if (req.user.type === 'organizer') {
              const event = await database.get(
                'SELECT organizer_id FROM events WHERE id = ?',
                [resource.event_id]
              );
              if (event && event.organizer_id == req.user.id) {
                return next();
              }
            }
          }
          break;

        case 'user':
          if (req.user.type === 'user' && req.user.id == resourceId) {
            return next();
          }
          break;

        default:
          return res.status(400).json({
            error: 'Invalid resource type'
          });
      }

      // Admin can access everything
      if (req.user.role === 'admin') {
        return next();
      }

      return res.status(403).json({
        error: 'You do not have permission to access this resource'
      });

    } catch (error) {
      console.error('Ownership check error:', error);
      return res.status(500).json({
        error: 'Internal server error'
      });
    }
  };
};

// Log API requests
const logRequest = (req, res, next) => {
  const start = Date.now();
  
  // Log when response finishes
  res.on('finish', () => {
    const duration = Date.now() - start;
    const userInfo = req.user ? `${req.user.type}:${req.user.id}` : 'anonymous';
    
    console.log(
      `${new Date().toISOString()} - ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms - ${userInfo}`
    );
  });

  next();
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireUserType,
  requireOrganizer,
  requireUser,
  requireAdmin,
  rateLimit,
  validateRequired,
  sanitizeInput,
  checkOwnership,
  logRequest
};