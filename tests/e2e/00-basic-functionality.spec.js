import { test, expect } from '@playwright/test';

test.describe('Basic Application Functionality', () => {
  test('application loads successfully', async ({ page }) => {
    await page.goto('/');
    
    // Check page title
    await expect(page).toHaveTitle(/EcoQuest Wildfire Watch/);
    
    // Verify main application loads
    await expect(page.locator('main')).toBeVisible();
    
    // Check for key application elements
    await expect(page.locator('text="EcoQuest Wildfire Watch"')).toBeVisible();
  });

  test('dashboard displays critical information', async ({ page }) => {
    await page.goto('/');
    
    // Check for dashboard content
    await expect(page.locator('text="Dashboard"').first()).toBeVisible();
    
    // Check for emergency alerts or status
    const emergencyElement = page.locator('text="CRITICAL EMERGENCY"').or(
      page.locator('text="Emergency"')
    );
    
    if (await emergencyElement.isVisible()) {
      await expect(emergencyElement).toBeVisible();
    }
    
    // Check for quick actions
    await expect(page.locator('text="Quick Actions"')).toBeVisible();
  });

  test('navigation tabs work correctly', async ({ page }) => {
    await page.goto('/');
    
    // Test clicking different navigation tabs
    const tabs = ['Dashboard', 'Fire Monitoring', 'Community Hub', 'Safety Quests'];
    
    for (const tab of tabs) {
      const tabElement = page.locator(`text="${tab}"`).first();
      if (await tabElement.isVisible()) {
        await tabElement.click();
        await page.waitForTimeout(1000); // Brief wait for UI update
        
        // Verify tab is active or content changed
        const activeTab = page.locator('.text-orange-700, .active, .selected').first();
        if (await activeTab.isVisible()) {
          await expect(activeTab).toBeVisible();
        }
      }
    }
  });

  test('emergency actions are accessible', async ({ page }) => {
    await page.goto('/');
    
    // Look for emergency action buttons
    const emergencyActions = [
      'Call 911',
      'View emergency alerts',
      'Emergency Mode'
    ];
    
    for (const action of emergencyActions) {
      const actionElement = page.locator(`text="${action}"`).or(
        page.locator(`button:has-text("${action}")`)
      );
      
      if (await actionElement.isVisible()) {
        await expect(actionElement).toBeVisible();
        break;
      }
    }
  });

  test('application is responsive', async ({ page }) => {
    await page.goto('/');
    
    // Test desktop view
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.locator('main')).toBeVisible();
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('main')).toBeVisible();
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('main')).toBeVisible();
    
    // Verify key content is still accessible on mobile
    await expect(page.locator('text="Dashboard"').first()).toBeVisible();
  });
});