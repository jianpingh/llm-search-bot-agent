import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';

let checkpointer: PostgresSaver | null = null;

export async function getCheckpointer(): Promise<PostgresSaver> {
  if (checkpointer) {
    return checkpointer;
  }

  const connectionString = process.env.POSTGRES_URL;
  
  if (!connectionString) {
    throw new Error('POSTGRES_URL environment variable is not set');
  }

  // Create PostgresSaver from connection string
  checkpointer = PostgresSaver.fromConnString(connectionString);
  
  // Setup the checkpointer tables (creates tables if not exist)
  await checkpointer.setup();
  
  console.log('[Checkpointer] PostgreSQL checkpointer initialized');
  
  return checkpointer;
}
