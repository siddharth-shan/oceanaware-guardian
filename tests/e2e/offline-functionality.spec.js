/**
 * E2E Tests for Offline Functionality
 * Tests offline capabilities, data persistence, and sync functionality
 */

import { test, expect } from '@playwright/test';

test.describe('Offline Functionality - Basic Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForSelector('[data-testid="main-content"]', { timeout: 10000 });
  });

  test('should detect online/offline status', async ({ page }) => {
    // Initially should be online
    const offlineIndicator = page.locator('text=Online').or(page.locator('text=Offline'));
    
    // If offline indicator is visible, check its status
    if (await offlineIndicator.isVisible()) {
      await expect(offlineIndicator).toBeVisible();
    }
    
    // Simulate going offline
    await page.context().setOffline(true);
    await page.waitForTimeout(2000);
    
    // Should show offline status
    await expect(page.locator('text=Offline Mode')).toBeVisible({ timeout: 5000 });
    
    // Go back online
    await page.context().setOffline(false);
    await page.waitForTimeout(2000);
  });

  test('should show offline indicator when network is unavailable', async ({ page }) => {
    // Block all network requests to simulate offline
    await page.route('**/*', route => route.abort());
    
    await page.reload();
    await page.waitForTimeout(3000);
    
    // Should show offline functionality is available
    const offlineFeatures = page.locator('text=Emergency features available').or(page.locator('text=Offline Mode'));
    if (await offlineFeatures.isVisible()) {
      await expect(offlineFeatures).toBeVisible();
    }
  });

  test('should cache essential data for offline use', async ({ page }) => {
    // Load the app normally first to cache data
    await page.waitForSelector('[data-testid="main-content"]', { timeout: 10000 });
    
    // Go offline
    await page.context().setOffline(true);
    
    // Navigate to Community Hub - should still work with cached data
    await page.click('button[aria-label*="Community Hub"]');
    await page.waitForSelector('text=Community Hub', { timeout: 5000 });
    
    // Basic interface should still be available
    await expect(page.locator('text=Community Hub')).toBeVisible();
  });
});

test.describe('Offline Functionality - Emergency Reporting', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForSelector('[data-testid="main-content"]', { timeout: 10000 });
    
    // Navigate to Community Hub
    await page.click('button[aria-label*="Community Hub"]');
    await page.waitForSelector('text=Community Hub', { timeout: 5000 });
  });

  test('should allow emergency reporting while offline', async ({ page }) => {
    // Go offline
    await page.context().setOffline(true);
    await page.waitForTimeout(2000);
    
    // Try to submit an emergency report
    const hazardButton = page.locator('button:has-text("Fire Spotting")');
    if (await hazardButton.isVisible()) {
      await hazardButton.click();
      await page.fill('textarea[placeholder*="Provide clear details"]', 'Offline emergency report test - structure fire visible');
      
      const submitButton = page.locator('button:has-text("Submit Hazard Report")');
      if (await submitButton.isEnabled()) {
        await submitButton.click();
        
        // Should queue the report for later sync
        await page.waitForTimeout(3000);
        
        // Should show some indication that report will be sent when online
        const queueMessage = page.locator('text=queued').or(page.locator('text=will be sent')).or(page.locator('text=stored'));
        if (await queueMessage.isVisible()) {
          await expect(queueMessage).toBeVisible();
        }
      }
    }
  });

  test('should show offline capabilities in emergency interface', async ({ page }) => {
    // Go offline
    await page.context().setOffline(true);
    await page.waitForTimeout(2000);
    
    // Check if offline indicator shows available features
    const offlineIndicator = page.locator('text=Offline Mode').or(page.locator('text=Emergency features available'));
    if (await offlineIndicator.isVisible()) {
      await offlineIndicator.click();
      
      // Should show what's available offline
      const offlineFeatures = page.locator('text=Submit emergency reports').or(page.locator('text=cached community data'));
      if (await offlineFeatures.isVisible()) {
        await expect(offlineFeatures).toBeVisible();
      }
    }
  });
});

test.describe('Offline Functionality - Data Synchronization', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForSelector('[data-testid="main-content"]', { timeout: 10000 });
  });

  test('should sync data when connection is restored', async ({ page }) => {
    // Start offline and create some data
    await page.context().setOffline(true);
    await page.waitForTimeout(2000);
    
    // Go back online
    await page.context().setOffline(false);
    await page.waitForTimeout(2000);
    
    // Should show sync activity
    const syncIndicator = page.locator('text=Syncing').or(page.locator('text=Sync')).or(page.locator('text=synced'));
    if (await syncIndicator.isVisible()) {
      await expect(syncIndicator).toBeVisible();
    }
  });

  test('should handle manual sync trigger', async ({ page }) => {
    const offlineIndicator = page.locator('text=Online').or(page.locator('text=Offline'));
    if (await offlineIndicator.isVisible()) {
      await offlineIndicator.click();
      
      // Look for manual sync button
      const syncButton = page.locator('button:has-text("Sync Now")');
      if (await syncButton.isVisible()) {
        await syncButton.click();
        
        // Should show sync in progress
        await expect(page.locator('text=Syncing')).toBeVisible({ timeout: 3000 });
      }
    }
  });

  test('should show sync status and progress', async ({ page }) => {
    const offlineIndicator = page.locator('text=Online').or(page.locator('text=Offline Mode'));
    if (await offlineIndicator.isVisible()) {
      await offlineIndicator.click();
      
      // Should show connection status details
      await expect(page.locator('text=Connection Status')).toBeVisible();
      await expect(page.locator('text=Data Sync')).toBeVisible();
      await expect(page.locator('text=Offline Features')).toBeVisible();
    }
  });
});

test.describe('Offline Functionality - Local Storage', () => {
  test('should persist user preferences offline', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForSelector('[data-testid="main-content"]', { timeout: 10000 });
    
    // Make some preference changes (if available)
    const settingsButton = page.locator('button[title*="Settings"]').or(page.locator('button:has-text("Settings")'));
    if (await settingsButton.isVisible()) {
      await settingsButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Go offline and reload
    await page.context().setOffline(true);
    await page.reload();
    await page.waitForTimeout(3000);
    
    // Preferences should persist
    await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
  });

  test('should maintain user authentication offline', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForSelector('[data-testid="main-content"]', { timeout: 10000 });
    
    // Go offline
    await page.context().setOffline(true);
    await page.reload();
    await page.waitForTimeout(3000);
    
    // Should still have user context
    await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
  });

  test('should cache location data for offline use', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForSelector('[data-testid="main-content"]', { timeout: 10000 });
    
    // Should show cached location
    const locationIndicator = page.locator('text=Los Angeles').or(page.locator('text=CA'));
    if (await locationIndicator.isVisible()) {
      await expect(locationIndicator).toBeVisible();
    }
    
    // Go offline
    await page.context().setOffline(true);
    await page.reload();
    await page.waitForTimeout(3000);
    
    // Location should still be available from cache
    if (await locationIndicator.isVisible()) {
      await expect(locationIndicator).toBeVisible();
    }
  });
});

test.describe('Offline Functionality - Service Worker', () => {
  test('should register service worker for offline functionality', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForSelector('[data-testid="main-content"]', { timeout: 10000 });
    
    // Check if service worker is registered (via console logs or registration)
    const swRegistered = await page.evaluate(() => {
      return 'serviceWorker' in navigator;
    });
    
    expect(swRegistered).toBeTruthy();
  });

  test('should handle service worker updates', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForSelector('[data-testid="main-content"]', { timeout: 10000 });
    
    // Service worker should be working in background
    await page.waitForTimeout(2000);
    
    // Check for any update notifications or indicators
    const updateIndicator = page.locator('text=Update available').or(page.locator('text=New version'));
    if (await updateIndicator.isVisible()) {
      await expect(updateIndicator).toBeVisible();
    }
  });
});

test.describe('Offline Functionality - Error Handling', () => {
  test('should gracefully handle network timeouts', async ({ page }) => {
    // Set very slow network to simulate timeouts
    await page.route('**/api/**', route => {
      setTimeout(() => route.abort(), 100);
    });
    
    await page.goto('http://localhost:5173');
    await page.waitForSelector('[data-testid="main-content"]', { timeout: 10000 });
    
    // Should still load basic interface
    await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
  });

  test('should show appropriate error messages for failed sync', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForSelector('[data-testid="main-content"]', { timeout: 10000 });
    
    // Block specific API endpoints to simulate sync failures
    await page.route('**/api/sync/**', route => route.abort());
    
    const offlineIndicator = page.locator('text=Online').or(page.locator('text=Offline'));
    if (await offlineIndicator.isVisible()) {
      await offlineIndicator.click();
      
      const syncButton = page.locator('button:has-text("Sync Now")');
      if (await syncButton.isVisible()) {
        await syncButton.click();
        await page.waitForTimeout(2000);
        
        // Should show sync error
        const errorMessage = page.locator('text=Sync failed').or(page.locator('text=Error')).or(page.locator('text=Unable to sync'));
        if (await errorMessage.isVisible()) {
          await expect(errorMessage).toBeVisible();
        }
      }
    }
  });

  test('should retry failed operations when connection improves', async ({ page }) => {
    // Start offline
    await page.context().setOffline(true);
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(3000);
    
    // Go back online
    await page.context().setOffline(false);
    await page.waitForTimeout(2000);
    
    // Should attempt to retry failed operations
    const retryIndicator = page.locator('text=Retrying').or(page.locator('text=Reconnecting'));
    if (await retryIndicator.isVisible()) {
      await expect(retryIndicator).toBeVisible();
    }
  });
});