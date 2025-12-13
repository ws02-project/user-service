// Test setup file
// This file runs before all tests

// Mock uuid globally for all tests (uuid@13 is ESM-only)
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-1234-5678-9abc-def012345678'),
  v1: jest.fn(() => 'test-uuid-v1'),
  v3: jest.fn(() => 'test-uuid-v3'),
  v5: jest.fn(() => 'test-uuid-v5'),
  validate: jest.fn(() => true),
  version: jest.fn(() => 4),
  NIL: '00000000-0000-0000-0000-000000000000',
  MAX: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
  parse: jest.fn(),
  stringify: jest.fn(),
}));

// Mock jose globally for all tests (jose@6 is ESM-only)
jest.mock('jose', () => ({
  createRemoteJWKSet: jest.fn(() => jest.fn()),
  jwtVerify: jest.fn(() =>
    Promise.resolve({
      payload: {
        sub: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        iss: 'https://api.asgardeo.io/t/test/oauth2/token',
        aud: 'test-client-id',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
      },
      protectedHeader: { alg: 'RS256', typ: 'JWT' },
    }),
  ),
  errors: {
    JWTExpired: class JWTExpired extends Error {
      constructor(message: string) {
        super(message);
        this.name = 'JWTExpired';
      }
    },
    JWTClaimValidationFailed: class JWTClaimValidationFailed extends Error {
      constructor(message: string) {
        super(message);
        this.name = 'JWTClaimValidationFailed';
      }
    },
  },
}));

// Set test environment
process.env.NODE_ENV = 'test';
process.env.ENVIRONMENT = 'test';
process.env.LOG_LEVEL = 'error'; // Reduce log noise during tests

// Increase timeout for integration tests
jest.setTimeout(30000);

