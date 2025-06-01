// Authentication Controller
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const database = require('../config/database');

class AuthController {
  // User Registration
  async register(req, res) {
    try {
      const { name, email, password, phone } = req.body;

      // Validation
      if (!name || !email || !password) {
        return res.status(400).json({
          error: 'Name, email, and password are required'
        });
      }

      // Check if user already exists
      const existingUser = await database.get(
        'SELECT id FROM users WHERE email = ?',
        [email.toLowerCase()]
      );

      if (existingUser) {
        return res.status(409).json({
          error: 'User with this email already exists'
        });
      }

      // Hash password
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Create user
      const result = await database.run(
        `INSERT INTO users (name, email, password_hash, phone) 
         VALUES (?, ?, ?, ?)`,
        [name, email.toLowerCase(), passwordHash, phone || null]
      );

      // Get created user
      const user = await database.get(
        'SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?',
        [result.id]
      );

      // Generate JWT token
      const token = this.generateToken(user.id, 'user');

      res.status(201).json({
        message: 'User registered successfully',
        user: user,
        token: token
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        error: 'Internal server error during registration'
      });
    }
  }

  // User Login
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validation
      if (!email || !password) {
        return res.status(400).json({
          error: 'Email and password are required'
        });
      }

      // Find user
      const user = await database.get(
        'SELECT id, name, email, password_hash, phone, role, is_active FROM users WHERE email = ?',
        [email.toLowerCase()]
      );

      if (!user) {
        return res.status(401).json({
          error: 'Invalid email or password'
        });
      }

      // Check if account is active
      if (!user.is_active) {
        return res.status(401).json({
          error: 'Account is deactivated'
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({
          error: 'Invalid email or password'
        });
      }

      // Generate JWT token
      const token = this.generateToken(user.id, 'user');

      // Remove password hash from response
      const { password_hash, ...userResponse } = user;

      res.json({
        message: 'Login successful',
        user: userResponse,
        token: token
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        error: 'Internal server error during login'
      });
    }
  }

  // Organizer Login
  async organizerLogin(req, res) {
    try {
      const { email, password } = req.body;

      // Validation
      if (!email || !password) {
        return res.status(400).json({
          error: 'Email and password are required'
        });
      }

      // Find organizer
      const organizer = await database.get(
        'SELECT id, name, email, password_hash, company, phone, is_active, is_verified FROM organizers WHERE email = ?',
        [email.toLowerCase()]
      );

      if (!organizer) {
        return res.status(401).json({
          error: 'Invalid email or password'
        });
      }

      // Check if account is active
      if (!organizer.is_active) {
        return res.status(401).json({
          error: 'Organizer account is deactivated'
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, organizer.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({
          error: 'Invalid email or password'
        });
      }

      // Generate JWT token
      const token = this.generateToken(organizer.id, 'organizer');

      // Remove password hash from response
      const { password_hash, ...organizerResponse } = organizer;

      res.json({
        message: 'Organizer login successful',
        organizer: organizerResponse,
        token: token
      });

    } catch (error) {
      console.error('Organizer login error:', error);
      res.status(500).json({
        error: 'Internal server error during organizer login'
      });
    }
  }

  // Organizer Registration
  async organizerRegister(req, res) {
    try {
      const { name, email, password, company, phone, description, website } = req.body;

      // Validation
      if (!name || !email || !password || !company) {
        return res.status(400).json({
          error: 'Name, email, password, and company are required'
        });
      }

      // Check if organizer already exists
      const existingOrganizer = await database.get(
        'SELECT id FROM organizers WHERE email = ?',
        [email.toLowerCase()]
      );

      if (existingOrganizer) {
        return res.status(409).json({
          error: 'Organizer with this email already exists'
        });
      }

      // Hash password
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Create organizer
      const result = await database.run(
        `INSERT INTO organizers (name, email, password_hash, company, phone, description, website) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [name, email.toLowerCase(), passwordHash, company, phone || null, description || null, website || null]
      );

      // Get created organizer
      const organizer = await database.get(
        'SELECT id, name, email, company, phone, description, website, is_verified, created_at FROM organizers WHERE id = ?',
        [result.id]
      );

      // Generate JWT token
      const token = this.generateToken(organizer.id, 'organizer');

      res.status(201).json({
        message: 'Organizer registered successfully',
        organizer: organizer,
        token: token
      });

    } catch (error) {
      console.error('Organizer registration error:', error);
      res.status(500).json({
        error: 'Internal server error during organizer registration'
      });
    }
  }

  // Logout (for token invalidation)
  async logout(req, res) {
    try {
      // In a more complex system, you would invalidate the token
      // For now, we'll just return a success message
      res.json({
        message: 'Logout successful'
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        error: 'Internal server error during logout'
      });
    }
  }

  // Get current user profile
  async getProfile(req, res) {
    try {
      const userId = req.user.id;
      const userType = req.user.type;

      let user;
      if (userType === 'organizer') {
        user = await database.get(
          'SELECT id, name, email, company, phone, description, website, is_verified, created_at FROM organizers WHERE id = ?',
          [userId]
        );
      } else {
        user = await database.get(
          'SELECT id, name, email, phone, role, email_verified, created_at FROM users WHERE id = ?',
          [userId]
        );
      }

      if (!user) {
        return res.status(404).json({
          error: 'User not found'
        });
      }

      res.json({
        user: user,
        userType: userType
      });

    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }

  // Generate JWT token
  generateToken(userId, userType) {
    const payload = {
      id: userId,
      type: userType,
      iat: Math.floor(Date.now() / 1000)
    };

    return jwt.sign(
      payload,
      process.env.JWT_SECRET || 'default_secret_change_in_production',
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
      }
    );
  }

  // Verify JWT token (middleware helper)
  static verifyToken(token) {
    try {
      return jwt.verify(
        token,
        process.env.JWT_SECRET || 'default_secret_change_in_production'
      );
    } catch (error) {
      return null;
    }
  }

  // Change password
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;
      const userType = req.user.type;

      // Validation
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          error: 'Current password and new password are required'
        });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({
          error: 'New password must be at least 8 characters long'
        });
      }

      // Get current user
      const table = userType === 'organizer' ? 'organizers' : 'users';
      const user = await database.get(
        `SELECT password_hash FROM ${table} WHERE id = ?`,
        [userId]
      );

      if (!user) {
        return res.status(404).json({
          error: 'User not found'
        });
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({
          error: 'Current password is incorrect'
        });
      }

      // Hash new password
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await database.run(
        `UPDATE ${table} SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [newPasswordHash, userId]
      );

      res.json({
        message: 'Password changed successfully'
      });

    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }
}

module.exports = new AuthController();