import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  user: process.env['DB_USER'] || 'postgres',
  host: process.env['DB_HOST'] || 'localhost',
  database: process.env['DB_NAME'] || 'transactions_db',
  password: process.env['DB_PASSWORD'] || 'password',
  port: parseInt(process.env['DB_PORT'] || '5432'),
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err: any) => {
  console.error('❌ PostgreSQL connection error:', err);
});

export default pool;
