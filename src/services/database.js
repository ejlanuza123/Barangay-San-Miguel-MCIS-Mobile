// src/services/database.js
import * as SQLite from 'expo-sqlite';

let db = null;


export const initDatabase = async () => {
  if (db) {
    return db;
  }

  try {
    console.log('Opening database with Expo SQLite...');
    db = SQLite.openDatabaseSync('bhs-mcis.db');
    console.log('Database opened successfully with openDatabaseSync');

    // Initialize tables with error handling for offline data integrity
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS patients (
        id TEXT PRIMARY KEY, 
        patient_id TEXT UNIQUE, 
        first_name TEXT,
        middle_name TEXT, 
        last_name TEXT, 
        age INTEGER, 
        risk_level TEXT DEFAULT 'NORMAL',
        contact_no TEXT,
        purok TEXT,          
        street TEXT,         
        medical_history TEXT,
        is_synced INTEGER DEFAULT 0 
      );
      
      CREATE TABLE IF NOT EXISTS appointments (
        id TEXT PRIMARY KEY NOT NULL, 
        patient_display_id TEXT, 
        patient_name TEXT, 
        reason TEXT, 
        date TEXT, 
        time TEXT, 
        status TEXT,
        notes TEXT,
        created_by TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS child_records (
        id TEXT PRIMARY KEY,
        child_id TEXT UNIQUE,
        first_name TEXT,
        last_name TEXT,
        dob TEXT,
        sex TEXT,
        place_of_birth TEXT,
        mother_name TEXT,
        father_name TEXT,
        guardian_name TEXT,
        nhts_no TEXT,
        philhealth_no TEXT,
        weight_kg REAL,
        height_cm REAL,
        bmi REAL,
        nutrition_status TEXT,
        last_checkup TEXT,
        health_details TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP   
      );
      
      CREATE TABLE IF NOT EXISTS sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT NOT NULL,
        table_name TEXT NOT NULL,
        payload TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS sync_notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message TEXT NOT NULL,
        type TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        is_read INTEGER DEFAULT 0
      );
    `);

    console.log('All tables created successfully');
    return db;

  } catch (error) {
    console.error('Database initialization failed:', error);
    // Optional: Add retry logic or alert user
    throw error;
  }
};

export const getDatabase = () => {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
};

export default db;
