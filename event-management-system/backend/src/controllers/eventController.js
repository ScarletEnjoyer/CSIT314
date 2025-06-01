// Event Controller
const database = require('../config/database');

class EventController {
  // Get all events with optional filtering
  async getAllEvents(req, res) {
    try {
      const { category, search, date, price, limit = 50, offset = 0 } = req.query;
      
      let sql = `
        SELECT e.*, o.name as organizer_name, o.email as organizer_email, o.company as organizer_company
        FROM events e 
        LEFT JOIN organizers o ON e.organizer_id = o.id 
        WHERE e.status = 'active'
      `;
      
      const params = [];
      
      // Apply filters
      if (category) {
        sql += ' AND e.category = ?';
        params.push(category);
      }
      
      if (search) {
        sql += ' AND (e.title LIKE ? OR e.description LIKE ? OR e.location LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }
      
      if (date) {
        sql += ' AND e.date = ?';
        params.push(date);
      }
      
      if (price) {
        switch (price) {
          case 'free':
            sql += ' AND e.general_price = 0';
            break;
          case 'paid':
            sql += ' AND e.general_price > 0 AND e.general_price <= 100';
            break;
          case 'premium':
            sql += ' AND e.general_price > 100';
            break;
        }
      }
      
      // Add ordering and pagination
      sql += ' ORDER BY e.date ASC, e.time ASC LIMIT ? OFFSET ?';
      params.push(parseInt(limit), parseInt(offset));
      
      const events = await database.all(sql, params);
      
      // Transform events to match frontend structure
      const transformedEvents = events.map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        date: event.date,
        time: event.time,
        location: event.location,
        category: event.category,
        image: event.image_url,
        organizer: {
          id: event.organizer_id,
          name: event.organizer_name,
          email: event.organizer_email,
          company: event.organizer_company
        },
        tickets: {
          general: {
            price: parseFloat(event.general_price),
            capacity: event.general_capacity,
            remaining: event.general_remaining
          },
          vip: {
            price: parseFloat(event.vip_price),
            capacity: event.vip_capacity,
            remaining: event.vip_remaining
          }
        },
        status: event.status,
        created_at: event.created_at,
        updated_at: event.updated_at
      }));
      
      res.json(transformedEvents);
      
    } catch (error) {
      console.error('Get all events error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }

  // Get single event by ID
  async getEventById(req, res) {
    try {
      const { id } = req.params;
      
      const event = await database.get(`
        SELECT e.*, o.name as organizer_name, o.email as organizer_email, o.company as organizer_company
        FROM events e 
        LEFT JOIN organizers o ON e.organizer_id = o.id 
        WHERE e.id = ?
      `, [id]);
      
      if (!event) {
        return res.status(404).json({
          error: 'Event not found'
        });
      }
      
      // Transform event structure
      const transformedEvent = {
        id: event.id,
        title: event.title,
        description: event.description,
        date: event.date,
        time: event.time,
        location: event.location,
        category: event.category,
        image: event.image_url,
        organizer: {
          id: event.organizer_id,
          name: event.organizer_name,
          email: event.organizer_email,
          company: event.organizer_company
        },
        tickets: {
          general: {
            price: parseFloat(event.general_price),
            capacity: event.general_capacity,
            remaining: event.general_remaining
          },
          vip: {
            price: parseFloat(event.vip_price),
            capacity: event.vip_capacity,
            remaining: event.vip_remaining
          }
        },
        status: event.status,
        created_at: event.created_at,
        updated_at: event.updated_at
      };
      
      res.json(transformedEvent);
      
    } catch (error) {
      console.error('Get event by ID error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }

  // Create new event (organizers only)
  async createEvent(req, res) {
    try {
      // Check if user is an organizer
      if (req.user.type !== 'organizer') {
        return res.status(403).json({
          error: 'Only organizers can create events'
        });
      }

      const {
        title,
        description,
        date,
        time,
        location,
        category,
        image_url,
        general_price = 0,
        general_capacity = 0,
        vip_price = 0,
        vip_capacity = 0
      } = req.body;

      // Validation
      if (!title || !description || !date || !time || !location || !category) {
        return res.status(400).json({
          error: 'Title, description, date, time, location, and category are required'
        });
      }

      // Validate date is in the future
      const eventDateTime = new Date(`${date}T${time}`);
      if (eventDateTime <= new Date()) {
        return res.status(400).json({
          error: 'Event date and time must be in the future'
        });
      }

      // Create event
      const result = await database.run(`
        INSERT INTO events (
          title, description, date, time, location, category, image_url,
          organizer_id, general_price, general_capacity, general_remaining,
          vip_price, vip_capacity, vip_remaining
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        title,
        description,
        date,
        time,
        location,
        category,
        image_url || null,
        req.user.id,
        general_price,
        general_capacity,
        general_capacity, // remaining starts same as capacity
        vip_price,
        vip_capacity,
        vip_capacity // remaining starts same as capacity
      ]);

      // Get created event
      const event = await database.get(`
        SELECT e.*, o.name as organizer_name, o.email as organizer_email, o.company as organizer_company
        FROM events e 
        LEFT JOIN organizers o ON e.organizer_id = o.id 
        WHERE e.id = ?
      `, [result.id]);

      // Transform event structure
      const transformedEvent = {
        id: event.id,
        title: event.title,
        description: event.description,
        date: event.date,
        time: event.time,
        location: event.location,
        category: event.category,
        image: event.image_url,
        organizer: {
          id: event.organizer_id,
          name: event.organizer_name,
          email: event.organizer_email,
          company: event.organizer_company
        },
        tickets: {
          general: {
            price: parseFloat(event.general_price),
            capacity: event.general_capacity,
            remaining: event.general_remaining
          },
          vip: {
            price: parseFloat(event.vip_price),
            capacity: event.vip_capacity,
            remaining: event.vip_remaining
          }
        },
        status: event.status,
        created_at: event.created_at
      };

      res.status(201).json({
        message: 'Event created successfully',
        event: transformedEvent
      });

    } catch (error) {
      console.error('Create event error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }

  // Update event (organizers only, own events)
  async updateEvent(req, res) {
    try {
      const { id } = req.params;

      // Check if user is an organizer
      if (req.user.type !== 'organizer') {
        return res.status(403).json({
          error: 'Only organizers can update events'
        });
      }

      // Check if event exists and belongs to organizer
      const existingEvent = await database.get(
        'SELECT * FROM events WHERE id = ? AND organizer_id = ?',
        [id, req.user.id]
      );

      if (!existingEvent) {
        return res.status(404).json({
          error: 'Event not found or you do not have permission to update it'
        });
      }

      const {
        title,
        description,
        date,
        time,
        location,
        category,
        image_url,
        general_price,
        general_capacity,
        vip_price,
        vip_capacity,
        status
      } = req.body;

      // Build update query dynamically
      const updateFields = [];
      const updateValues = [];

      if (title !== undefined) {
        updateFields.push('title = ?');
        updateValues.push(title);
      }
      if (description !== undefined) {
        updateFields.push('description = ?');
        updateValues.push(description);
      }
      if (date !== undefined) {
        updateFields.push('date = ?');
        updateValues.push(date);
      }
      if (time !== undefined) {
        updateFields.push('time = ?');
        updateValues.push(time);
      }
      if (location !== undefined) {
        updateFields.push('location = ?');
        updateValues.push(location);
      }
      if (category !== undefined) {
        updateFields.push('category = ?');
        updateValues.push(category);
      }
      if (image_url !== undefined) {
        updateFields.push('image_url = ?');
        updateValues.push(image_url);
      }
      if (general_price !== undefined) {
        updateFields.push('general_price = ?');
        updateValues.push(general_price);
      }
      if (general_capacity !== undefined) {
        updateFields.push('general_capacity = ?');
        updateValues.push(general_capacity);
        // Adjust remaining if capacity changed
        const difference = general_capacity - existingEvent.general_capacity;
        updateFields.push('general_remaining = general_remaining + ?');
        updateValues.push(difference);
      }
      if (vip_price !== undefined) {
        updateFields.push('vip_price = ?');
        updateValues.push(vip_price);
      }
      if (vip_capacity !== undefined) {
        updateFields.push('vip_capacity = ?');
        updateValues.push(vip_capacity);
        // Adjust remaining if capacity changed
        const difference = vip_capacity - existingEvent.vip_capacity;
        updateFields.push('vip_remaining = vip_remaining + ?');
        updateValues.push(difference);
      }
      if (status !== undefined) {
        updateFields.push('status = ?');
        updateValues.push(status);
      }

      if (updateFields.length === 0) {
        return res.status(400).json({
          error: 'No fields to update'
        });
      }

      // Add updated_at timestamp
      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      updateValues.push(id);

      // Execute update
      await database.run(
        `UPDATE events SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );

      // Get updated event
      const updatedEvent = await database.get(`
        SELECT e.*, o.name as organizer_name, o.email as organizer_email, o.company as organizer_company
        FROM events e 
        LEFT JOIN organizers o ON e.organizer_id = o.id 
        WHERE e.id = ?
      `, [id]);

      // Transform event structure
      const transformedEvent = {
        id: updatedEvent.id,
        title: updatedEvent.title,
        description: updatedEvent.description,
        date: updatedEvent.date,
        time: updatedEvent.time,
        location: updatedEvent.location,
        category: updatedEvent.category,
        image: updatedEvent.image_url,
        organizer: {
          id: updatedEvent.organizer_id,
          name: updatedEvent.organizer_name,
          email: updatedEvent.organizer_email,
          company: updatedEvent.organizer_company
        },
        tickets: {
          general: {
            price: parseFloat(updatedEvent.general_price),
            capacity: updatedEvent.general_capacity,
            remaining: updatedEvent.general_remaining
          },
          vip: {
            price: parseFloat(updatedEvent.vip_price),
            capacity: updatedEvent.vip_capacity,
            remaining: updatedEvent.vip_remaining
          }
        },
        status: updatedEvent.status,
        updated_at: updatedEvent.updated_at
      };

      res.json({
        message: 'Event updated successfully',
        event: transformedEvent
      });

    } catch (error) {
      console.error('Update event error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }

  // Delete event (organizers only, own events)
  async deleteEvent(req, res) {
    try {
      const { id } = req.params;

      // Check if user is an organizer
      if (req.user.type !== 'organizer') {
        return res.status(403).json({
          error: 'Only organizers can delete events'
        });
      }

      // Check if event exists and belongs to organizer
      const existingEvent = await database.get(
        'SELECT * FROM events WHERE id = ? AND organizer_id = ?',
        [id, req.user.id]
      );

      if (!existingEvent) {
        return res.status(404).json({
          error: 'Event not found or you do not have permission to delete it'
        });
      }

      // Check if there are any registrations
      const registrationCount = await database.get(
        'SELECT COUNT(*) as count FROM registrations WHERE event_id = ?',
        [id]
      );

      if (registrationCount.count > 0) {
        return res.status(400).json({
          error: 'Cannot delete event with existing registrations. Cancel or process refunds first.'
        });
      }

      // Delete event
      await database.run('DELETE FROM events WHERE id = ?', [id]);

      res.json({
        message: 'Event deleted successfully'
      });

    } catch (error) {
      console.error('Delete event error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }

  // Get events by organizer
  async getOrganizerEvents(req, res) {
    try {
      const { organizerId } = req.params;

      // Check if requesting own events or if admin
      if (req.user.type === 'organizer' && req.user.id != organizerId) {
        return res.status(403).json({
          error: 'You can only view your own events'
        });
      }

      const events = await database.all(`
        SELECT e.*, 
               (SELECT COUNT(*) FROM registrations WHERE event_id = e.id) as registration_count,
               (SELECT COALESCE(SUM(total_price), 0) FROM registrations WHERE event_id = e.id) as total_revenue
        FROM events e 
        WHERE e.organizer_id = ?
        ORDER BY e.date DESC
      `, [organizerId]);

      // Transform events
      const transformedEvents = events.map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        date: event.date,
        time: event.time,
        location: event.location,
        category: event.category,
        image: event.image_url,
        tickets: {
          general: {
            price: parseFloat(event.general_price),
            capacity: event.general_capacity,
            remaining: event.general_remaining
          },
          vip: {
            price: parseFloat(event.vip_price),
            capacity: event.vip_capacity,
            remaining: event.vip_remaining
          }
        },
        status: event.status,
        registration_count: event.registration_count,
        total_revenue: parseFloat(event.total_revenue),
        created_at: event.created_at,
        updated_at: event.updated_at
      }));

      res.json(transformedEvents);

    } catch (error) {
      console.error('Get organizer events error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }
}

module.exports = new EventController();