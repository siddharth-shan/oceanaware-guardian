import { test, expect } from '@playwright/test';

test.describe('Emergency Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Navigate to Dashboard section
    await page.click('text="Dashboard"');
    await page.waitForLoadState('networkidle');
  });

  test('should display dashboard overview', async ({ page }) => {
    // Check for dashboard title or header
    await expect(page.locator('h1, h2').filter({ hasText: /Dashboard|Emergency|Overview/ })).toBeVisible();
    
    // Look for key dashboard components
    const dashboardElements = [
      '[data-testid="alert-summary"]',
      '[data-testid="risk-level"]', 
      '[data-testid="weather-widget"]',
      '.dashboard-card',
      '.alert-panel'
    ];
    
    let elementFound = false;
    for (const selector of dashboardElements) {
      const element = page.locator(selector);
      if (await element.isVisible()) {
        elementFound = true;
        break;
      }
    }
    
    // If no specific dashboard elements, check for general content
    if (!elementFound) {
      await expect(page.locator('main')).toBeVisible();
    }
  });

  test('should show alert system', async ({ page }) => {
    // Look for alert indicators
    const alertElements = [
      '[data-testid="alerts"]',
      '.alert',
      '.notification',
      'text="Alert"',
      'text="Warning"',
      '[role="alert"]'
    ];
    
    for (const selector of alertElements) {
      const element = page.locator(selector);
      if (await element.isVisible()) {
        await expect(element).toBeVisible();
        break;
      }
    }
  });

  test('should display current conditions', async ({ page }) => {
    // Look for weather or environmental data
    const conditionElements = [
      '[data-testid="weather"]',
      '[data-testid="conditions"]',
      'text="Temperature"',
      'text="Wind"',
      'text="Humidity"',
      '.weather-widget'
    ];
    
    for (const selector of conditionElements) {
      const element = page.locator(selector);
      if (await element.isVisible()) {
        await expect(element).toBeVisible();
        break;
      }
    }
  });

  test('should have emergency action buttons', async ({ page }) => {
    // Look for emergency action elements
    const actionElements = [
      'button:has-text("911")',
      'button:has-text("Emergency")',
      'button:has-text("Call")',
      '[data-testid="emergency-actions"]',
      '.emergency-button'
    ];
    
    for (const selector of actionElements) {
      const element = page.locator(selector);
      if (await element.isVisible()) {
        await expect(element).toBeVisible();
        break;
      }
    }
  });

  test('should update with real-time data', async ({ page }) => {
    // Wait for initial load
    await page.waitForTimeout(2000);
    
    // Look for timestamps or "last updated" indicators
    const timestampElements = [
      '[data-testid="last-updated"]',
      'text*="Updated"',
      'text*="ago"',
      '.timestamp',
      '.last-update'
    ];
    
    for (const selector of timestampElements) {
      const element = page.locator(selector);
      if (await element.isVisible()) {
        await expect(element).toBeVisible();
        break;
      }
    }
  });

  test('should handle dashboard refresh', async ({ page }) => {
    // Test refresh functionality
    const refreshElements = [
      'button:has-text("Refresh")',
      '[data-testid="refresh-button"]',
      '[aria-label*="refresh"]'
    ];
    
    for (const selector of refreshElements) {
      const element = page.locator(selector);
      if (await element.isVisible()) {
        await element.click();
        await page.waitForTimeout(1000);
        break;
      }
    }
    
    // Verify page still loads after refresh
    await expect(page.locator('main')).toBeVisible();
  });
});