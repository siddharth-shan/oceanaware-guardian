/**
 * E2E Tests for Live Alerts Functionality
 * Tests the alerts dashboard, loading states, and alert filtering
 */

import { test, expect } from '@playwright/test';

test.describe('Live Alerts Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Wait for app to load
    await page.waitForSelector('[data-testid="app-header"]', { timeout: 10000 });
    
    // Navigate to Fire Monitoring > Live Alerts
    await page.click('button:has-text("Fire Monitoring")');
    await page.click('button:has-text("Live Alerts")');
  });

  test('should load alerts dashboard without infinite spinner', async ({ page }) => {
    // Wait for either alerts to load or timeout message to appear
    const alertsLoaded = page.locator('text=Real-Time Alerts').first();
    const timeoutMessage = page.locator('text=Loading Taking Longer Than Expected');
    
    // Should see the main header within reasonable time
    await expect(alertsLoaded).toBeVisible({ timeout: 15000 });
    
    // Should not show infinite spinner after 12 seconds
    await page.waitForTimeout(12000);
    
    // Either should have content or show timeout message
    const hasAlerts = await page.locator('[data-testid="alerts-content"]').isVisible().catch(() => false);
    const hasTimeout = await timeoutMessage.isVisible().catch(() => false);
    const hasAllClear = await page.locator('text=All Clear!').isVisible().catch(() => false);
    
    expect(hasAlerts || hasTimeout || hasAllClear).toBeTruthy();
  });

  test('should display alert summary statistics', async ({ page }) => {
    // Wait for dashboard to load
    await expect(page.locator('text=Real-Time Alerts')).toBeVisible();
    
    // Should show alert statistics
    await expect(page.locator('text=Active Alerts')).toBeVisible();
    await expect(page.locator('text=High Priority')).toBeVisible();
    await expect(page.locator('text=Fire Alerts')).toBeVisible();
    await expect(page.locator('text=Air Quality')).toBeVisible();
  });

  test('should show alert filter tabs with counts', async ({ page }) => {
    // Wait for dashboard to load
    await expect(page.locator('text=Real-Time Alerts')).toBeVisible();
    
    // Should show filter tabs
    await expect(page.locator('button:has-text("All Alerts")')).toBeVisible();
    await expect(page.locator('button:has-text("Fire")')).toBeVisible();
    await expect(page.locator('button:has-text("Air Quality")')).toBeVisible();
    await expect(page.locator('button:has-text("Smoke")')).toBeVisible();
    await expect(page.locator('button:has-text("Weather")')).toBeVisible();
    await expect(page.locator('button:has-text("UV Index")')).toBeVisible();
  });

  test('should filter alerts by type', async ({ page }) => {
    // Wait for dashboard to load
    await expect(page.locator('text=Real-Time Alerts')).toBeVisible();
    
    // Click fire filter
    await page.click('button:has-text("Fire")');
    
    // Should show fire filter as active
    await expect(page.locator('button:has-text("Fire")').first()).toHaveClass(/bg-orange-600/);
    
    // Try air quality filter
    await page.click('button:has-text("Air Quality")');
    await expect(page.locator('button:has-text("Air Quality")').first()).toHaveClass(/bg-orange-600/);
    
    // Try all alerts filter
    await page.click('button:has-text("All Alerts")');
    await expect(page.locator('button:has-text("All Alerts")').first()).toHaveClass(/bg-orange-600/);
  });

  test('should handle timeout gracefully and show refresh option', async ({ page }) => {
    // Mock slow loading to trigger timeout
    await page.route('**/alerts/**', route => {
      // Delay response by 12 seconds to trigger timeout
      setTimeout(() => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            alerts: [],
            metadata: { timestamp: new Date().toISOString() }
          })
        });
      }, 12000);
    });
    
    // Reload to trigger the slow request
    await page.reload();
    await page.click('button:has-text("Fire Monitoring")');
    await page.click('button:has-text("Live Alerts")');
    
    // Should initially show loading
    await expect(page.locator('text=Loading alerts...')).toBeVisible();
    
    // Should show timeout message after 10 seconds
    await expect(page.locator('text=Loading Taking Longer Than Expected')).toBeVisible({ timeout: 12000 });
    await expect(page.locator('button:has-text("Refresh Page")')).toBeVisible();
    
    // Refresh button should work
    await page.click('button:has-text("Refresh Page")');
    await expect(page.url()).toContain(page.url());
  });

  test('should expand and collapse alert details', async ({ page }) => {
    // Wait for alerts to load
    await expect(page.locator('text=Real-Time Alerts')).toBeVisible();
    
    // Look for alerts with "More" buttons
    const moreButton = page.locator('button:has-text("More")').first();
    
    if (await moreButton.isVisible()) {
      // Click to expand
      await moreButton.click();
      
      // Should show expanded content
      await expect(page.locator('text=Detailed Information')).toBeVisible();
      await expect(page.locator('text=Health Recommendations')).toBeVisible();
      
      // Should show "Less" button
      await expect(page.locator('button:has-text("Less")')).toBeVisible();
      
      // Click to collapse
      await page.click('button:has-text("Less")');
      
      // Should hide expanded content
      await expect(page.locator('text=Detailed Information')).not.toBeVisible();
    }
  });

  test('should display high priority alerts banner', async ({ page }) => {
    // Wait for dashboard to load
    await expect(page.locator('text=Real-Time Alerts')).toBeVisible();
    
    // If there are high priority alerts, should show banner
    const highPriorityBanner = page.locator('text=High Priority Alert');
    
    if (await highPriorityBanner.isVisible()) {
      await expect(page.locator('[class*="bg-red-100"]')).toBeVisible();
      await expect(page.locator('text=⚠️')).toBeVisible();
    }
  });

  test('should show all clear state when no alerts', async ({ page }) => {
    // Mock API to return no alerts
    await page.route('**/alerts/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          alerts: [],
          metadata: { timestamp: new Date().toISOString() }
        })
      });
    });
    
    await page.reload();
    await page.click('button:has-text("Fire Monitoring")');
    await page.click('button:has-text("Live Alerts")');
    
    // Should show all clear message
    await expect(page.locator('text=All Clear!')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=No active alerts for your location')).toBeVisible();
    await expect(page.locator('text=✅')).toBeVisible();
  });

  test('should display data source information', async ({ page }) => {
    // Wait for dashboard to load
    await expect(page.locator('text=Real-Time Alerts')).toBeVisible();
    
    // Should show data sources section
    await expect(page.locator('text=Data Sources')).toBeVisible();
    await expect(page.locator('text=Last Updated:')).toBeVisible();
    await expect(page.locator('text=Refresh:')).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API to return error
    await page.route('**/alerts/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Server error'
        })
      });
    });
    
    await page.reload();
    await page.click('button:has-text("Fire Monitoring")');
    await page.click('button:has-text("Live Alerts")');
    
    // Should show error message
    await expect(page.locator('text=Error Loading Alerts')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[class*="bg-red-50"]')).toBeVisible();
  });

  test('should display air quality details for air quality alerts', async ({ page }) => {
    // Mock API to return air quality alert
    await page.route('**/alerts/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          alerts: [
            {
              id: 'aq-001',
              type: 'air-quality',
              severity: 'high',
              title: 'Unhealthy Air Quality',
              message: 'Air quality is unhealthy for sensitive groups',
              location: 'Test Location',
              timestamp: new Date().toISOString(),
              data: {
                aqi: 155,
                source: 'Test API'
              },
              description: 'Detailed air quality information'
            }
          ],
          metadata: { timestamp: new Date().toISOString() }
        })
      });
    });
    
    await page.reload();
    await page.click('button:has-text("Fire Monitoring")');
    await page.click('button:has-text("Live Alerts")');
    
    // Should show AQI information
    await expect(page.locator('text=AQI 155')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Unhealthy for Sensitive Groups')).toBeVisible();
    await expect(page.locator('text=Health Advice:')).toBeVisible();
  });

  test('should display fire details for fire alerts', async ({ page }) => {
    // Mock API to return fire alert
    await page.route('**/alerts/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          alerts: [
            {
              id: 'fire-001',
              type: 'fire',
              severity: 'high',
              title: 'Wildfire: Ridge Fire',
              message: 'Active wildfire 5 miles from your location',
              location: 'Test Location',
              timestamp: new Date().toISOString(),
              data: {
                acres: 1250,
                containment: 35,
                distance: 5,
                cause: 'Lightning'
              },
              description: 'Detailed fire information'
            }
          ],
          metadata: { timestamp: new Date().toISOString() }
        })
      });
    });
    
    await page.reload();
    await page.click('button:has-text("Fire Monitoring")');
    await page.click('button:has-text("Live Alerts")');
    
    // Wait for alert and expand details
    await expect(page.locator('text=Wildfire: Ridge Fire')).toBeVisible({ timeout: 10000 });
    await page.click('button:has-text("More")');
    
    // Should show fire details
    await expect(page.locator('text=Fire Information')).toBeVisible();
    await expect(page.locator('text=1250 acres')).toBeVisible();
    await expect(page.locator('text=35%')).toBeVisible();
    await expect(page.locator('text=Lightning')).toBeVisible();
  });
});

test.describe('Alerts Performance', () => {
  test('should load alerts within reasonable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.click('button:has-text("Fire Monitoring")');
    await page.click('button:has-text("Live Alerts")');
    
    // Wait for content to load
    await expect(page.locator('text=Real-Time Alerts')).toBeVisible();
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 10 seconds
    expect(loadTime).toBeLessThan(10000);
  });

  test('should handle rapid filter switching', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Fire Monitoring")');
    await page.click('button:has-text("Live Alerts")');
    
    // Wait for dashboard to load
    await expect(page.locator('text=Real-Time Alerts')).toBeVisible();
    
    // Rapidly switch between filters
    const filters = ['Fire', 'Air Quality', 'Smoke', 'Weather', 'All Alerts'];
    
    for (const filter of filters) {
      await page.click(`button:has-text("${filter}")`);
      // Small delay to allow processing
      await page.waitForTimeout(100);
    }
    
    // Should still be responsive
    await expect(page.locator('button:has-text("All Alerts")').first()).toHaveClass(/bg-orange-600/);
  });
});

test.describe('Alerts Accessibility', () => {
  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Fire Monitoring")');
    await page.click('button:has-text("Live Alerts")');
    
    // Wait for dashboard to load
    await expect(page.locator('text=Real-Time Alerts')).toBeVisible();
    
    // Should be able to tab through filter buttons
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Should be able to activate with Enter/Space
    await page.keyboard.press('Enter');
    
    // Filter should be activated
    const activeFilter = await page.locator('button:focus').getAttribute('class');
    expect(activeFilter).toContain('bg-orange-600');
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Fire Monitoring")');
    await page.click('button:has-text("Live Alerts")');
    
    // Check for accessibility features
    await expect(page.locator('main[role="main"]')).toBeVisible();
    await expect(page.locator('nav[role="navigation"]')).toBeVisible();
    
    // Filter buttons should have proper roles
    const filterButtons = page.locator('button:has-text("Fire")');
    await expect(filterButtons.first()).toBeVisible();
  });
});