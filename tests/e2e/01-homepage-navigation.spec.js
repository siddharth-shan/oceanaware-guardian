import { test, expect } from '@playwright/test';

test.describe('Homepage Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load homepage with main navigation elements', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check page title
    await expect(page).toHaveTitle(/EcoQuest Wildfire Watch/);
    
    // Verify main navigation elements are present
    await expect(page.locator('nav')).toBeVisible();
    
    // Check for main sections based on actual UI
    const mainSections = [
      'Dashboard',
      'Fire Monitoring', 
      'Community Hub',
      'Safety Quests'
    ];
    
    for (const section of mainSections) {
      const element = page.locator(`text="${section}"`).first();
      await expect(element).toBeVisible({ timeout: 10000 });
    }
  });

  test('should navigate to different sections', async ({ page }) => {
    // Test navigation to Fire Monitoring
    await page.click('text="Fire Monitoring"');
    await page.waitForLoadState('networkidle');
    // Look for map or monitoring interface
    await expect(page.locator('.leaflet-container').or(
      page.locator('[data-testid="fire-monitoring"]')
    )).toBeVisible({ timeout: 15000 });
    
    // Test navigation to Safety Quests
    await page.click('text="Safety Quests"');
    await page.waitForLoadState('networkidle');
    // Look for safety quest elements
    await expect(page.locator('[data-testid="safety-quest"]').or(
      page.locator('text="Quest"')
    )).toBeVisible({ timeout: 10000 });
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Verify content is properly displayed on mobile
    await expect(page.locator('main')).toBeVisible();
    
    // Check that navigation is still accessible (may be collapsed or different layout)
    await expect(page.locator('text="Dashboard"')).toBeVisible();
    
    // Verify key emergency elements are visible on mobile
    await expect(page.locator('text="CRITICAL EMERGENCY"').or(
      page.locator('.emergency').or(
        page.locator('text="Emergency"')
      )
    )).toBeVisible();
  });
});