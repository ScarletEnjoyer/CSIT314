// Frontend configuration file
// Configuration file for the Event Management System frontend

const CONFIG = {
  // ===========================================
  // Data Source Configuration
  // ===========================================
  
  /**
   * Data source mode toggle
   * true: Use backend API server
   * false: Use localStorage local storage (demo mode)
   */
  USE_BACKEND_API: true,
  
  /**
   * Backend API base URL
   * Used when USE_BACKEND_API is true
   */
  API_BASE_URL: 'http://localhost:3001/api',
  
  // ===========================================
  // Application Configuration  
  // ===========================================
  
  /**
   * Application name
   */
  APP_NAME: 'EventHub',
  
  /**
   * Application version
   */
  APP_VERSION: '1.0.0',
  
  /**
   * Pagination configuration
   */
  PAGINATION: {
    EVENTS_PER_PAGE: 6,
    REGISTRATIONS_PER_PAGE: 10,
    NOTIFICATIONS_PER_PAGE: 5
  },
  
  // ===========================================
  // UI Configuration
  // ===========================================
  
  /**
   * Demo mode
   * true: Enable demo features (auto-fill forms, etc.)
   * false: Normal mode
   */
  DEMO_MODE: true,
  
  /**
   * Debug mode
   * true: Show detailed log information
   * false: Production mode
   */
  DEBUG_MODE: true,
  
  /**
   * Auto-login demo user (only in demo mode)
   */
  DEMO_AUTO_LOGIN: {
    ENABLED: false,
    USER_EMAIL: 'demo@example.com'
  },
  
  // ===========================================
  // File Upload Configuration
  // ===========================================
  
  /**
   * Allowed image file types
   */
  ALLOWED_IMAGE_TYPES: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  
  /**
   * Maximum file size (bytes)
   */
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  
  // ===========================================
  // Event Configuration
  // ===========================================
  
  /**
   * Event category configuration
   */
  EVENT_CATEGORIES: [
    { value: 'conference', label: 'Conference', icon: '🎯' },
    { value: 'concert', label: 'Concert', icon: '🎵' },
    { value: 'workshop', label: 'Workshop', icon: '🛠️' },
    { value: 'networking', label: 'Networking', icon: '🤝' },
    { value: 'seminar', label: 'Seminar', icon: '📚' },
    { value: 'exhibition', label: 'Exhibition', icon: '🎨' }
  ],
  
  /**
   * Ticket type configuration
   */
  TICKET_TYPES: {
    GENERAL: {
      name: 'General Admission',
      description: 'Standard access to the event'
    },
    VIP: {
      name: 'VIP Access',
      description: 'Premium access with exclusive benefits'
    }
  },
  
  // ===========================================
  // Time Configuration
  // ===========================================
  
  /**
   * Date time formats
   */
  DATE_FORMATS: {
    DISPLAY: 'MMM DD, YYYY',
    INPUT: 'YYYY-MM-DD',
    DATETIME: 'YYYY-MM-DD HH:mm'
  },
  
  /**
   * Timezone setting
   */
  TIMEZONE: 'America/New_York',
  
  // ===========================================
  // Notification Configuration
  // ===========================================
  
  /**
   * Notification display duration (milliseconds)
   */
  NOTIFICATION_DURATION: 3000,
  
  /**
   * Notification types
   */
  NOTIFICATION_TYPES: {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info'
  },
  
  // ===========================================
  // Security Configuration
  // ===========================================
  
  /**
   * Session timeout (milliseconds)
   * 24 hours = 24 * 60 * 60 * 1000
   */
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000,
  
  /**
   * Minimum password length
   */
  PASSWORD_MIN_LENGTH: 8,
  
  // ===========================================
  // Cache Configuration
  // ===========================================
  
  /**
   * Cache expiration time (milliseconds)
   * 5 minutes = 5 * 60 * 1000
   */
  CACHE_DURATION: 5 * 60 * 1000,
  
  /**
   * Enable cache
   */
  ENABLE_CACHE: true,
  
  // ===========================================
  // Error Handling Configuration
  // ===========================================
  
  /**
   * API request timeout (milliseconds)
   */
  API_TIMEOUT: 10000, // 10 seconds
  
  /**
   * Maximum retry attempts
   */
  MAX_RETRY_ATTEMPTS: 3,
  
  // ===========================================
  // Development Configuration
  // ===========================================
  
  /**
   * Show performance statistics
   */
  SHOW_PERFORMANCE_STATS: false,
  
  /**
   * Enable error boundary
   */
  ENABLE_ERROR_BOUNDARY: true
}

// ===========================================
// Configuration Validation and Initialization
// ===========================================

/**
 * Validate if configuration is valid
 */
function validateConfig() {
  if (CONFIG.DEBUG_MODE) {
    console.log('🔧 Configuration loaded:', CONFIG)
  }
  
  // Validate API URL format
  if (CONFIG.USE_BACKEND_API && !CONFIG.API_BASE_URL.startsWith('http')) {
    console.warn('⚠️ Invalid API_BASE_URL format')
  }
  
  // Validate pagination configuration
  if (CONFIG.PAGINATION.EVENTS_PER_PAGE <= 0) {
    console.warn('⚠️ Invalid EVENTS_PER_PAGE value')
    CONFIG.PAGINATION.EVENTS_PER_PAGE = 6 // Default value
  }
  
  return true
}

// ===========================================
// Configuration Utility Functions
// ===========================================

/**
 * Get current data mode
 */
CONFIG.getDataMode = function() {
  return this.USE_BACKEND_API ? 'API' : 'localStorage'
}

/**
 * Get complete API endpoint URL
 */
CONFIG.getApiUrl = function(endpoint) {
  if (!endpoint.startsWith('/')) {
    endpoint = '/' + endpoint
  }
  return this.API_BASE_URL + endpoint
}

/**
 * Check if in demo mode
 */
CONFIG.isDemoMode = function() {
  return this.DEMO_MODE
}

/**
 * Check if in debug mode
 */
CONFIG.isDebugMode = function() {
  return this.DEBUG_MODE
}

/**
 * Get event category information
 */
CONFIG.getEventCategory = function(categoryValue) {
  return this.EVENT_CATEGORIES.find(cat => cat.value === categoryValue) || null
}

/**
 * Format file size
 */
CONFIG.formatFileSize = function(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// ===========================================
// Initialize Configuration
// ===========================================

// Validate configuration on page load
document.addEventListener('DOMContentLoaded', () => {
  validateConfig()
  
  if (CONFIG.DEBUG_MODE) {
    console.log(`🚀 EventHub initialized in ${CONFIG.getDataMode()} mode`)
  }
})

// Expose configuration to global scope
window.CONFIG = CONFIG

// Prevent configuration from being accidentally modified
if (typeof Object.freeze === 'function') {
  Object.freeze(CONFIG)
}