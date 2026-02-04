import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';
import { Pool } from 'pg';

let checkpointer: PostgresSaver | null = null;
let pool: Pool | null = null;
let lastHealthCheck = 0;
const HEALTH_CHECK_INTERVAL = 30000; // 30 seconds

// Check if connection is still alive
async function isConnectionHealthy(): Promise<boolean> {
  if (!pool) return false;
  
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    return true;
  } catch (error) {
    console.log('[Checkpointer] Connection health check failed:', error);
    return false;
  }
}

// Reset the connection
async function resetConnection(): Promise<void> {
  console.log('[Checkpointer] Resetting connection...');
  
  if (pool) {
    try {
      await pool.end();
    } catch (e) {
      // Ignore errors when closing
    }
  }
  
  pool = null;
  checkpointer = null;
}

export async function getCheckpointer(): Promise<PostgresSaver> {
  const now = Date.now();
  
  // Periodic health check
  if (checkpointer && (now - lastHealthCheck > HEALTH_CHECK_INTERVAL)) {
    lastHealthCheck = now;
    const healthy = await isConnectionHealthy();
    if (!healthy) {
      await resetConnection();
    }
  }
  
  if (checkpointer) {
    return checkpointer;
  }

  // Use DIRECT_URL for direct connection (not pooler) to avoid connection issues
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  
  if (!connectionString) {
    throw new Error('DATABASE_URL or DIRECT_URL environment variable is not set');
  }

  try {
    // Create a connection pool with proper settings for Supabase
    pool = new Pool({
      connectionString,
      max: 5, // Maximum connections
      idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
      connectionTimeoutMillis: 10000, // Timeout for new connections
      keepAlive: true, // Enable TCP keepalive
      keepAliveInitialDelayMillis: 10000,
    });

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('[Checkpointer] Pool error:', err.message);
      // Reset on error so next call creates fresh connection
      checkpointer = null;
      pool = null;
    });

    // Create PostgresSaver with the pool
    checkpointer = new PostgresSaver(pool);
    
    // Setup the checkpointer tables (creates tables if not exist)
    await checkpointer.setup();
    
    lastHealthCheck = now;
    console.log('[Checkpointer] PostgreSQL (Supabase) checkpointer initialized');
    
    return checkpointer;
  } catch (error) {
    console.error('[Checkpointer] Failed to initialize:', error);
    await resetConnection();
    throw error;
  }
}

// Graceful shutdown
export async function closeCheckpointer(): Promise<void> {
  await resetConnection();
  console.log('[Checkpointer] Connection closed');
}
