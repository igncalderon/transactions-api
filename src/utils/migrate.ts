import fs from 'fs';
import path from 'path';
import pool from '../config/database';

export async function runMigrations(): Promise<void> {
  try {
    console.log('🔄 Running database migrations...');
    
    // Read migration file
    const migrationPath = path.join(__dirname, '../../migrations/001_create_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute migration
    await pool.query(migrationSQL);
    
    console.log('✅ Database migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}
