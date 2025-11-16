/**
 * Global Setup for Playwright Tests
 * Prepares the environment for E2E testing
 */

async function globalSetup(config) {
  console.log('🧪 Setting up E2E test environment...');
  
  // Add any global setup logic here
  // For example: database seeding, API mocking setup, etc.
  
  // Ensure test data attributes are added to components
  process.env.NODE_ENV = 'test';
  
  console.log('✅ E2E test environment ready');
}

export default globalSetup;