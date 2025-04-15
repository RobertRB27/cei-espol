import { Pool } from 'pg';

// Database connection configuration
const isDevelopment = process.env.NODE_ENV !== 'production';

// Configuration for database
let poolConfig: any;

if (isDevelopment) {
  // Local development database
  poolConfig = {
    host: 'localhost',
    port: 5432,
    database: 'cei_espol_db_dev',
    user: 'admin_cei_db',
    password: 'rosso2711',
  };
} else {
  // Production database (Neon)
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  };
}

// Create pool with appropriate configuration
const pool = new Pool(poolConfig);

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