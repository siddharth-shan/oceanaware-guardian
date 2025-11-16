/**
 * Global Teardown for Playwright Tests
 * Cleans up after E2E testing
 */

async function globalTeardown(config) {
  console.log('🧹 Cleaning up E2E test environment...');
  
  // Add any global cleanup logic here
  // For example: clearing test databases, stopping mock servers, etc.
  
  console.log('✅ E2E test environment cleaned up');
}

export default globalTeardown;