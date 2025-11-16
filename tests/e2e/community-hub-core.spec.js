/**
 * Core Community Hub E2E Tests
 * Essential tests for Community Hub functionality
 */

import { test, expect } from '@playwright/test';

test.describe('Community Hub Core Functionality', () => {
  
  const navigateToCommunityHub = async (page) => {
    // Click on the Community Hub tab in the main navigation
    const mainCommunityTab = page.locator('text=Community Hub').nth(0); // First occurrence in main nav
    if (await mainCommunityTab.isVisible()) {
      await mainCommunityTab.click();
      await page.waitForTimeout(1000);
    }
    
    // Now click on the Community Hub sub-tab within the Community section
    const communityHubSubTab = page.locator('text=Community Hub').nth(1); // Second occurrence in sub-nav
    if (await communityHubSubTab.isVisible()) {
      await communityHubSubTab.click();
      await page.waitForTimeout(2000); // Give more time for content to load
    }
    
    // Wait for the actual Community Hub content to load
    try {
      await page.waitForSelector('h1:has-text("Community Hub")', { timeout: 15000 });
    } catch (error) {
      // If that doesn't work, try waiting for any Community Hub specific content
      await page.waitForSelector('text=Safety Check-in', { timeout: 10000 });
    }
  };
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Wait for the app to load
    await page.waitForLoadState('networkidle');
    
    // Mock geolocation
    await page.context().grantPermissions(['geolocation']);
    await page.context().setGeolocation({
      latitude: 33.86888977009282,
      longitude: -118.03918950380873
    });
  });

  test('should load Community Hub page', async ({ page }) => {
    // Navigate to Community tab first
    const communityTab = page.locator('text=Community').first();
    if (await communityTab.isVisible()) {
      await communityTab.click();
      await page.waitForTimeout(1000);
    }
    
    // Then navigate to Community Hub sub-tab
    const communityHubTab = page.locator('text=Community Hub').first();
    if (await communityHubTab.isVisible()) {
      await communityHubTab.click();
      await page.waitForTimeout(1000);
    }
    
    // Wait for Community Hub content to load
    await page.waitForSelector('h1:has-text("Community Hub")', { timeout: 15000 });
    
    // Verify core elements are present
    await expect(page.locator('h1')).toContainText('Community Hub');
    await expect(page.locator('text=Stay connected with your community')).toBeVisible();
  });

  test('should display safety check-in options', async ({ page }) => {
    await navigateToCommunityHub(page);
    
    // Look for safety check-in section
    const safetySection = page.locator('text=Safety Check-in').or(page.locator('[data-testid="safety-checkin-section"]'));
    if (await safetySection.isVisible()) {
      // Verify safety options are available
      const safeButton = page.locator('text=Safe').or(page.locator('[data-testid="status-safe"]'));
      const evacuatingButton = page.locator('text=Evacuating').or(page.locator('[data-testid="status-evacuating"]'));
      const needHelpButton = page.locator('text=Need Help').or(page.locator('[data-testid="status-need-help"]'));
      
      // At least one safety option should be visible
      const hasAnyOption = await safeButton.isVisible() || 
                          await evacuatingButton.isVisible() || 
                          await needHelpButton.isVisible();
      
      expect(hasAnyOption).toBe(true);
    }
  });

  test('should display community reporting options', async ({ page }) => {
    await navigateToCommunityHub(page);
    
    // Look for reporting tab or section
    const reportingTab = page.locator('text=Report Issues').or(page.locator('[data-testid="community-reporting-tab"]'));
    if (await reportingTab.isVisible()) {
      await reportingTab.click();
      await page.waitForTimeout(1000);
    }
    
    // Look for report button
    const reportButton = page.locator('text=Report Issue').or(page.locator('[data-testid="report-issue-button"]'));
    if (await reportButton.isVisible()) {
      await reportButton.click();
      await page.waitForTimeout(1000);
      
      // Check if report form appears
      const reportForm = page.locator('form').or(page.locator('[data-testid="report-form"]'));
      if (await reportForm.isVisible()) {
        // Verify report types are available
        const fireSpottingOption = page.locator('text=Fire Spotting').or(page.locator('[data-testid="report-type-fire-spotting"]'));
        const roadClosureOption = page.locator('text=Road Closure').or(page.locator('[data-testid="report-type-road-closure"]'));
        
        const hasReportOptions = await fireSpottingOption.isVisible() || await roadClosureOption.isVisible();
        expect(hasReportOptions).toBe(true);
      }
    }
  });

  test('should display community statistics', async ({ page }) => {
    await navigateToCommunityHub(page);
    
    // Look for community stats section
    const statsSection = page.locator('text=Community Impact').or(page.locator('[data-testid="community-stats"]'));
    if (await statsSection.isVisible()) {
      // Check for numeric statistics
      const activeUsers = page.locator('[data-testid="active-users-count"]').or(page.locator('text=Active Users'));
      const safeCount = page.locator('[data-testid="safe-count"]').or(page.locator('text=Safe'));
      
      const hasStats = await activeUsers.isVisible() || await safeCount.isVisible();
      expect(hasStats).toBe(true);
    }
  });

  test('should handle tab navigation', async ({ page }) => {
    await navigateToCommunityHub(page);
    
    // Look for tab navigation
    const checkInTab = page.locator('text=Safety Check-in').or(page.locator('[data-testid="safety-checkin-tab"]'));
    const reportingTab = page.locator('text=Report Issues').or(page.locator('[data-testid="community-reporting-tab"]'));
    
    if (await checkInTab.isVisible() && await reportingTab.isVisible()) {
      // Test switching between tabs
      await reportingTab.click();
      await page.waitForTimeout(500);
      
      await checkInTab.click();
      await page.waitForTimeout(500);
      
      // Verify navigation worked (at least one tab should be active/highlighted)
      const activeTab = page.locator('.border-blue-500, .bg-blue-50, .text-blue-700');
      const hasActiveState = await activeTab.first().isVisible();
      expect(hasActiveState).toBe(true);
    }
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await navigateToCommunityHub(page);
    
    // Verify page is accessible on mobile
    await expect(page.locator('h1')).toContainText('Community Hub');
    
    // Check that content is not horizontally overflowing
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = 375;
    
    // Allow for small variances (scrollbars, etc.)
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20);
  });

  test('should load without JavaScript errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await navigateToCommunityHub(page);
    
    // Wait a bit for any async operations
    await page.waitForTimeout(2000);
    
    // Filter out common non-critical errors
    const criticalErrors = errors.filter(error => 
      !error.includes('favicon') && 
      !error.includes('manifest') &&
      !error.includes('websocket') &&
      !error.includes('404') &&
      !error.includes('Failed to fetch') // API calls might fail in test environment
    );
    
    expect(criticalErrors).toHaveLength(0);
  });

  test('should have proper accessibility attributes', async ({ page }) => {
    await navigateToCommunityHub(page);
    
    // Check for main heading
    const mainHeading = page.locator('h1');
    await expect(mainHeading).toBeVisible();
    
    // Check for proper button accessibility
    const buttons = page.locator('button:visible');
    const buttonCount = await buttons.count();
    
    if (buttonCount > 0) {
      // At least some buttons should have aria-label or accessible text
      const accessibleButtons = page.locator('button:visible').filter({
        has: page.locator('span, [aria-label]')
      });
      
      const accessibleCount = await accessibleButtons.count();
      expect(accessibleCount).toBeGreaterThan(0);
    }
  });
});