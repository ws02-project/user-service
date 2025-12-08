import { DataSource } from 'typeorm';
import { config } from './index';
import { User } from '../models/user.model';
import logger from '../utils/logger';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: config.db.host,
  port: config.db.port,
  username: config.db.user,
  password: config.db.password,
  database: config.db.name,
  synchronize: config.env === 'development', // Auto-sync schema in development only
  logging: config.env === 'development',
  entities: [User],
  migrations: [config.env === 'production' ? 'dist/migrations/**/*.js' : 'src/migrations/**/*.ts'],
  migrationsRun: true, // Automatically run migrations on startup
  subscribers: [],
  poolSize: config.db.poolMax,
  extra: {
    min: config.db.poolMin,
    max: config.db.poolMax,
    connectionTimeoutMillis: 30000, // 30 seconds
    idleTimeoutMillis: 30000, // 30 seconds
    statement_timeout: 30000,
  },
});

export const initializeDatabase = async (retryAttempts: number = 5): Promise<void> => {
  let attempt = 0;

  while (attempt < retryAttempts) {
    try {
      attempt++;
      logger.info(`🔄 Connecting to database... (attempt ${attempt}/${retryAttempts})`);

      await AppDataSource.initialize();
      logger.info('✅ Database connection established successfully');
      return;
    } catch (error: any) {
      if (attempt >= retryAttempts) {
        logger.error('❌ Error during database initialization:', error);
        throw error;
      }

      if (error.code === 'ECONNRESET' || error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        const waitTime = Math.min(1000 * attempt, 5000); // Exponential backoff, max 5s
        logger.warn(
          `Failed to connect to database (attempt ${attempt}/${retryAttempts}). Retrying in ${waitTime}ms...`,
        );
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      } else {
        logger.error('❌ Error during database initialization:', error);
        throw error;
      }
    }
  }
};

export const closeDatabase = async (): Promise<void> => {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
    logger.info('Database connection closed');
  }
};

