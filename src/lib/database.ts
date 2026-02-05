import { Pool, PoolClient } from 'pg';

// Database connection pool
let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL or DIRECT_URL environment variable is required');
    }
    
    pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
    
    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }
  return pool;
}

// Execute a query
export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const pool = getPool();
  const result = await pool.query(text, params);
  return result.rows as T[];
}

// Get a client for transactions
export async function getClient(): Promise<PoolClient> {
  const pool = getPool();
  return pool.connect();
}

// Initialize database tables
export async function initDatabase(): Promise<void> {
  const createTableSQL = `
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
    
    CREATE INDEX IF NOT EXISTS idx_sessions_last_active 
    ON chat_sessions(last_active_at DESC);
  `;
  
  try {
    await query(createTableSQL);
    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database tables:', error);
    throw error;
  }
}

// Close pool (for graceful shutdown)
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
