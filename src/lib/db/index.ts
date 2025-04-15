import { Pool } from 'pg';

// Database connection configuration
// Doble verificación para asegurarnos de usar la configuración correcta en producción
const isDevelopment = process.env.NODE_ENV !== 'production' && !process.env.VERCEL;

// Configuration for database
let poolConfig: any;

// Depuración para ayudar a identificar problemas
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('VERCEL:', process.env.VERCEL);
console.log('DATABASE_URL disponible:', !!process.env.DATABASE_URL);
console.log('Entorno de desarrollo:', isDevelopment);

if (isDevelopment && !process.env.DATABASE_URL) {
  // Local development database - usando variables de entorno
  console.log('Usando configuración de base de datos local');
  poolConfig = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  };
} else {
  // Production database (Neon) o si DATABASE_URL está disponible incluso en desarrollo
  console.log('Usando configuración de base de datos en la nube (Neon)');
  if (!process.env.DATABASE_URL) {
    console.error('ERROR: DATABASE_URL no está configurada en el entorno');
  }
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