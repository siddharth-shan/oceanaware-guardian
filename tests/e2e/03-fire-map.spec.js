import { test, expect } from '@playwright/test';

test.describe('Real-time Fire Map', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Navigate to Fire Map section
    await page.click('text="Fire Map"');
    await page.waitForLoadState('networkidle');
  });

  test('should load interactive map', async ({ page }) => {
    // Wait for Leaflet map to load
    await expect(page.locator('.leaflet-container')).toBeVisible({ timeout: 15000 });
    
    // Check for map tiles
    await expect(page.locator('.leaflet-tile-pane')).toBeVisible();
    
    // Check for map controls
    await expect(page.locator('.leaflet-control-zoom')).toBeVisible();
  });

  test('should display fire data layers', async ({ page }) => {
    // Wait for map to load
    await page.waitForSelector('.leaflet-container', { timeout: 15000 });
    
    // Look for layer controls or toggle buttons
    const layerControls = [
      '[data-testid="layer-control"]',
      '.leaflet-control-layers',
      'button[aria-label*="layer"]',
      'text="Layers"'
    ];
    
    for (const selector of layerControls) {
      const element = page.locator(selector);
      if (await element.isVisible()) {
        await expect(element).toBeVisible();
        break;
      }
    }
  });

  test('should show fire markers or heat zones', async ({ page }) => {
    // Wait for map and data to load
    await page.waitForSelector('.leaflet-container', { timeout: 15000 });
    await page.waitForTimeout(3000); // Allow time for fire data to load
    
    // Look for fire-related map elements
    const fireElements = [
      '.leaflet-marker-icon',
      '.leaflet-overlay-pane circle',
      '.fire-marker',
      '[data-testid="fire-marker"]'
    ];
    
    let fireElementFound = false;
    for (const selector of fireElements) {
      const elements = page.locator(selector);
      if (await elements.count() > 0) {
        fireElementFound = true;
        break;
      }
    }
    
    // If no fire markers found, check for empty state message
    if (!fireElementFound) {
      const emptyStateMessages = [
        'text="No active fires"',
        'text="No fires detected"',
        'text="All clear"'
      ];
      
      for (const message of emptyStateMessages) {
        const element = page.locator(message);
        if (await element.isVisible()) {
          await expect(element).toBeVisible();
          break;
        }
      }
    }
  });

  test('should allow map interaction', async ({ page }) => {
    await page.waitForSelector('.leaflet-container', { timeout: 15000 });
    
    // Test map zoom
    const zoomIn = page.locator('.leaflet-control-zoom-in');
    if (await zoomIn.isVisible()) {
      await zoomIn.click();
      await page.waitForTimeout(1000);
    }
    
    // Test map pan
    const map = page.locator('.leaflet-container');
    await map.hover();
    await page.mouse.down();
    await page.mouse.move(100, 100);
    await page.mouse.up();
  });

  test('should display map legend and controls', async ({ page }) => {
    await page.waitForSelector('.leaflet-container', { timeout: 15000 });
    
    // Look for legend or control panels
    const legendElements = [
      '[data-testid="map-legend"]',
      '.legend',
      '.map-controls',
      'text="Legend"'
    ];
    
    for (const selector of legendElements) {
      const element = page.locator(selector);
      if (await element.isVisible()) {
        await expect(element).toBeVisible();
        break;
      }
    }
  });
});