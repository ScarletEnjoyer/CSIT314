// User Controller
const bcrypt = require('bcryptjs');
const database = require('../config/database');

class UserController {
  // Get user profile
  async getUserProfile(req, res) {
    try {
      const { id } = req.params;

      // Check if user is requesting their own profile
      if (req.user.id != id && req.user.type !== 'admin') {
        return res.status(403).json({
          error: 'You can only view your own profile'
        });
      }

      const user = await database.get(
        'SELECT id, name, email, phone, role, email_verified, created_at, updated_at FROM users WHERE id = ?',
        [id]
      );

      if (!user) {
        return res.status(404).json({
          error: 'User not found'
        });
      }

      // Get user statistics
      const stats = await database.get(`
        SELECT 
          COUNT(*) as total_registrations,
          COUNT(CASE WHEN r.status = 'confirmed' THEN 1 END) as confirmed_registrations,
          SUM(r.total_price) as total_spent
        FROM registrations r
        WHERE r.user_id = ?
      `, [id]);

      res.json({
        user: user,
        statistics: {
          total_registrations: stats.total_registrations || 0,
          confirmed_registrations: stats.confirmed_registrations || 0,
          total_spent: parseFloat(stats.total_spent) || 0
        }
      });

    } catch (error) {
      console.error('Get user profile error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }

  // Update user profile
  async updateUserProfile(req, res) {
    try {
      const { id } = req.params;

      // Check if user is updating their own profile
      if (req.user.id != id && req.user.type !== 'admin') {
        return res.status(403).json({
          error: 'You can only update your own profile'
        });
      }

      const { name, phone } = req.body;

      // Build update query dynamically
      const updateFields = [];
      const updateValues = [];

      if (name !== undefined) {
        if (!name || name.trim().length < 2) {
          return res.status(400).json({
            error: 'Name must be at least 2 characters long'
          });
        }
        updateFields.push('name = ?');
        updateValues.push(name.trim());
      }

      if (phone !== undefined) {
        if (phone && !/^[\+]?[1-9][\d]{0,15}$/.test(phone.replace(/[\s\-\(\)\.]/g, ''))) {
          return res.status(400).json({
            error: 'Please provide a valid phone number'
          });
        }
        updateFields.push('phone = ?');
        updateValues.push(phone || null);
      }

      if (updateFields.length === 0) {
        return res.status(400).json({
          error: 'No fields to update'
        });
      }

      // Add updated_at timestamp and user ID
      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      updateValues.push(id);

      // Execute update
      await database.run(
        `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );

      // Get updated user
      const updatedUser = await database.get(
        'SELECT id, name, email, phone, role, email_verified, created_at, updated_at FROM users WHERE id = ?',
        [id]
      );

      res.json({
        message: 'Profile updated successfully',
        user: updatedUser
      });

    } catch (error) {
      console.error('Update user profile error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }

  // Get user notifications
  async getUserNotifications(req, res) {
    try {
      const { id } = req.params;

      // Check if user is requesting their own notifications
      if (req.user.id != id && req.user.type !== 'admin') {
        return res.status(403).json({
          error: 'You can only view your own notifications'
        });
      }

      const { limit = 20, offset = 0, unread_only = false } = req.query;

      let sql = 'SELECT * FROM notifications WHERE user_id = ?';
      const params = [id];

      if (unread_only === 'true') {
        sql += ' AND is_read = 0';
      }

      sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit), parseInt(offset));

      const notifications = await database.all(sql, params);

      // Get unread count
      const unreadCount = await database.get(
        'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
        [id]
      );

      res.json({
        notifications: notifications,
        unread_count: unreadCount.count
      });

    } catch (error) {
      console.error('Get user notifications error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }

  // Mark notification as read
  async markNotificationRead(req, res) {
    try {
      const { id, notificationId } = req.params;

      // Check if user owns this notification
      const notification = await database.get(
        'SELECT user_id FROM notifications WHERE id = ?',
        [notificationId]
      );

      if (!notification) {
        return res.status(404).json({
          error: 'Notification not found'
        });
      }

      if (req.user.id != notification.user_id && req.user.type !== 'admin') {
        return res.status(403).json({
          error: 'You can only mark your own notifications as read'
        });
      }

      // Mark as read
      await database.run(
        'UPDATE notifications SET is_read = 1 WHERE id = ?',
        [notificationId]
      );

      res.json({
        message: 'Notification marked as read'
      });

    } catch (error) {
      console.error('Mark notification read error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }

  // Mark all notifications as read
  async markAllNotificationsRead(req, res) {
    try {
      const { id } = req.params;

      // Check if user is updating their own notifications
      if (req.user.id != id && req.user.type !== 'admin') {
        return res.status(403).json({
          error: 'You can only mark your own notifications as read'
        });
      }

      const result = await database.run(
        'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
        [id]
      );

      res.json({
        message: 'All notifications marked as read',
        updated_count: result.changes
      });

    } catch (error) {
      console.error('Mark all notifications read error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }

  // Delete user account
  async deleteUserAccount(req, res) {
    try {
      const { id } = req.params;

      // Check if user is deleting their own account
      if (req.user.id != id && req.user.type !== 'admin') {
        return res.status(403).json({
          error: 'You can only delete your own account'
        });
      }

      // Check for active registrations
      const activeRegistrations = await database.get(`
        SELECT COUNT(*) as count 
        FROM registrations r
        JOIN events e ON r.event_id = e.id
        WHERE r.user_id = ? AND r.status = 'confirmed' 
        AND datetime(e.date || 'T' || e.time) > datetime('now')
      `, [id]);

      if (activeRegistrations.count > 0) {
        return res.status(400).json({
          error: 'Cannot delete account with active registrations for future events. Please cancel registrations first.'
        });
      }

      // Begin transaction
      await database.run('BEGIN TRANSACTION');

      try {
        // Delete user data
        await database.run('DELETE FROM notifications WHERE user_id = ?', [id]);
        await database.run('DELETE FROM sessions WHERE user_id = ?', [id]);
        
        // Update registrations to remove user reference but keep registration data
        await database.run(
          'UPDATE registrations SET user_id = NULL WHERE user_id = ?',
          [id]
        );
        
        // Delete user
        await database.run('DELETE FROM users WHERE id = ?', [id]);

        await database.run('COMMIT');

        res.json({
          message: 'User account deleted successfully'
        });

      } catch (error) {
        await database.run('ROLLBACK');
        throw error;
      }

    } catch (error) {
      console.error('Delete user account error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }

  // Get user dashboard data
  async getUserDashboard(req, res) {
    try {
      const { id } = req.params;

      // Check if user is requesting their own dashboard
      if (req.user.id != id && req.user.type !== 'admin') {
        return res.status(403).json({
          error: 'You can only view your own dashboard'
        });
      }

      // Get upcoming events
      const upcomingRegistrations = await database.all(`
        SELECT r.*, e.title, e.date, e.time, e.location, e.category, e.image_url,
               o.name as organizer_name
        FROM registrations r
        JOIN events e ON r.event_id = e.id
        JOIN organizers o ON e.organizer_id = o.id
        WHERE r.user_id = ? AND r.status = 'confirmed'
        AND datetime(e.date || 'T' || e.time) > datetime('now')
        ORDER BY e.date ASC, e.time ASC
        LIMIT 5
      `, [id]);

      // Get past events
      const pastRegistrations = await database.all(`
        SELECT r.*, e.title, e.date, e.time, e.location, e.category, e.image_url,
               o.name as organizer_name
        FROM registrations r
        JOIN events e ON r.event_id = e.id
        JOIN organizers o ON e.organizer_id = o.id
        WHERE r.user_id = ? AND r.status = 'confirmed'
        AND datetime(e.date || 'T' || e.time) <= datetime('now')
        ORDER BY e.date DESC, e.time DESC
        LIMIT 5
      `, [id]);

      // Get recent notifications
      const notifications = await database.all(`
        SELECT * FROM notifications 
        WHERE user_id = ? 
        ORDER BY created_at DESC 
        LIMIT 5
      `, [id]);

      // Get user statistics
      const stats = await database.get(`
        SELECT 
          COUNT(*) as total_registrations,
          COUNT(CASE WHEN r.status = 'confirmed' THEN 1 END) as confirmed_registrations,
          SUM(r.total_price) as total_spent,
          COUNT(CASE WHEN datetime(e.date || 'T' || e.time) > datetime('now') THEN 1 END) as upcoming_events
        FROM registrations r
        JOIN events e ON r.event_id = e.id
        WHERE r.user_id = ?
      `, [id]);

      res.json({
        upcoming_events: upcomingRegistrations.map(reg => ({
          registration_id: reg.id,
          event: {
            id: reg.event_id,
            title: reg.title,
            date: reg.date,
            time: reg.time,
            location: reg.location,
            category: reg.category,
            image: reg.image_url,
            organizer: reg.organizer_name
          },
          ticket_type: reg.ticket_type,
          quantity: reg.quantity,
          total_price: parseFloat(reg.total_price),
          registration_date: reg.registration_date
        })),
        past_events: pastRegistrations.map(reg => ({
          registration_id: reg.id,
          event: {
            id: reg.event_id,
            title: reg.title,
            date: reg.date,
            time: reg.time,
            location: reg.location,
            category: reg.category,
            image: reg.image_url,
            organizer: reg.organizer_name
          },
          ticket_type: reg.ticket_type,
          quantity: reg.quantity,
          total_price: parseFloat(reg.total_price),
          registration_date: reg.registration_date
        })),
        notifications: notifications,
        statistics: {
          total_registrations: stats.total_registrations || 0,
          confirmed_registrations: stats.confirmed_registrations || 0,
          upcoming_events: stats.upcoming_events || 0,
          total_spent: parseFloat(stats.total_spent) || 0
        }
      });

    } catch (error) {
      console.error('Get user dashboard error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }

  // Search users (admin only)
  async searchUsers(req, res) {
    try {
      // Check if user is admin
      if (req.user.type !== 'admin') {
        return res.status(403).json({
          error: 'Only administrators can search users'
        });
      }

      const { search, limit = 20, offset = 0 } = req.query;

      let sql = 'SELECT id, name, email, phone, role, email_verified, created_at FROM users';
      const params = [];

      if (search) {
        sql += ' WHERE name LIKE ? OR email LIKE ?';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm);
      }

      sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit), parseInt(offset));

      const users = await database.all(sql, params);

      // Get total count
      let countSql = 'SELECT COUNT(*) as total FROM users';
      const countParams = [];

      if (search) {
        countSql += ' WHERE name LIKE ? OR email LIKE ?';
        const searchTerm = `%${search}%`;
        countParams.push(searchTerm, searchTerm);
      }

      const totalResult = await database.get(countSql, countParams);

      res.json({
        users: users,
        total: totalResult.total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

    } catch (error) {
      console.error('Search users error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }

  // Get user activity feed
  async getUserActivity(req, res) {
    try {
      const { id } = req.params;

      // Check if user is requesting their own activity
      if (req.user.id != id && req.user.type !== 'admin') {
        return res.status(403).json({
          error: 'You can only view your own activity'
        });
      }

      const { limit = 20, offset = 0 } = req.query;

      // Get user activity (registrations, check-ins, cancellations)
      const activities = await database.all(`
        SELECT 
          'registration' as activity_type,
          r.id as activity_id,
          r.registration_date as activity_date,
          r.status,
          e.title as event_title,
          e.date as event_date,
          r.ticket_type,
          r.quantity,
          r.total_price
        FROM registrations r
        JOIN events e ON r.event_id = e.id
        WHERE r.user_id = ?

        UNION ALL

        SELECT 
          'check_in' as activity_type,
          t.id as activity_id,
          t.check_in_date as activity_date,
          'checked_in' as status,
          e.title as event_title,
          e.date as event_date,
          t.ticket_type,
          1 as quantity,
          NULL as total_price
        FROM tickets t
        JOIN registrations r ON t.registration_id = r.id
        JOIN events e ON r.event_id = e.id
        WHERE r.user_id = ? AND t.check_in_date IS NOT NULL

        ORDER BY activity_date DESC
        LIMIT ? OFFSET ?
      `, [id, id, parseInt(limit), parseInt(offset)]);

      res.json({
        activities: activities.map(activity => ({
          type: activity.activity_type,
          id: activity.activity_id,
          date: activity.activity_date,
          status: activity.status,
          event: {
            title: activity.event_title,
            date: activity.event_date
          },
          details: {
            ticket_type: activity.ticket_type,
            quantity: activity.quantity,
            total_price: activity.total_price ? parseFloat(activity.total_price) : null
          }
        }))
      });

    } catch (error) {
      console.error('Get user activity error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }
}

module.exports = new UserController();