// Registration Controller
const { v4: uuidv4 } = require('uuid');
const database = require('../config/database');

class RegistrationController {
  // Register for an event
  async registerForEvent(req, res) {
    try {
      const {
        event_id,
        ticket_type,
        quantity = 1,
        attendee_name,
        attendee_email,
        attendee_phone
      } = req.body;

      // Validation
      if (!event_id || !ticket_type || !attendee_name || !attendee_email) {
        return res.status(400).json({
          error: 'Event ID, ticket type, attendee name, and email are required'
        });
      }

      if (!['general', 'vip'].includes(ticket_type)) {
        return res.status(400).json({
          error: 'Ticket type must be either "general" or "vip"'
        });
      }

      if (quantity < 1 || quantity > 10) {
        return res.status(400).json({
          error: 'Quantity must be between 1 and 10'
        });
      }

      // Get event details
      const event = await database.get(
        'SELECT * FROM events WHERE id = ? AND status = "active"',
        [event_id]
      );

      if (!event) {
        return res.status(404).json({
          error: 'Event not found or inactive'
        });
      }

      // Check if event is in the future
      const eventDateTime = new Date(`${event.date}T${event.time}`);
      if (eventDateTime <= new Date()) {
        return res.status(400).json({
          error: 'Cannot register for past events'
        });
      }

      // Check ticket availability
      const ticketField = ticket_type === 'general' ? 'general_remaining' : 'vip_remaining';
      const priceField = ticket_type === 'general' ? 'general_price' : 'vip_price';
      
      if (event[ticketField] < quantity) {
        return res.status(400).json({
          error: `Not enough ${ticket_type} tickets available. Only ${event[ticketField]} remaining.`
        });
      }

      // Calculate total price
      const unitPrice = parseFloat(event[priceField]);
      const totalPrice = unitPrice * quantity;

      // Begin transaction
      await database.run('BEGIN TRANSACTION');

      try {
        // Create registration
        const registrationResult = await database.run(`
          INSERT INTO registrations (
            user_id, event_id, ticket_type, quantity, total_price,
            attendee_name, attendee_email, attendee_phone,
            payment_status, payment_method
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          req.user ? req.user.id : null,
          event_id,
          ticket_type,
          quantity,
          totalPrice,
          attendee_name,
          attendee_email,
          attendee_phone || null,
          'completed', // Demo payment always successful
          'demo'
        ]);

        // Update ticket availability
        await database.run(`
          UPDATE events 
          SET ${ticketField} = ${ticketField} - ?
          WHERE id = ?
        `, [quantity, event_id]);

        // Generate tickets
        const tickets = [];
        for (let i = 0; i < quantity; i++) {
          const ticketCode = this.generateTicketCode();
          const ticketResult = await database.run(`
            INSERT INTO tickets (registration_id, ticket_code, ticket_type)
            VALUES (?, ?, ?)
          `, [registrationResult.id, ticketCode, ticket_type]);

          tickets.push({
            id: ticketResult.id,
            ticket_code: ticketCode,
            ticket_type: ticket_type,
            status: 'valid'
          });
        }

        // Commit transaction
        await database.run('COMMIT');

        // Get complete registration details
        const registration = await database.get(`
          SELECT r.*, e.title as event_title, e.date, e.time, e.location
          FROM registrations r
          JOIN events e ON r.event_id = e.id
          WHERE r.id = ?
        `, [registrationResult.id]);

        // Create notification for user
        if (req.user && req.user.id) {
          await database.run(`
            INSERT INTO notifications (user_id, title, content, type)
            VALUES (?, ?, ?, ?)
          `, [
            req.user.id,
            'Registration Confirmed',
            `Your registration for ${registration.event_title} has been confirmed. You will receive ${quantity} ${ticket_type} ticket(s).`,
            'success'
          ]);
        }

        res.status(201).json({
          message: 'Registration successful',
          registration: {
            id: registration.id,
            event_id: registration.event_id,
            event_title: registration.event_title,
            event_date: registration.date,
            event_time: registration.time,
            event_location: registration.location,
            ticket_type: registration.ticket_type,
            quantity: registration.quantity,
            total_price: parseFloat(registration.total_price),
            attendee_info: {
              name: registration.attendee_name,
              email: registration.attendee_email,
              phone: registration.attendee_phone
            },
            payment_status: registration.payment_status,
            registration_date: registration.registration_date,
            tickets: tickets
          }
        });

      } catch (error) {
        // Rollback transaction on error
        await database.run('ROLLBACK');
        throw error;
      }

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        error: 'Internal server error during registration'
      });
    }
  }

  // Get user's registrations
  async getUserRegistrations(req, res) {
    try {
      const { userId } = req.params;

      // Check if user is requesting their own registrations
      if (req.user.id != userId && req.user.type !== 'admin') {
        return res.status(403).json({
          error: 'You can only view your own registrations'
        });
      }

      const registrations = await database.all(`
        SELECT r.*, e.title, e.date, e.time, e.location, e.category, e.image_url,
               o.name as organizer_name
        FROM registrations r
        JOIN events e ON r.event_id = e.id
        JOIN organizers o ON e.organizer_id = o.id
        WHERE r.user_id = ?
        ORDER BY r.registration_date DESC
      `, [userId]);

      // Get tickets for each registration
      const registrationsWithTickets = await Promise.all(
        registrations.map(async (registration) => {
          const tickets = await database.all(
            'SELECT * FROM tickets WHERE registration_id = ?',
            [registration.id]
          );

          return {
            id: registration.id,
            event: {
              id: registration.event_id,
              title: registration.title,
              date: registration.date,
              time: registration.time,
              location: registration.location,
              category: registration.category,
              image: registration.image_url,
              organizer: registration.organizer_name
            },
            ticket_type: registration.ticket_type,
            quantity: registration.quantity,
            total_price: parseFloat(registration.total_price),
            attendee_info: {
              name: registration.attendee_name,
              email: registration.attendee_email,
              phone: registration.attendee_phone
            },
            payment_status: registration.payment_status,
            registration_date: registration.registration_date,
            tickets: tickets
          };
        })
      );

      res.json(registrationsWithTickets);

    } catch (error) {
      console.error('Get user registrations error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }

  // Get event registrations (for organizers)
  async getEventRegistrations(req, res) {
    try {
      const { eventId } = req.params;

      // Check if user is organizer of this event
      if (req.user.type === 'organizer') {
        const event = await database.get(
          'SELECT organizer_id FROM events WHERE id = ?',
          [eventId]
        );

        if (!event || event.organizer_id != req.user.id) {
          return res.status(403).json({
            error: 'You can only view registrations for your own events'
          });
        }
      }

      const registrations = await database.all(`
        SELECT r.*, u.name as user_name, u.email as user_email
        FROM registrations r
        LEFT JOIN users u ON r.user_id = u.id
        WHERE r.event_id = ?
        ORDER BY r.registration_date DESC
      `, [eventId]);

      // Get tickets for each registration
      const registrationsWithTickets = await Promise.all(
        registrations.map(async (registration) => {
          const tickets = await database.all(
            'SELECT * FROM tickets WHERE registration_id = ?',
            [registration.id]
          );

          return {
            id: registration.id,
            user: registration.user_id ? {
              id: registration.user_id,
              name: registration.user_name,
              email: registration.user_email
            } : null,
            ticket_type: registration.ticket_type,
            quantity: registration.quantity,
            total_price: parseFloat(registration.total_price),
            attendee_info: {
              name: registration.attendee_name,
              email: registration.attendee_email,
              phone: registration.attendee_phone
            },
            payment_status: registration.payment_status,
            registration_date: registration.registration_date,
            tickets: tickets
          };
        })
      );

      res.json(registrationsWithTickets);

    } catch (error) {
      console.error('Get event registrations error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }

  // Get single registration details
  async getRegistration(req, res) {
    try {
      const { id } = req.params;

      const registration = await database.get(`
        SELECT r.*, e.title, e.date, e.time, e.location, e.category, e.image_url,
               o.name as organizer_name, u.name as user_name
        FROM registrations r
        JOIN events e ON r.event_id = e.id
        JOIN organizers o ON e.organizer_id = o.id
        LEFT JOIN users u ON r.user_id = u.id
        WHERE r.id = ?
      `, [id]);

      if (!registration) {
        return res.status(404).json({
          error: 'Registration not found'
        });
      }

      // Check permissions
      const canView = 
        (req.user.type === 'user' && req.user.id == registration.user_id) ||
        (req.user.type === 'organizer' && req.user.id == registration.organizer_id) ||
        req.user.type === 'admin';

      if (!canView) {
        return res.status(403).json({
          error: 'You do not have permission to view this registration'
        });
      }

      // Get tickets
      const tickets = await database.all(
        'SELECT * FROM tickets WHERE registration_id = ?',
        [id]
      );

      const response = {
        id: registration.id,
        event: {
          id: registration.event_id,
          title: registration.title,
          date: registration.date,
          time: registration.time,
          location: registration.location,
          category: registration.category,
          image: registration.image_url,
          organizer: registration.organizer_name
        },
        user: registration.user_id ? {
          id: registration.user_id,
          name: registration.user_name
        } : null,
        ticket_type: registration.ticket_type,
        quantity: registration.quantity,
        total_price: parseFloat(registration.total_price),
        attendee_info: {
          name: registration.attendee_name,
          email: registration.attendee_email,
          phone: registration.attendee_phone
        },
        payment_status: registration.payment_status,
        payment_method: registration.payment_method,
        registration_date: registration.registration_date,
        tickets: tickets
      };

      res.json(response);

    } catch (error) {
      console.error('Get registration error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }

  // Cancel registration
  async cancelRegistration(req, res) {
    try {
      const { id } = req.params;

      const registration = await database.get(
        'SELECT * FROM registrations WHERE id = ?',
        [id]
      );

      if (!registration) {
        return res.status(404).json({
          error: 'Registration not found'
        });
      }

      // Check permissions
      const canCancel = 
        (req.user.type === 'user' && req.user.id == registration.user_id) ||
        (req.user.type === 'organizer') ||
        req.user.type === 'admin';

      if (!canCancel) {
        return res.status(403).json({
          error: 'You do not have permission to cancel this registration'
        });
      }

      // Check if event hasn't started yet
      const event = await database.get(
        'SELECT date, time FROM events WHERE id = ?',
        [registration.event_id]
      );

      const eventDateTime = new Date(`${event.date}T${event.time}`);
      const now = new Date();
      
      // Allow cancellation up to 24 hours before event
      const cutoffTime = new Date(eventDateTime.getTime() - 24 * 60 * 60 * 1000);
      
      if (now > cutoffTime) {
        return res.status(400).json({
          error: 'Cannot cancel registration within 24 hours of event start'
        });
      }

      // Begin transaction
      await database.run('BEGIN TRANSACTION');

      try {
        // Update registration status
        await database.run(
          'UPDATE registrations SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          ['cancelled', id]
        );

        // Invalidate tickets
        await database.run(
          'UPDATE tickets SET status = ? WHERE registration_id = ?',
          ['cancelled', id]
        );

        // Return tickets to availability
        const ticketField = registration.ticket_type === 'general' ? 'general_remaining' : 'vip_remaining';
        await database.run(`
          UPDATE events 
          SET ${ticketField} = ${ticketField} + ?
          WHERE id = ?
        `, [registration.quantity, registration.event_id]);

        // Create notification
        if (registration.user_id) {
          await database.run(`
            INSERT INTO notifications (user_id, title, content, type)
            VALUES (?, ?, ?, ?)
          `, [
            registration.user_id,
            'Registration Cancelled',
            `Your registration has been cancelled. Refund will be processed if applicable.`,
            'info'
          ]);
        }

        await database.run('COMMIT');

        res.json({
          message: 'Registration cancelled successfully'
        });

      } catch (error) {
        await database.run('ROLLBACK');
        throw error;
      }

    } catch (error) {
      console.error('Cancel registration error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }

  // Check in attendee (for event organizers)
  async checkInAttendee(req, res) {
    try {
      const { ticketCode } = req.body;

      if (!ticketCode) {
        return res.status(400).json({
          error: 'Ticket code is required'
        });
      }

      // Find ticket
      const ticket = await database.get(`
        SELECT t.*, r.event_id, r.attendee_name, e.organizer_id
        FROM tickets t
        JOIN registrations r ON t.registration_id = r.id
        JOIN events e ON r.event_id = e.id
        WHERE t.ticket_code = ?
      `, [ticketCode]);

      if (!ticket) {
        return res.status(404).json({
          error: 'Invalid ticket code'
        });
      }

      // Check if organizer owns this event
      if (req.user.type === 'organizer' && req.user.id != ticket.organizer_id) {
        return res.status(403).json({
          error: 'You can only check in attendees for your own events'
        });
      }

      // Check ticket status
      if (ticket.status !== 'valid') {
        return res.status(400).json({
          error: `Ticket is ${ticket.status} and cannot be used for check-in`
        });
      }

      // Check if already checked in
      if (ticket.check_in_date) {
        return res.status(400).json({
          error: 'Ticket has already been used for check-in',
          check_in_date: ticket.check_in_date
        });
      }

      // Update ticket with check-in time
      await database.run(
        'UPDATE tickets SET check_in_date = CURRENT_TIMESTAMP WHERE id = ?',
        [ticket.id]
      );

      res.json({
        message: 'Check-in successful',
        attendee_name: ticket.attendee_name,
        ticket_type: ticket.ticket_type,
        check_in_time: new Date().toISOString()
      });

    } catch (error) {
      console.error('Check-in error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }

  // Generate unique ticket code
  generateTicketCode() {
    const prefix = 'TKT';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  // Get registration statistics for organizer
  async getRegistrationStats(req, res) {
    try {
      const { eventId } = req.params;

      // Verify organizer owns this event
      if (req.user.type === 'organizer') {
        const event = await database.get(
          'SELECT organizer_id FROM events WHERE id = ?',
          [eventId]
        );

        if (!event || event.organizer_id != req.user.id) {
          return res.status(403).json({
            error: 'You can only view statistics for your own events'
          });
        }
      }

      // Get registration statistics
      const stats = await database.get(`
        SELECT 
          COUNT(*) as total_registrations,
          SUM(quantity) as total_tickets_sold,
          SUM(CASE WHEN ticket_type = 'general' THEN quantity ELSE 0 END) as general_tickets_sold,
          SUM(CASE WHEN ticket_type = 'vip' THEN quantity ELSE 0 END) as vip_tickets_sold,
          SUM(total_price) as total_revenue,
          COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_registrations,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_registrations
        FROM registrations 
        WHERE event_id = ?
      `, [eventId]);

      // Get check-in statistics
      const checkinStats = await database.get(`
        SELECT 
          COUNT(CASE WHEN t.check_in_date IS NOT NULL THEN 1 END) as checked_in_count,
          COUNT(*) as total_tickets_issued
        FROM tickets t
        JOIN registrations r ON t.registration_id = r.id
        WHERE r.event_id = ?
      `, [eventId]);

      res.json({
        registrations: {
          total: stats.total_registrations || 0,
          confirmed: stats.confirmed_registrations || 0,
          cancelled: stats.cancelled_registrations || 0
        },
        tickets: {
          total_sold: stats.total_tickets_sold || 0,
          general_sold: stats.general_tickets_sold || 0,
          vip_sold: stats.vip_tickets_sold || 0,
          checked_in: checkinStats.checked_in_count || 0
        },
        revenue: {
          total: parseFloat(stats.total_revenue) || 0
        }
      });

    } catch (error) {
      console.error('Get registration stats error:', error);
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }
}

module.exports = new RegistrationController();