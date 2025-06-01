// Event Management System - Backend Server
// CSIT 314 Group Project

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const eventRoutes = require('./src/routes/eventRoutes');
const registrationRoutes = require('./src/routes/registrationRoutes');
const userRoutes = require('./src/routes/userRoutes');

// Import middleware
const errorHandler = require('./src/middleware/errorHandler');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// ===========================================
// Security Middleware
// ===========================================

// Helmet for security headers
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    'file://',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Rate limiting for API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiting to API routes
app.use('/api/', apiLimiter);

// ===========================================
// General Middleware
// ===========================================

// Logging (only in development)
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving (for uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ===========================================
// API Routes
// ===========================================

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Event Management API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    uptime: process.uptime()
  });
});

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'Event Management System API',
    version: '1.0.0',
    description: 'RESTful API for managing events, users, and registrations',
    endpoints: {
      auth: {
        login: 'POST /api/auth/login',
        register: 'POST /api/auth/register',
        logout: 'POST /api/auth/logout'
      },
      events: {
        getAll: 'GET /api/events',
        getById: 'GET /api/events/:id',
        create: 'POST /api/events',
        update: 'PUT /api/events/:id',
        delete: 'DELETE /api/events/:id'
      },
      registrations: {
        create: 'POST /api/registrations',
        getUserRegistrations: 'GET /api/registrations/user/:userId',
        getEventRegistrations: 'GET /api/registrations/event/:eventId'
      },
      users: {
        getProfile: 'GET /api/users/:id',
        updateProfile: 'PUT /api/users/:id'
      }
    },
    documentation: 'See README.md for detailed API documentation',
    support: 'Contact development team for assistance'
  });
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/users', userRoutes);

// ===========================================
// Error Handling
// ===========================================

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
    availableEndpoints: '/api'
  });
});

// Global error handler
app.use(errorHandler);

// ===========================================
// Database & Server Initialization
// ===========================================

async function initializeDatabase() {
  try {
    const db = require('./src/config/database');
    console.log('✅ Database connection established');
    
    // Run migrations/setup if needed
    const initDb = require('./src/config/initDatabase');
    await initDb();
    console.log('✅ Database initialized');
    
    // Seed data if in development mode
    if (process.env.NODE_ENV === 'development' && process.env.SEED_DATA === 'true') {
      const seedData = require('./src/utils/seedData');
      await seedData();
      console.log('✅ Test data seeded');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    return false;
  }
}

async function startServer() {
  try {
    // Initialize database
    const dbReady = await initializeDatabase();
    if (!dbReady) {
      console.error('❌ Cannot start server without database');
      process.exit(1);
    }
    
    // Start HTTP server
    const server = app.listen(PORT, () => {
      console.log('\n🚀 Event Management API Server Started');
      console.log('=====================================');
      console.log(`📍 Server running on port ${PORT}`);
      console.log(`🌐 API URL: http://localhost:${PORT}/api`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`⏰ Started at: ${new Date().toISOString()}`);
      console.log('=====================================\n');
    });
    
    // Graceful shutdown handling
    const gracefulShutdown = (signal) => {
      console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
      server.close(() => {
        console.log('✅ HTTP server closed');
        
        // Close database connections
        const db = require('./src/config/database');
        if (db && db.close) {
          db.close(() => {
            console.log('✅ Database connection closed');
            process.exit(0);
          });
        } else {
          process.exit(0);
        }
      });
    };
    
    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('UNHANDLED_REJECTION');
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// ===========================================
// Start the server if this file is run directly
// ===========================================

if (require.main === module) {
  startServer();
}

module.exports = app;