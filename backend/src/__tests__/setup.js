// Jest setup file

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error'; // Reduce noise during tests

// Mock console methods to reduce test noise (optional)
// global.console.log = jest.fn();
// global.console.info = jest.fn();

// Increase timeout for async operations
jest.setTimeout(10000);
