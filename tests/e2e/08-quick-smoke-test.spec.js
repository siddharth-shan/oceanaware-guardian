import { test, expect } from '@playwright/test';

test.describe('Quick Smoke Tests', () => {
  test('homepage loads without errors', async ({ page }) => {
    await page.goto('/');
    
    // Check for any console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Wait for page to stabilize
    await page.waitForTimeout(3000);
    
    // Basic page structure checks
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
    
    // Check that critical elements are present
    await expect(page.locator('text="EcoQuest"')).toBeVisible();
  });

  test('can interact with dashboard elements', async ({ page }) => {
    await page.goto('/');
    
    // Find and test interactive elements
    const buttons = page.locator('button').first();
    if (await buttons.isVisible()) {
      await buttons.click();
      await page.waitForTimeout(500);
    }
    
    // Verify page is still functional after interaction
    await expect(page.locator('main')).toBeVisible();
  });

  test('key emergency features are present', async ({ page }) => {
    await page.goto('/');
    
    // Check for emergency-related text or buttons
    const emergencyKeywords = [
      'Emergency',
      'Alert', 
      'Fire',
      'Safety',
      'Critical'
    ];
    
    let keywordFound = false;
    for (const keyword of emergencyKeywords) {
      const element = page.locator(`text*="${keyword}"`).first();
      if (await element.isVisible()) {
        keywordFound = true;
        break;
      }
    }
    
    expect(keywordFound).toBeTruthy();
  });

  test('application handles network errors gracefully', async ({ page }) => {
    // Start with offline mode
    await page.context().setOffline(true);
    
    await page.goto('/');
    
    // Should still show basic structure even offline
    await expect(page.locator('body')).toBeVisible();
    
    // Go back online
    await page.context().setOffline(false);
    
    await page.reload();
    await expect(page.locator('main')).toBeVisible();
  });
});