import dotenv from 'dotenv';

dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  environment: process.env.ENVIRONMENT || process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3002', 10),
  apiVersion: process.env.API_VERSION || 'v1',
  serviceName: process.env.SERVICE_NAME || 'user-service',
  logLevel: process.env.LOG_LEVEL || 'info',
  grpc: {
    port: parseInt(process.env.GRPC_PORT || '50053', 10),
  },
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'userdb',
    user: process.env.DB_USER || 'useruser',
    password: process.env.DB_PASSWORD || 'userpass',
    poolMin: parseInt(process.env.DB_POOL_MIN || '2', 10),
    poolMax: parseInt(process.env.DB_POOL_MAX || '10', 10),
  },
  rabbitmq: {
    host: process.env.RABBITMQ_HOST || 'localhost',
    port: parseInt(process.env.RABBITMQ_PORT || '5672', 10),
    user: process.env.RABBITMQ_USER || 'admin',
    password: process.env.RABBITMQ_PASSWORD || 'admin123',
    get url(): string {
      // URL-encode credentials to handle special characters like @
      const encodedUser = encodeURIComponent(this.user);
      const encodedPassword = encodeURIComponent(this.password);
      return `amqp://${encodedUser}:${encodedPassword}@${this.host}:${this.port}`;
    },
  },
  asgardeo: {
    // Asgardeo OIDC Configuration
    issuer: process.env.ASGARDEO_ISSUER || 'https://api.asgardeo.io/t/{org_name}/oauth2/token',
    jwksUri: process.env.ASGARDEO_JWKS_URI || 'https://api.asgardeo.io/t/{org_name}/oauth2/jwks',
    clientId: process.env.ASGARDEO_CLIENT_ID || '',
    clientSecret: process.env.ASGARDEO_CLIENT_SECRET || '',
    audience: process.env.ASGARDEO_AUDIENCE || '',
    // Token introspection endpoint (optional)
    introspectionEndpoint: process.env.ASGARDEO_INTROSPECTION_ENDPOINT || '',
    // Cache settings
    jwksCacheMaxAge: parseInt(process.env.ASGARDEO_JWKS_CACHE_MAX_AGE || '86400000', 10), // 24 hours
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
};

export const isProduction = config.env === 'production';
export const isDevelopment = config.env === 'development';

export default config;








