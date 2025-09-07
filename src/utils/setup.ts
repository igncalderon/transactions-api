import { pool } from '../config/database';
import fs from 'fs';
import path from 'path';

export async function setupDatabase() {
  try {
    console.log('🚀 Setting up database from scratch...');
    
    // Crear la base de datos si no existe
    console.log('📊 Creating database if not exists...');
    await pool.query('CREATE DATABASE transactions_db;');
    console.log('✅ Database created or already exists');
    
  } catch (error: any) {
    if (error.code === '42P04') {
      console.log('ℹ️  Database already exists, continuing...');
    } else {
      console.error('❌ Error creating database:', error.message);
      throw error;
    }
  }

  try {
    console.log('🔄 Creating tables and configurations...');
    
    // SQL para crear todo desde cero
    const setupSQL = `
-- Crear tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de transacciones
CREATE TABLE IF NOT EXISTS transactions (
    id VARCHAR(255) PRIMARY KEY,
    from_user_id VARCHAR(255) NOT NULL,
    to_user_id VARCHAR(255) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (from_user_id) REFERENCES users(id),
    FOREIGN KEY (to_user_id) REFERENCES users(id)
);

-- Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_transactions_from_user_id ON transactions(from_user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_to_user_id ON transactions(to_user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at 
    BEFORE UPDATE ON transactions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;

    await pool.query(setupSQL);
    console.log('✅ Tables and configurations created successfully');
    
    // Verificar que todo esté funcionando
    console.log('🔍 Verifying setup...');
    const usersTable = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_name = 'users'");
    const transactionsTable = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_name = 'transactions'");
    
    if (usersTable.rows.length > 0 && transactionsTable.rows.length > 0) {
      console.log('✅ Setup verification successful');
      console.log('🎉 Database is ready to use!');
    } else {
      throw new Error('Setup verification failed');
    }
    
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    throw error;
  }
}

// Ejecutar setup si se llama directamente
if (require.main === module) {
  setupDatabase()
    .then(() => {
      console.log('✅ Database setup completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error in database setup:', error);
      process.exit(1);
    });
}
