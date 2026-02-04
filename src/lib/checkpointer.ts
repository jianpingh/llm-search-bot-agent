import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';

let checkpointer: PostgresSaver | null = null;

export async function getCheckpointer(): Promise<PostgresSaver> {
  if (checkpointer) {
    return checkpointer;
  }

  // Use DIRECT_URL for direct connection (not pooler) to avoid connection issues
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  
  if (!connectionString) {
    throw new Error('DATABASE_URL or DIRECT_URL environment variable is not set');
  }

  // Create PostgresSaver from connection string
  checkpointer = PostgresSaver.fromConnString(connectionString);
  
  // Setup the checkpointer tables (creates tables if not exist)
  await checkpointer.setup();
  
  console.log('[Checkpointer] PostgreSQL (Supabase) checkpointer initialized');
  
  return checkpointer;
}
