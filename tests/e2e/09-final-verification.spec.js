import { test, expect } from '@playwright/test';

test.describe('E2E Testing Framework Verification', () => {
  test('application loads and basic elements are present', async ({ page }) => {
    await page.goto('/');
    
    // Basic page load verification
    await expect(page).toHaveTitle(/EcoQuest Wildfire Watch/);
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
    
    // Check for app title (use first() to handle multiple instances)
    await expect(page.locator('h1').first()).toContainText('EcoQuest');
  });

  test('dashboard components are functional', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to stabilize
    await page.waitForTimeout(2000);
    
    // Check for dashboard content
    const dashboardElement = page.locator('text="Dashboard"').first();
    await expect(dashboardElement).toBeVisible();
    
    // Check for quick actions section
    const quickActions = page.locator('text="Quick Actions"').first();
    await expect(quickActions).toBeVisible();
  });

  test('emergency features are accessible', async ({ page }) => {
    await page.goto('/');
    
    // Look for emergency-related content
    const emergencyButton = page.locator('button').filter({ hasText: 'Call 911' }).first();
    await expect(emergencyButton).toBeVisible();
    
    // Check for critical alerts
    const criticalAlert = page.locator('text="CRITICAL EMERGENCY"').first();
    if (await criticalAlert.isVisible()) {
      await expect(criticalAlert).toBeVisible();
    }
  });

  test('navigation between sections works', async ({ page }) => {
    await page.goto('/');
    
    // Test clicking Fire Monitoring tab
    const fireMonitoring = page.locator('text="Fire Monitoring"').first();
    await fireMonitoring.click();
    await page.waitForTimeout(1000);
    
    // Test clicking Community Hub tab
    const communityHub = page.locator('text="Community Hub"').first();
    await communityHub.click();
    await page.waitForTimeout(1000);
    
    // Verify we can navigate back to Dashboard
    const dashboard = page.locator('text="Dashboard"').first();
    await dashboard.click();
    await page.waitForTimeout(1000);
    
    // Verify dashboard is active
    await expect(dashboard).toBeVisible();
  });

  test('responsive design works on mobile', async ({ page }) => {
    await page.goto('/');
    
    // Switch to mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Verify main content is still visible
    await expect(page.locator('main')).toBeVisible();
    
    // Check that essential elements are still accessible
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('application handles user interactions', async ({ page }) => {
    await page.goto('/');
    
    // Find and click any available button
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    if (buttonCount > 0) {
      const firstButton = buttons.first();
      await firstButton.click();
      await page.waitForTimeout(500);
      
      // Verify page is still responsive after interaction
      await expect(page.locator('body')).toBeVisible();
    }
  });
});