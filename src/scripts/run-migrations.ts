import { initializeDatabase, AppDataSource } from '../config/database';
import logger from '../utils/logger';

const runMigrations = async () => {
  logger.info('🔄 Running database migrations...');
  try {
    // Use the initializeDatabase function which has retry logic
    await initializeDatabase();
    await AppDataSource.runMigrations();
    logger.info('✅ Migrations completed');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

runMigrations();

