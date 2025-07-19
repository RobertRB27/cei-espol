import { Pool } from 'pg';

// Database connection configuration
const isDevelopment = process.env.NODE_ENV !== 'production';

// Configuration for database
let poolConfig: any;

if (isDevelopment) {
  // Local development database
  poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'cei_espol_db_dev',
    user: process.env.DB_USER || 'admin_cei_db',
    password: process.env.DB_PASSWORD || 'rosso2711',
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
const pool = new Pool({
  ...poolConfig,
  // Add connection pooling configuration for better performance
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
});

// Set the default schema
pool.on('connect', (client) => {
  client.query('SET search_path TO users, public');
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Helper function to get a client from the pool
export async function getClient() {
  const client = await pool.connect();
  // Ensure schema is set for this connection
  await client.query('SET search_path TO users, public');
  return client;
}

// Helper function to execute a query with better error handling
export async function query(text: string, params: any[] = []) {
  const client = await getClient();
  
  try {
    const result = await client.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Helper function for transactions
export async function withTransaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export default pool;