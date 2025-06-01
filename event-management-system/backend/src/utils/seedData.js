// Seed Data Generator
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const database = require('../config/database');

async function seedData() {
  try {
    console.log('🌱 Starting data seeding...');

    // Check if data already exists
    const existingUsers = await database.get('SELECT COUNT(*) as count FROM users');
    const existingOrganizers = await database.get('SELECT COUNT(*) as count FROM organizers');
    const existingEvents = await database.get('SELECT COUNT(*) as count FROM events');

    if (existingUsers.count > 0 || existingOrganizers.count > 0 || existingEvents.count > 0) {
      console.log('⚠️ Data already exists, skipping seed...');
      return;
    }

    // Hash password for demo accounts
    const defaultPassword = await bcrypt.hash('demo123456', 12);

    // Create organizers (minimum 10 required)
    console.log('👨‍💼 Creating organizers...');
    const organizers = [
      {
        name: 'Tech Events Inc.',
        email: 'organizer@techevents.com',
        company: 'Tech Events Inc.',
        phone: '+1-555-0101',
        description: 'Leading technology event organizer specializing in conferences and workshops.',
        website: 'https://techevents.com'
      },
      {
        name: 'Music Festivals LLC',
        email: 'info@musicfestivals.com',
        company: 'Music Festivals LLC',
        phone: '+1-555-0102',
        description: 'Premier music festival and concert organizer.',
        website: 'https://musicfestivals.com'
      },
      {
        name: 'Business Network Association',
        email: 'contact@bna.com',
        company: 'Business Network Association',
        phone: '+1-555-0103',
        description: 'Professional networking and business development events.',
        website: 'https://bna.com'
      },
      {
        name: 'Code Academy Events',
        email: 'workshops@codeacademy.com',
        company: 'Code Academy',
        phone: '+1-555-0104',
        description: 'Educational workshops and coding bootcamps.',
        website: 'https://codeacademy.com'
      },
      {
        name: 'Startup Accelerator',
        email: 'events@startupaccelerator.com',
        company: 'Startup Accelerator',
        phone: '+1-555-0105',
        description: 'Startup pitch competitions and entrepreneurship events.',
        website: 'https://startupaccelerator.com'
      },
      {
        name: 'Digital Marketing Hub',
        email: 'admin@digitalhub.com',
        company: 'Digital Marketing Hub',
        phone: '+1-555-0106',
        description: 'Digital marketing conferences and training sessions.',
        website: 'https://digitalhub.com'
      },
      {
        name: 'Green Energy Expo',
        email: 'info@greenexpo.com',
        company: 'Green Energy Expo',
        phone: '+1-555-0107',
        description: 'Sustainable energy and environmental conferences.',
        website: 'https://greenexpo.com'
      },
      {
        name: 'Creative Arts Society',
        email: 'events@creativesociety.com',
        company: 'Creative Arts Society',
        phone: '+1-555-0108',
        description: 'Art exhibitions, workshops, and creative networking events.',
        website: 'https://creativesociety.com'
      },
      {
        name: 'Health & Wellness Events',
        email: 'contact@healthwellness.com',
        company: 'Health & Wellness Events',
        phone: '+1-555-0109',
        description: 'Health, fitness, and wellness conferences and workshops.',
        website: 'https://healthwellness.com'
      },
      {
        name: 'EdTech Innovations',
        email: 'events@edtechinnovations.com',
        company: 'EdTech Innovations',
        phone: '+1-555-0110',
        description: 'Educational technology conferences and training programs.',
        website: 'https://edtechinnovations.com'
      }
    ];

    const organizerIds = [];
    for (const org of organizers) {
      const result = await database.run(`
        INSERT INTO organizers (name, email, password_hash, company, phone, description, website, is_verified)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1)
      `, [org.name, org.email, defaultPassword, org.company, org.phone, org.description, org.website]);
      
      organizerIds.push(result.id);
    }

    // Create sample users
    console.log('👤 Creating users...');
    const users = [
      {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1-555-0201'
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+1-555-0202'
      },
      {
        name: 'Mike Johnson',
        email: 'mike@example.com',
        phone: '+1-555-0203'
      },
      {
        name: 'Sarah Wilson',
        email: 'sarah@example.com',
        phone: '+1-555-0204'
      },
      {
        name: 'Demo User',
        email: 'demo@example.com',
        phone: '+1-555-0205'
      }
    ];

    const userIds = [];
    for (const user of users) {
      const result = await database.run(`
        INSERT INTO users (name, email, password_hash, phone, email_verified)
        VALUES (?, ?, ?, ?, 1)
      `, [user.name, user.email, defaultPassword, user.phone]);
      
      userIds.push(result.id);
    }

    // Create events
    console.log('🎪 Creating events...');
    const events = [
      {
        title: 'Tech Conference 2025',
        description: 'Join us for the biggest tech conference of the year. Learn from industry experts and network with professionals.',
        date: '2025-12-15',
        time: '09:00',
        location: 'Convention Center, New York',
        category: 'conference',
        image_url: '../images/tech_conference_2023.jpg',
        organizer_id: organizerIds[0],
        general_price: 50.00,
        general_capacity: 500,
        vip_price: 150.00,
        vip_capacity: 100
      },
      {
        title: 'Summer Music Festival',
        description: 'A three-day music festival featuring top artists from around the world. Food, drinks, and camping available.',
        date: '2025-07-20',
        time: '14:00',
        location: 'Central Park, New York',
        category: 'concert',
        image_url: '../images/summer_music_festival.jpg',
        organizer_id: organizerIds[1],
        general_price: 75.00,
        general_capacity: 2000,
        vip_price: 250.00,
        vip_capacity: 300
      },
      {
        title: 'Business Networking Lunch',
        description: 'Connect with local business leaders and entrepreneurs over lunch. Great opportunity for networking and collaboration.',
        date: '2025-06-10',
        time: '12:00',
        location: 'Grand Hotel, Boston',
        category: 'networking',
        image_url: '../images/business_networking_lunch.jpg',
        organizer_id: organizerIds[2],
        general_price: 30.00,
        general_capacity: 100,
        vip_price: 75.00,
        vip_capacity: 20
      },
      {
        title: 'Web Development Workshop',
        description: 'Learn the latest web development techniques and tools in this hands-on workshop. Suitable for beginners and intermediate developers.',
        date: '2025-08-05',
        time: '10:00',
        location: 'Tech Hub, San Francisco',
        category: 'workshop',
        image_url: '../images/web_development_workshop.jpg',
        organizer_id: organizerIds[3],
        general_price: 25.00,
        general_capacity: 50,
        vip_price: 60.00,
        vip_capacity: 10
      },
      {
        title: 'Startup Pitch Competition',
        description: 'Watch innovative startups pitch their ideas to a panel of investors. Networking reception to follow.',
        date: '2025-09-20',
        time: '18:00',
        location: 'Innovation Center, Austin',
        category: 'networking',
        image_url: '../images/startup_pitch_competition.jpg',
        organizer_id: organizerIds[4],
        general_price: 15.00,
        general_capacity: 200,
        vip_price: 50.00,
        vip_capacity: 30
      },
      {
        title: 'AI and Machine Learning Conference',
        description: 'Explore the latest advancements in artificial intelligence and machine learning with leading researchers and practitioners.',
        date: '2025-11-10',
        time: '09:30',
        location: 'Science Center, Seattle',
        category: 'conference',
        image_url: '../images/ai_machine_learning_conference.jpg',
        organizer_id: organizerIds[0],
        general_price: 60.00,
        general_capacity: 300,
        vip_price: 180.00,
        vip_capacity: 50
      },
      {
        title: 'Digital Marketing Summit',
        description: 'Learn the latest digital marketing strategies and trends from industry experts.',
        date: '2025-10-15',
        time: '09:00',
        location: 'Marketing Center, Chicago',
        category: 'conference',
        image_url: '../images/tech_conference_2023.jpg',
        organizer_id: organizerIds[5],
        general_price: 40.00,
        general_capacity: 250,
        vip_price: 120.00,
        vip_capacity: 40
      },
      {
        title: 'Green Energy Symposium',
        description: 'Discuss sustainable energy solutions and environmental initiatives.',
        date: '2025-09-05',
        time: '08:30',
        location: 'Eco Center, Portland',
        category: 'conference',
        image_url: '../images/ai_machine_learning_conference.jpg',
        organizer_id: organizerIds[6],
        general_price: 35.00,
        general_capacity: 180,
        vip_price: 90.00,
        vip_capacity: 25
      }
    ];

    const eventIds = [];
    for (const event of events) {
      const result = await database.run(`
        INSERT INTO events (
          title, description, date, time, location, category, image_url,
          organizer_id, general_price, general_capacity, general_remaining,
          vip_price, vip_capacity, vip_remaining
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        event.title, event.description, event.date, event.time, event.location,
        event.category, event.image_url, event.organizer_id,
        event.general_price, event.general_capacity, event.general_capacity,
        event.vip_price, event.vip_capacity, event.vip_capacity
      ]);
      
      eventIds.push(result.id);
    }

    // Create sample registrations (minimum 50 required)
    console.log('📝 Creating registrations...');
    const ticketTypes = ['general', 'vip'];
    const registrationCount = 60; // Exceed minimum requirement

    for (let i = 0; i < registrationCount; i++) {
      const userId = userIds[Math.floor(Math.random() * userIds.length)];
      const eventId = eventIds[Math.floor(Math.random() * eventIds.length)];
      const ticketType = ticketTypes[Math.floor(Math.random() * ticketTypes.length)];
      const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 tickets
      
      // Get event for pricing
      const event = await database.get('SELECT * FROM events WHERE id = ?', [eventId]);
      const unitPrice = ticketType === 'general' ? event.general_price : event.vip_price;
      const totalPrice = unitPrice * quantity;

      // Get user for attendee info
      const user = await database.get('SELECT * FROM users WHERE id = ?', [userId]);

      try {
        // Create registration
        const regResult = await database.run(`
          INSERT INTO registrations (
            user_id, event_id, ticket_type, quantity, total_price,
            attendee_name, attendee_email, attendee_phone,
            payment_status, payment_method
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'completed', 'demo')
        `, [
          userId, eventId, ticketType, quantity, totalPrice,
          user.name, user.email, user.phone
        ]);

        // Update event capacity
        const capacityField = ticketType === 'general' ? 'general_remaining' : 'vip_remaining';
        await database.run(`
          UPDATE events SET ${capacityField} = ${capacityField} - ? WHERE id = ?
        `, [quantity, eventId]);

        // Create tickets
        for (let j = 0; j < quantity; j++) {
          const ticketCode = generateTicketCode();
          await database.run(`
            INSERT INTO tickets (registration_id, ticket_code, ticket_type)
            VALUES (?, ?, ?)
          `, [regResult.id, ticketCode, ticketType]);
        }

      } catch (error) {
        // Skip if registration fails (e.g., not enough tickets)
        console.log(`⚠️ Skipped registration ${i + 1}: ${error.message}`);
      }
    }

    // Create sample notifications
    console.log('🔔 Creating notifications...');
    for (const userId of userIds) {
      const notifications = [
        {
          title: 'Welcome to EventHub!',
          content: 'Thank you for joining EventHub. Start exploring events now!',
          type: 'info'
        },
        {
          title: 'New Events Available',
          content: 'Check out the latest events in your area.',
          type: 'info'
        },
        {
          title: 'Registration Confirmed',
          content: 'Your event registration has been confirmed.',
          type: 'success'
        }
      ];

      for (const notification of notifications) {
        await database.run(`
          INSERT INTO notifications (user_id, title, content, type)
          VALUES (?, ?, ?, ?)
        `, [userId, notification.title, notification.content, notification.type]);
      }
    }

    // Get final counts
    const finalStats = await database.all(`
      SELECT 
        'organizers' as table_name, COUNT(*) as count FROM organizers
      UNION ALL
      SELECT 'users' as table_name, COUNT(*) as count FROM users
      UNION ALL
      SELECT 'events' as table_name, COUNT(*) as count FROM events
      UNION ALL
      SELECT 'registrations' as table_name, COUNT(*) as count FROM registrations
      UNION ALL
      SELECT 'tickets' as table_name, COUNT(*) as count FROM tickets
      UNION ALL
      SELECT 'notifications' as table_name, COUNT(*) as count FROM notifications
    `);

    console.log('📊 Seeding completed successfully!');
    console.log('Final database statistics:');
    finalStats.forEach(stat => {
      console.log(`  ${stat.table_name}: ${stat.count}`);
    });

    console.log('\n🔑 Demo Accounts Created:');
    console.log('Organizers:');
    organizers.forEach(org => {
      console.log(`  📧 ${org.email} | 🔑 demo123456`);
    });
    console.log('Users:');
    users.forEach(user => {
      console.log(`  📧 ${user.email} | 🔑 demo123456`);
    });

    return true;

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

// Generate unique ticket code
function generateTicketCode() {
  const prefix = 'TKT';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedData()
    .then(() => {
      console.log('🎉 Data seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Data seeding failed:', error);
      process.exit(1);
    });
}

module.exports = seedData;