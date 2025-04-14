import { Pool } from 'pg';

// Database connection pool
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'cei_espol_db_dev',
  user: 'admin_cei_db',
  password: 'rosso2711',
});

// Set the default schema
pool.on('connect', (client) => {
  client.query('SET search_path TO users, public');
});

// Helper function to get a client from the pool
export async function getClient() {
  const client = await pool.connect();
  // Ensure schema is set for this connection
  await client.query('SET search_path TO users, public');
  return client;
}

// Helper function to execute a query
export async function query(text: string, params: any[] = []) {
  const client = await getClient();
  
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

export default pool;
