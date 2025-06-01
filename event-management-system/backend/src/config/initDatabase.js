// Database initialization and table creation
const database = require('./database');

async function initializeDatabase() {
  try {
    console.log('🔄 Initializing database tables...');

    // Connect to database
    await database.connect();

    // Create tables
    await createTables();
    
    console.log('✅ Database initialization completed');
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    throw error;
  }
}

async function createTables() {
  const tables = [
    // Users table
    {
      name: 'users',
      sql: `
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT,
          phone TEXT,
          role TEXT DEFAULT 'user',
          is_active INTEGER DEFAULT 1,
          email_verified INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `
    },

    // Organizers table
    {
      name: 'organizers',
      sql: `
        CREATE TABLE IF NOT EXISTS organizers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          company TEXT,
          phone TEXT,
          description TEXT,
          website TEXT,
          is_verified INTEGER DEFAULT 0,
          is_active INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `
    },

    // Events table
    {
      name: 'events',
      sql: `
        CREATE TABLE IF NOT EXISTS events (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          date DATE NOT NULL,
          time TIME NOT NULL,
          location TEXT NOT NULL,
          category TEXT NOT NULL,
          image_url TEXT,
          organizer_id INTEGER NOT NULL,
          status TEXT DEFAULT 'active',
          general_price DECIMAL(10,2) DEFAULT 0,
          general_capacity INTEGER DEFAULT 0,
          general_remaining INTEGER DEFAULT 0,
          vip_price DECIMAL(10,2) DEFAULT 0,
          vip_capacity INTEGER DEFAULT 0,
          vip_remaining INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (organizer_id) REFERENCES organizers (id) ON DELETE CASCADE
        )
      `
    },

    // Registrations table
    {
      name: 'registrations',
      sql: `
        CREATE TABLE IF NOT EXISTS registrations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          event_id INTEGER NOT NULL,
          ticket_type TEXT NOT NULL,
          quantity INTEGER DEFAULT 1,
          total_price DECIMAL(10,2) NOT NULL,
          status TEXT DEFAULT 'confirmed',
          attendee_name TEXT NOT NULL,
          attendee_email TEXT NOT NULL,
          attendee_phone TEXT,
          payment_status TEXT DEFAULT 'completed',
          payment_method TEXT DEFAULT 'demo',
          registration_date DATETIME DEFAULT CURRENT_TIMESTAMP,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
          FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE
        )
      `
    },

    // Tickets table
    {
      name: 'tickets',
      sql: `
        CREATE TABLE IF NOT EXISTS tickets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          registration_id INTEGER NOT NULL,
          ticket_code TEXT UNIQUE NOT NULL,
          ticket_type TEXT NOT NULL,
          status TEXT DEFAULT 'valid',
          check_in_date DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (registration_id) REFERENCES registrations (id) ON DELETE CASCADE
        )
      `
    },

    // Notifications table
    {
      name: 'notifications',
      sql: `
        CREATE TABLE IF NOT EXISTS notifications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          type TEXT DEFAULT 'info',
          is_read INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
      `
    },

    // Sessions table (for authentication)
    {
      name: 'sessions',
      sql: `
        CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY,
          user_id INTEGER,
          organizer_id INTEGER,
          user_type TEXT NOT NULL,
          expires_at DATETIME NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
          FOREIGN KEY (organizer_id) REFERENCES organizers (id) ON DELETE CASCADE
        )
      `
    }
  ];

  // Create each table
  for (const table of tables) {
    try {
      await database.run(table.sql);
      console.log(`✅ Table '${table.name}' created/verified`);
    } catch (error) {
      console.error(`❌ Error creating table '${table.name}':`, error.message);
      throw error;
    }
  }

  // Create indexes for better performance
  await createIndexes();
}

async function createIndexes() {
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
    'CREATE INDEX IF NOT EXISTS idx_organizers_email ON organizers(email)',
    'CREATE INDEX IF NOT EXISTS idx_events_organizer ON events(organizer_id)',
    'CREATE INDEX IF NOT EXISTS idx_events_date ON events(date)',
    'CREATE INDEX IF NOT EXISTS idx_events_category ON events(category)',
    'CREATE INDEX IF NOT EXISTS idx_registrations_user ON registrations(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_registrations_event ON registrations(event_id)',
    'CREATE INDEX IF NOT EXISTS idx_tickets_registration ON tickets(registration_id)',
    'CREATE INDEX IF NOT EXISTS idx_tickets_code ON tickets(ticket_code)',
    'CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_sessions_organizer ON sessions(organizer_id)'
  ];

  for (const indexSql of indexes) {
    try {
      await database.run(indexSql);
    } catch (error) {
      // Indexes might already exist, so we can continue
      console.log(`ℹ️ Index creation info: ${error.message}`);
    }
  }

  console.log('✅ Database indexes created/verified');
}

// Run initialization if this file is executed directly
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('🎉 Database initialization completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Database initialization failed:', error);
      process.exit(1);
    });
}

module.exports = initializeDatabase;