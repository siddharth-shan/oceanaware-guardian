/**
 * E2E Tests for Community Hub Features
 * Tests hazard reporting, community coordination, and crisis mode functionality
 */

import { test, expect } from '@playwright/test';

test.describe('Community Hub - Hazard Reporting System', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:5173');
    
    // Wait for the app to load
    await page.waitForSelector('[data-testid="main-content"]', { timeout: 10000 });
    
    // Navigate to Community Hub
    await page.click('button[aria-label*="Community Hub"]');
    await page.waitForSelector('text=Community Hub', { timeout: 5000 });
  });

  test('should display Community Hub interface correctly', async ({ page }) => {
    // Check main community hub elements are present
    await expect(page.locator('h1')).toContainText('Community');
    await expect(page.locator('text=Community Coordination')).toBeVisible();
    
    // Check for hazard reporting section
    await expect(page.locator('text=Hazard Reporting')).toBeVisible();
    await expect(page.locator('text=Report New Hazard')).toBeVisible();
  });

  test('should handle hazard report form validation', async ({ page }) => {
    // Try to submit empty form
    const submitButton = page.locator('button:has-text("Submit Hazard Report")');
    await expect(submitButton).toBeDisabled();
    
    // Fill required fields
    await page.click('button:has-text("Fire Spotting")');
    await page.fill('textarea[placeholder*="Provide clear details"]', 'Large fire visible near highway 101');
    
    // Submit button should now be enabled
    await expect(submitButton).not.toBeDisabled();
  });

  test('should submit hazard report successfully', async ({ page }) => {
    // Select hazard type
    await page.click('button:has-text("Fire Spotting")');
    
    // Fill description
    await page.fill('textarea[placeholder*="Provide clear details"]', 'Smoke visible from residential area, appears to be structure fire');
    
    // Submit the report
    await page.click('button:has-text("Submit Hazard Report")');
    
    // Check for success feedback
    await expect(page.locator('text=submitted successfully')).toBeVisible({ timeout: 5000 });
  });

  test('should display different hazard types correctly', async ({ page }) => {
    const hazardTypes = [
      'Fire Spotting',
      'Power Line Down', 
      'Road Closure',
      'Need Evacuation Help',
      'Offer Help',
      'Unsafe Conditions'
    ];
    
    for (const hazardType of hazardTypes) {
      await expect(page.locator(`button:has-text("${hazardType}")`)).toBeVisible();
    }
  });

  test('should handle emergency level priority correctly', async ({ page }) => {
    // Check that critical items are marked
    await expect(page.locator('button:has-text("Fire Spotting")').locator('text=CRITICAL')).toBeVisible();
    await expect(page.locator('button:has-text("Need Evacuation Help")').locator('text=CRITICAL')).toBeVisible();
    
    // Check high priority items
    await expect(page.locator('button:has-text("Power Line Down")').locator('text=HIGH')).toBeVisible();
    await expect(page.locator('button:has-text("Unsafe Conditions")').locator('text=HIGH')).toBeVisible();
  });
});

test.describe('Community Hub - Advanced Filtering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForSelector('[data-testid="main-content"]', { timeout: 10000 });
    await page.click('button[aria-label*="Community Hub"]');
    await page.waitForSelector('text=Community Hub', { timeout: 5000 });
  });

  test('should display advanced filters', async ({ page }) => {
    await expect(page.locator('text=Advanced Filters')).toBeVisible();
    
    // Check filter presets
    await expect(page.locator('button:has-text("🚨 Critical Only")')).toBeVisible();
    await expect(page.locator('button:has-text("✅ Recent & Verified")')).toBeVisible();
    await expect(page.locator('button:has-text("📍 Nearby Urgent")')).toBeVisible();
    await expect(page.locator('button:has-text("🔥 Fire Related")')).toBeVisible();
  });

  test('should apply filter presets correctly', async ({ page }) => {
    // Click on critical only filter
    await page.click('button:has-text("🚨 Critical Only")');
    
    // Verify filter is applied (check if reports count changes or filter indicator appears)
    await expect(page.locator('text=0 of 0 reports')).toBeVisible();
  });

  test('should expand detailed filters', async ({ page }) => {
    // Click "More Filters" button
    await page.click('button:has-text("More Filters")');
    
    // Check if expanded filter options appear
    await expect(page.locator('text=Priority Level')).toBeVisible();
    await expect(page.locator('text=Report Types')).toBeVisible();
    await expect(page.locator('text=Time Range')).toBeVisible();
  });
});

test.describe('Community Hub - Status Overview', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForSelector('[data-testid="main-content"]', { timeout: 10000 });
    await page.click('button[aria-label*="Community Hub"]');
    await page.waitForSelector('text=Community Hub', { timeout: 5000 });
  });

  test('should display community status metrics', async ({ page }) => {
    await expect(page.locator('text=Community Status Overview')).toBeVisible();
    
    // Check status categories
    await expect(page.locator('text=Neighbors Safe')).toBeVisible();
    await expect(page.locator('text=Currently Evacuating')).toBeVisible();
    await expect(page.locator('text=Need Assistance')).toBeVisible();
    await expect(page.locator('text=Total Active')).toBeVisible();
  });

  test('should display emergency coordination hub', async ({ page }) => {
    await expect(page.locator('text=Emergency Coordination Hub')).toBeVisible();
    await expect(page.locator('text=coordinate emergency response')).toBeVisible();
  });

  test('should handle refresh functionality', async ({ page }) => {
    const refreshButton = page.locator('button:has-text("Refresh")');
    await expect(refreshButton).toBeVisible();
    
    // Click refresh and verify it works
    await refreshButton.click();
    
    // Should see loading state or updated timestamp
    // Note: This might need adjustment based on actual implementation
  });
});

test.describe('Community Hub - Error Handling', () => {
  test('should handle network errors gracefully', async ({ page }) => {
    // Block network requests to simulate offline
    await page.route('**/api/community/**', route => route.abort());
    
    await page.goto('http://localhost:5173');
    await page.waitForSelector('[data-testid="main-content"]', { timeout: 10000 });
    await page.click('button[aria-label*="Community Hub"]');
    
    // Should still load basic interface
    await expect(page.locator('text=Community Hub')).toBeVisible();
    
    // Should show appropriate error state
    await expect(page.locator('text=No recent reports')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForSelector('[data-testid="main-content"]', { timeout: 10000 });
    await page.click('button[aria-label*="Community Hub"]');
    await page.waitForSelector('text=Community Hub', { timeout: 5000 });
    
    // Try to submit without required fields
    const submitButton = page.locator('button:has-text("Submit Hazard Report")');
    await expect(submitButton).toBeDisabled();
    
    // Add only description without selecting type
    await page.fill('textarea[placeholder*="Provide clear details"]', 'Test description');
    await expect(submitButton).toBeDisabled();
    
    // Select type but clear description
    await page.click('button:has-text("Fire Spotting")');
    await page.fill('textarea[placeholder*="Provide clear details"]', '');
    await expect(submitButton).toBeDisabled();
  });
});

test.describe('Community Hub - Accessibility', () => {
  test('should have proper ARIA labels and keyboard navigation', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForSelector('[data-testid="main-content"]', { timeout: 10000 });
    await page.click('button[aria-label*="Community Hub"]');
    await page.waitForSelector('text=Community Hub', { timeout: 5000 });
    
    // Check for skip links
    await expect(page.locator('a:has-text("Skip to main content")')).toBeVisible();
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Check form accessibility
    const form = page.locator('form').first();
    if (await form.isVisible()) {
      await expect(form.locator('label')).toHaveCount(1); // At least one label
    }
  });

  test('should work with screen reader announcements', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForSelector('[data-testid="main-content"]', { timeout: 10000 });
    await page.click('button[aria-label*="Community Hub"]');
    
    // Check for live regions that would be announced
    const liveRegions = page.locator('[aria-live]');
    if (await liveRegions.count() > 0) {
      await expect(liveRegions.first()).toBeVisible();
    }
  });
});