// Error Handler Middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error occurred:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    body: req.body,
    user: req.user ? { id: req.user.id, type: req.user.type } : null,
    timestamp: new Date().toISOString()
  });

  // Default error
  let error = {
    message: 'Internal server error',
    status: 500
  };

  // Handle specific error types
  if (err.name === 'ValidationError') {
    error.message = err.message;
    error.status = 400;
  } else if (err.name === 'UnauthorizedError') {
    error.message = 'Unauthorized access';
    error.status = 401;
  } else if (err.name === 'ForbiddenError') {
    error.message = 'Forbidden access';
    error.status = 403;
  } else if (err.name === 'NotFoundError') {
    error.message = 'Resource not found';
    error.status = 404;
  } else if (err.name === 'ConflictError') {
    error.message = err.message || 'Resource conflict';
    error.status = 409;
  } else if (err.code === 'SQLITE_CONSTRAINT') {
    if (err.message.includes('UNIQUE')) {
      error.message = 'Resource already exists';
      error.status = 409;
    } else {
      error.message = 'Database constraint violation';
      error.status = 400;
    }
  } else if (err.code === 'SQLITE_BUSY') {
    error.message = 'Database is busy, please try again';
    error.status = 503;
  } else if (err.message) {
    // Use the error message if available
    error.message = err.message;
    error.status = err.status || 500;
  }

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production' && error.status === 500) {
    error.message = 'An unexpected error occurred';
  }

  res.status(error.status).json({
    error: error.message,
    timestamp: new Date().toISOString(),
    path: req.path,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      details: err 
    })
  });
};

// 404 handler
const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
};

module.exports = errorHandler;
module.exports.notFoundHandler = notFoundHandler;