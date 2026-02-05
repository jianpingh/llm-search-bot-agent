/**
 * Database initialization script
 * Run this script to create the required tables in your PostgreSQL database
 * 
 * Usage: npx ts-node scripts/init-db.ts
 * Or add "init-db": "ts-node scripts/init-db.ts" to package.json scripts
 */

import { Pool } from 'pg';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function initDatabase() {
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL or DIRECT_URL environment variable is required');
    process.exit(1);
  }
  
  console.log('🔌 Connecting to database...');
  
  const pool = new Pool({
    connectionString,
  });
  
  try {
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful');
    
    // Create tables
    console.log('📦 Creating tables...');
    
    const createTableSQL = `
      -- Chat sessions table
      CREATE TABLE IF NOT EXISTS chat_sessions (
        session_id VARCHAR(100) PRIMARY KEY,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        filters JSONB DEFAULT '{}',
        meta JSONB DEFAULT '{}',
        previous_context JSONB,
        skip_fields JSONB DEFAULT '[]',
        messages JSONB DEFAULT '[]'
      );
      
      -- Index for faster queries by last_active_at
      CREATE INDEX IF NOT EXISTS idx_sessions_last_active 
      ON chat_sessions(last_active_at DESC);
      
      -- Index for session lookup
      CREATE INDEX IF NOT EXISTS idx_sessions_created_at 
      ON chat_sessions(created_at DESC);
    `;
    
    await pool.query(createTableSQL);
    console.log('✅ Tables created successfully');
    
    // Show table info
    const tableInfo = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'chat_sessions'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📋 Table structure:');
    console.table(tableInfo.rows);
    
    // Count existing sessions
    const countResult = await pool.query('SELECT COUNT(*) FROM chat_sessions');
    console.log(`\n📊 Existing sessions: ${countResult.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('\n✅ Database initialization complete');
  }
}

initDatabase();
