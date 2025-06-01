// Database configuration and connection
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
  constructor() {
    this.db = null;
    this.dbPath = process.env.DB_PATH || './data/event_management.db';
    this.isConnected = false;
  }

  // Initialize database connection
  async connect() {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
        console.log(`📁 Created data directory: ${dataDir}`);
      }

      // Create database connection
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('❌ Error opening database:', err.message);
          throw err;
        }
        console.log(`✅ Connected to SQLite database: ${this.dbPath}`);
      });

      // Enable foreign keys
      await this.run('PRAGMA foreign_keys = ON');
      
      this.isConnected = true;
      return this.db;
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  // Execute a query with parameters
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          console.error('❌ Database run error:', err.message);
          console.error('📝 SQL:', sql);
          console.error('📝 Params:', params);
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  // Get a single row
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          console.error('❌ Database get error:', err.message);
          console.error('📝 SQL:', sql);
          console.error('📝 Params:', params);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Get all rows
  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          console.error('❌ Database all error:', err.message);
          console.error('📝 SQL:', sql);
          console.error('📝 Params:', params);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Close database connection
  close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            console.error('❌ Error closing database:', err.message);
            reject(err);
          } else {
            console.log('✅ Database connection closed');
            this.isConnected = false;
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  // Check if database is connected
  isConnected() {
    return this.isConnected;
  }

  // Execute multiple statements in a transaction
  async transaction(statements) {
    try {
      await this.run('BEGIN TRANSACTION');
      
      for (const statement of statements) {
        await this.run(statement.sql, statement.params);
      }
      
      await this.run('COMMIT');
      console.log('✅ Transaction completed successfully');
    } catch (error) {
      await this.run('ROLLBACK');
      console.error('❌ Transaction failed, rolled back:', error.message);
      throw error;
    }
  }

  // Backup database
  async backup() {
    try {
      const backupDir = process.env.DB_BACKUP_PATH || './data/backups/';
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(backupDir, `backup_${timestamp}.db`);
      
      // Simple file copy for SQLite
      fs.copyFileSync(this.dbPath, backupPath);
      console.log(`✅ Database backed up to: ${backupPath}`);
      
      return backupPath;
    } catch (error) {
      console.error('❌ Database backup failed:', error.message);
      throw error;
    }
  }

  // Get database stats
  async getStats() {
    try {
      const tables = await this.all(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
      `);

      const stats = {
        tables: [],
        totalRecords: 0
      };

      for (const table of tables) {
        const count = await this.get(`SELECT COUNT(*) as count FROM ${table.name}`);
        stats.tables.push({
          name: table.name,
          records: count.count
        });
        stats.totalRecords += count.count;
      }

      return stats;
    } catch (error) {
      console.error('❌ Error getting database stats:', error.message);
      throw error;
    }
  }
}

// Create and export database instance
const database = new Database();

module.exports = database;