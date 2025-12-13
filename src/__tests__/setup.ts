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

// Set test environment
process.env.NODE_ENV = 'test';
process.env.ENVIRONMENT = 'test';
process.env.LOG_LEVEL = 'error'; // Reduce log noise during tests

// Increase timeout for integration tests
jest.setTimeout(30000);

