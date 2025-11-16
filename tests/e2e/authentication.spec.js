/**
 * E2E Tests for Authentication Flow
 * Tests the privacy-first authentication system and family safety setup
 */

import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start each test with a clean slate
    await page.goto('/');
    
    // Wait for app to load
    await page.waitForSelector('[data-testid="app-header"]', { timeout: 10000 });
    
    // Clear any existing auth state
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('should display authentication setup button for family safety', async ({ page }) => {
    // Navigate to Community tab
    await page.click('button:has-text("Community")');
    
    // Navigate to Family Safety sub-tab
    await page.click('button:has-text("Family Safety")');
    
    // Should see authentication required message
    await expect(page.locator('text=Family Safety Features')).toBeVisible();
    await expect(page.locator('text=Enable family coordination and emergency communication')).toBeVisible();
    await expect(page.locator('button:has-text("Set Up Family Safety")')).toBeVisible();
  });

  test('should complete anonymous authentication flow', async ({ page }) => {
    // Navigate to family safety
    await page.click('button:has-text("Community")');
    await page.click('button:has-text("Family Safety")');
    
    // Click authentication setup
    await page.click('button:has-text("Set Up Family Safety")');
    
    // Should see privacy choice step
    await expect(page.locator('text=Choose Your Privacy Mode')).toBeVisible();
    
    // Choose anonymous mode
    await page.click('text=Anonymous Mode');
    
    // Should see authentication method step
    await expect(page.locator('text=Anonymous Access')).toBeVisible();
    await expect(page.locator('text=Enable secure anonymous access for wildfire monitoring')).toBeVisible();
    
    // Enable anonymous access
    await page.click('button:has-text("Enable Anonymous Access")');
    
    // Should see authenticating state
    await expect(page.locator('text=Setting up secure access...')).toBeVisible();
    
    // Wait for authentication to complete (may take a few seconds)
    await page.waitForSelector('text=Family Safety Hub', { timeout: 15000 });
    
    // Should now be on Family Safety Hub but not in a group
    await expect(page.locator('text=Create or Join a Family Group')).toBeVisible();
  });

  test('should complete family mode authentication with age verification', async ({ page }) => {
    // Navigate to family safety and start auth
    await page.click('button:has-text("Community")');
    await page.click('button:has-text("Family Safety")');
    await page.click('button:has-text("Set Up Family Safety")');
    
    // Choose family mode
    await page.click('text=Family Safety Mode');
    
    // Should see age verification step
    await expect(page.locator('text=Age Verification')).toBeVisible();
    
    // Enter age (over 13 to avoid parental consent complexity in test)
    await page.fill('input[type="number"]', '16');
    
    // Continue to setup
    await page.click('button:has-text("Continue to Setup")');
    
    // Should see family safety setup
    await expect(page.locator('text=Family Safety Setup')).toBeVisible();
    
    // Enable family safety
    await page.click('button:has-text("Enable Family Safety")');
    
    // Wait for authentication and profile setup
    await page.waitForSelector('text=Profile Setup', { timeout: 15000 });
    
    // Complete profile setup
    await page.fill('input[placeholder*="nickname"]', 'TestUser');
    await page.click('button:has-text("Complete Setup")');
    
    // Should reach Family Safety Hub
    await page.waitForSelector('text=Create or Join a Family Group', { timeout: 10000 });
  });

  test('should handle under-13 age verification with parental consent', async ({ page }) => {
    // Start family mode authentication
    await page.click('button:has-text("Community")');
    await page.click('button:has-text("Family Safety")');
    await page.click('button:has-text("Set Up Family Safety")');
    await page.click('text=Family Safety Mode');
    
    // Enter age under 13
    await page.fill('input[type="number"]', '11');
    
    // Should see parental consent requirement
    await expect(page.locator('text=Parental Consent Required')).toBeVisible();
    await expect(page.locator('text=Users under 13 need parental permission')).toBeVisible();
    
    // Continue button should be disabled
    await expect(page.locator('button:has-text("Continue to Setup")')).toBeDisabled();
    
    // Check parental consent
    await page.click('input[type="checkbox"]');
    
    // Continue button should now be enabled
    await expect(page.locator('button:has-text("Continue to Setup")')).toBeEnabled();
    
    // Can proceed to next step
    await page.click('button:has-text("Continue to Setup")');
    await expect(page.locator('text=Family Safety Setup')).toBeVisible();
  });

  test('should show privacy details when requested', async ({ page }) => {
    // Start authentication flow
    await page.click('button:has-text("Community")');
    await page.click('button:has-text("Family Safety")');
    await page.click('button:has-text("Set Up Family Safety")');
    
    // Click show privacy details
    await page.click('text=Show detailed privacy information');
    
    // Should see privacy details
    await expect(page.locator('text=Your Privacy Rights')).toBeVisible();
    await expect(page.locator('text=We never collect personal information')).toBeVisible();
    await expect(page.locator('text=COPPA compliant for users under 13')).toBeVisible();
    
    // Should be able to hide details
    await page.click('text=Hide detailed privacy information');
    await expect(page.locator('text=Your Privacy Rights')).not.toBeVisible();
  });

  test('should allow navigation back through authentication steps', async ({ page }) => {
    // Start authentication flow
    await page.click('button:has-text("Community")');
    await page.click('button:has-text("Family Safety")');
    await page.click('button:has-text("Set Up Family Safety")');
    
    // Go to family mode
    await page.click('text=Family Safety Mode');
    
    // Go back to privacy choice
    await page.click('button:has-text("← Back to privacy options")');
    await expect(page.locator('text=Choose Your Privacy Mode')).toBeVisible();
    
    // Try anonymous mode
    await page.click('text=Anonymous Mode');
    
    // Go back from auth method
    await page.click('button:has-text("← Back")');
    await expect(page.locator('text=Choose Your Privacy Mode')).toBeVisible();
  });

  test('should handle authentication errors gracefully', async ({ page }) => {
    // Mock Firebase to fail
    await page.addInitScript(() => {
      window.__MOCK_AUTH_FAILURE__ = true;
    });
    
    // Start authentication
    await page.click('button:has-text("Community")');
    await page.click('button:has-text("Family Safety")');
    await page.click('button:has-text("Set Up Family Safety")');
    await page.click('text=Anonymous Mode');
    
    // Try to authenticate (should fail with mock)
    await page.click('button:has-text("Enable Anonymous Access")');
    
    // Should show error and return to auth method
    await expect(page.locator('[class*="bg-red-50"]')).toBeVisible();
    await expect(page.locator('text=Authentication failed')).toBeVisible();
  });

  test('should close authentication modal when clicking outside', async ({ page }) => {
    // Open authentication modal
    await page.click('button:has-text("Community")');
    await page.click('button:has-text("Family Safety")');
    await page.click('button:has-text("Set Up Family Safety")');
    
    // Modal should be visible
    await expect(page.locator('text=Choose Your Privacy Mode')).toBeVisible();
    
    // Click outside modal (on overlay)
    await page.click('div[class*="fixed inset-0"]');
    
    // Modal should close
    await expect(page.locator('text=Choose Your Privacy Mode')).not.toBeVisible();
  });

  test('should persist authentication state across page reloads', async ({ page }) => {
    // Complete anonymous authentication
    await page.click('button:has-text("Community")');
    await page.click('button:has-text("Family Safety")');
    await page.click('button:has-text("Set Up Family Safety")');
    await page.click('text=Anonymous Mode');
    await page.click('button:has-text("Enable Anonymous Access")');
    
    // Wait for authentication to complete
    await page.waitForSelector('text=Create or Join a Family Group', { timeout: 15000 });
    
    // Reload page
    await page.reload();
    
    // Should still be authenticated
    await page.click('button:has-text("Community")');
    await page.click('button:has-text("Family Safety")');
    
    // Should go directly to Family Safety Hub (not authentication)
    await expect(page.locator('text=Create or Join a Family Group')).toBeVisible();
  });

  test('should show authentication footer information', async ({ page }) => {
    // Open authentication modal
    await page.click('button:has-text("Community")');
    await page.click('button:has-text("Family Safety")');
    await page.click('button:has-text("Set Up Family Safety")');
    
    // Check footer information
    await expect(page.locator('text=Congressional App Challenge 2025')).toBeVisible();
    await expect(page.locator('text=Privacy-First Design')).toBeVisible();
    await expect(page.locator('text=COPPA Compliant')).toBeVisible();
  });
});

test.describe('Authentication Integration', () => {
  test('should enable family features after authentication', async ({ page }) => {
    // Complete authentication
    await page.goto('/');
    await page.click('button:has-text("Community")');
    await page.click('button:has-text("Family Safety")');
    await page.click('button:has-text("Set Up Family Safety")');
    await page.click('text=Anonymous Mode');
    await page.click('button:has-text("Enable Anonymous Access")');
    
    // Wait for Family Safety Hub
    await page.waitForSelector('text=Create or Join a Family Group', { timeout: 15000 });
    
    // Verify family features are available
    await expect(page.locator('button:has-text("Create New Group")')).toBeVisible();
    await expect(page.locator('button:has-text("Join Existing Group")')).toBeVisible();
  });

  test('should maintain authentication across different tabs', async ({ page }) => {
    // Authenticate
    await page.goto('/');
    await page.click('button:has-text("Community")');
    await page.click('button:has-text("Family Safety")');
    await page.click('button:has-text("Set Up Family Safety")');
    await page.click('text=Anonymous Mode');
    await page.click('button:has-text("Enable Anonymous Access")');
    
    // Wait for authentication
    await page.waitForSelector('text=Create or Join a Family Group', { timeout: 15000 });
    
    // Navigate to different tab
    await page.click('button:has-text("Dashboard")');
    
    // Navigate back to family safety
    await page.click('button:has-text("Community")');
    await page.click('button:has-text("Family Safety")');
    
    // Should still be authenticated
    await expect(page.locator('text=Create or Join a Family Group')).toBeVisible();
  });
});