class ApiService {
  constructor() {
    this.baseURL = CONFIG.API_BASE_URL
    this.timeout = CONFIG.API_TIMEOUT || 10000
    this.cache = new Map()
    
    if (CONFIG.DEBUG_MODE) {
      console.log(`🔌 ApiService initialized in ${CONFIG.getDataMode()} mode`)
    }
  }

  /**
   * general request
   */
  async request(endpoint, options = {}) {
    if (!CONFIG.USE_BACKEND_API) {
      return this.handleLocalStorageRequest(endpoint, options)
    }

    const url = CONFIG.getApiUrl(endpoint)
    const config = {
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    }

    try {
      if (CONFIG.DEBUG_MODE) {
        console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`, config)
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)

      const response = await fetch(url, {
        ...config,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (CONFIG.DEBUG_MODE) {
        console.log(`✅ API Response:`, data)
      }

      return data
    } catch (error) {
      if (CONFIG.DEBUG_MODE) {
        console.error(`❌ API Error:`, error)
      }
      throw this.handleApiError(error)
    }
  }

  /**
   * GET request
   */
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString()
    const url = queryString ? `${endpoint}?${queryString}` : endpoint
    
    return this.request(url, { method: 'GET' })
  }

  /**
   * POST request
   */
  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  /**
   * PUT request
   */
  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  /**
   * DELETE request
   */
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' })
  }

  // ===========================================
  // LocalStorage Mock API
  // ===========================================

  /**
   * Process localStorage request
   */
  async handleLocalStorageRequest(endpoint, options = {}) {
    const method = options.method || 'GET'
    const data = options.body ? JSON.parse(options.body) : null

    // Simulate network latency
    await this.simulateNetworkDelay()

    try {
      switch (endpoint) {
        // Event related APIs
        case '/events':
          return method === 'GET' ? window.dataService.getEvents() :
                 method === 'POST' ? window.dataService.saveEvent(data) : []

        case '/events':
          if (method === 'GET') return window.dataService.getEvents()
          if (method === 'POST') return window.dataService.saveEvent(data)
          break

        // User related APIs
        case '/users':
          return method === 'GET' ? window.dataService.getUsers() :
                 method === 'POST' ? window.dataService.saveUser(data) : []

        case '/auth/login':
          return this.mockLogin(data)

        case '/auth/register':
          return this.mockRegister(data)

        // Registration related APIs
        case '/registrations':
          return method === 'GET' ? window.dataService.getRegistrations() :
                 method === 'POST' ? window.dataService.saveRegistration(data) : []

        // Organizer related APIs
        case '/organizers':
          return window.dataService.getOrganizers()

        case '/organizers/login':
          return this.mockOrganizerLogin(data)

        default: 
          return this.handleResourceWithId(endpoint, method, data)
      }
    } catch (error) {
      throw new Error(`LocalStorage API Error: ${error.message}`)
    }
  }

  /**
   * Process resource request with IDs
   */
  handleResourceWithId(endpoint, method, data) {
    const segments = endpoint.split('/')
    const resource = segments[1] // events, users, etc.
    const id = segments[2] // ID

    switch (resource) {
      case 'events':
        if (method === 'GET') return window.dataService.getEvent(parseInt(id))
        if (method === 'PUT') return window.dataService.saveEvent({...data, id: parseInt(id)})
        if (method === 'DELETE') return window.dataService.deleteEvent(id)
        break

      case 'users':
        if (method === 'GET') return window.dataService.getUser(parseInt(id))
        if (method === 'PUT') return window.dataService.saveUser({...data, id: parseInt(id)})
        break

      case 'registrations':
        if (endpoint.includes('/user/')) {
          const userId = segments[3]
          return window.dataService.getRegistrationsByUser(parseInt(userId))
        }
        if (endpoint.includes('/event/')) {
          const eventId = segments[3]
          return window.dataService.getRegistrationsByEvent(parseInt(eventId))
        }
        break
    }

    throw new Error(`Unsupported endpoint: ${endpoint}`)
  }

  // ===========================================
  // Event API
  // ===========================================

  /**
   * Get all events
   */
  async getEvents(params = {}) {
    try {
      const events = await this.get('/events', params)
      return this.filterEvents(events, params)
    } catch (error) {
      console.error('Error fetching events:', error)
      return []
    }
  }

  /**
   * Get single event
   */
  async getEvent(id) {
    try {
      return await this.get(`/events/${id}`)
    } catch (error) {
      console.error(`Error fetching event ${id}:`, error)
      return null
    }
  }

  /**
   * Create event
   */
  async createEvent(eventData) {
    try {
      return await this.post('/events', eventData)
    } catch (error) {
      console.error('Error creating event:', error)
      throw error
    }
  }

  /**
   * Update event
   */
  async updateEvent(id, eventData) {
    try {
      return await this.put(`/events/${id}`, eventData)
    } catch (error) {
      console.error(`Error updating event ${id}:`, error)
      throw error
    }
  }

  /**
   * Delete event
   */
  async deleteEvent(id) {
    try {
      return await this.delete(`/events/${id}`)
    } catch (error) {
      console.error(`Error deleting event ${id}:`, error)
      throw error
    }
  }

  // ===========================================
  // User API
  // ===========================================

  /**
   * User login
   */
  async login(credentials) {
    try {
      return await this.post('/auth/login', credentials)
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  /**
   * User registration
   */
  async register(userData) {
    try {
      return await this.post('/auth/register', userData)
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    }
  }

  /**
   * Get user information
   */
  async getUser(id) {
    try {
      return await this.get(`/users/${id}`)
    } catch (error) {
      console.error(`Error fetching user ${id}:`, error)
      return null
    }
  }

  /**
   * Update user information
   */
  async updateUser(id, userData) {
    try {
      return await this.put(`/users/${id}`, userData)
    } catch (error) {
      console.error(`Error updating user ${id}:`, error)
      throw error
    }
  }

  // ===========================================
  // Organizer API
  // ===========================================

  /**
   * Organizer login
   */
  async organizerLogin(credentials) {
    try {
      return await this.post('/organizers/login', credentials)
    } catch (error) {
      console.error('Organizer login error:', error)
      throw error
    }
  }

  /**
   * Get organizer events
   */
  async getOrganizerEvents(organizerId) {
    try {
      return await this.get(`/organizers/${organizerId}/events`)
    } catch (error) {
      console.error(`Error fetching organizer ${organizerId} events:`, error)
      return []
    }
  }

  // ===========================================
  // Registration API
  // ===========================================

  /**
   * Event registration
   */
  async registerForEvent(registrationData) {
    try {
      return await this.post('/registrations', registrationData)
    } catch (error) {
      console.error('Event registration error:', error)
      throw error
    }
  }

  /**
   * Get user registrations
   */
  async getUserRegistrations(userId) {
    try {
      return await this.get(`/registrations/user/${userId}`)
    } catch (error) {
      console.error(`Error fetching user ${userId} registrations:`, error)
      return []
    }
  }

  /**
   * Get event registrations
   */
  async getEventRegistrations(eventId) {
    try {
      return await this.get(`/registrations/event/${eventId}`)
    } catch (error) {
      console.error(`Error fetching event ${eventId} registrations:`, error)
      return []
    }
  }

  // ===========================================
  // Utility Methods
  // ===========================================

  /**
   * Simulate network delay
   */
  async simulateNetworkDelay() {
    const delay = CONFIG.DEMO_MODE ? 300 : 100 // Longer delay in demo mode
    return new Promise(resolve => setTimeout(resolve, delay))
  }

  /**
   * Filter events
   */
  filterEvents(events, filters) {
    if (!filters || Object.keys(filters).length === 0) {
      return events
    }

    return events.filter(event => {
      // Category filter
      if (filters.category && event.category !== filters.category) {
        return false
      }

      // Keyword search
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase()
        const searchableText = `${event.title} ${event.description} ${event.location}`.toLowerCase()
        if (!searchableText.includes(searchTerm)) {
          return false
        }
      }

      // Date filter
      if (filters.date && event.date !== filters.date) {
        return false
      }

      // Price filter
      if (filters.price) {
        const generalPrice = event.tickets.general.price
        switch (filters.price) {
          case 'free':
            if (generalPrice > 0) return false
            break
          case 'paid':
            if (generalPrice === 0 || generalPrice > 100) return false
            break
          case 'premium':
            if (generalPrice <= 100) return false
            break
        }
      }

      return true
    })
  }

  /**
   * Mock login
   */
  async mockLogin(credentials) {
    const { email, password } = credentials
    
    // Find user
    let user = window.dataService.getUserByEmail(email)
    
    // If user doesn't exist, create new user (demo mode)
    if (!user && CONFIG.DEMO_MODE) {
      user = window.dataService.saveUser({
        name: email.split('@')[0],
        email: email,
        registrations: []
      })
    }

    if (!user) {
      throw new Error('User not found')
    }

    // Mock JWT token
    const token = 'mock_jwt_token_' + Date.now()
    
    return {
      user: user,
      token: token,
      message: 'Login successful'
    }
  }

  /**
   * Mock registration
   */
  async mockRegister(userData) {
    const { name, email, password } = userData
    
    // Check if email already exists
    const existingUser = window.dataService.getUserByEmail(email)
    if (existingUser) {
      throw new Error('Email already exists')
    }

    // Create new user
    const user = window.dataService.saveUser({
      name: name,
      email: email,
      registrations: []
    })

    const token = 'mock_jwt_token_' + Date.now()
    
    return {
      user: user,
      token: token,
      message: 'Registration successful'
    }
  }

  /**
   * Mock organizer login
   */
  async mockOrganizerLogin(credentials) {
    const { email, password } = credentials
    
    const organizer = window.dataService.getOrganizerByEmail(email)
    
    if (!organizer || organizer.password !== password) {
      throw new Error('Invalid credentials')
    }

    const token = 'mock_organizer_token_' + Date.now()
    
    return {
      organizer: organizer,
      token: token,
      message: 'Organizer login successful'
    }
  }

  /**
   * Handle API errors
   */
  handleApiError(error) {
    if (error.name === 'AbortError') {
      return new Error('Request timeout')
    }
    
    if (error.message.includes('Failed to fetch')) {
      return new Error('Network error - please check your connection')
    }
    
    return error
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear()
    if (CONFIG.DEBUG_MODE) {
      console.log('🗑️ API cache cleared')
    }
  }
}

// ===========================================
// Create Global API Instance
// ===========================================

// Create API service instance
const apiService = new ApiService()

// Expose to global scope for backward compatibility
window.apiService = apiService
window.API = apiService // Short alias

// Reinitialize API service if configuration changes detected
if (typeof window.addEventListener === 'function') {
  window.addEventListener('configChanged', () => {
    window.apiService = new ApiService()
    window.API = window.apiService
  })
}

// Export API service (for modular environments)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ApiService
}