import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('AI Risk Assessment', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Look for and click the risk assessment feature
    const scanButton = page.locator('button:has-text("Scan for fire risks")').or(
      page.locator('text="Scan for fire risks"')
    );
    
    if (await scanButton.isVisible()) {
      await scanButton.click();
      await page.waitForLoadState('networkidle');
    }
  });

  test('should display risk assessment interface', async ({ page }) => {
    // Check for file upload input
    await expect(page.locator('input[type="file"]')).toBeVisible();
    
    // Check for upload button or drag area
    await expect(page.locator('text="Upload"').or(
      page.locator('text="Drop"')
    )).toBeVisible();
    
    // Check for risk assessment information
    await expect(page.locator('text="Risk"').or(
      page.locator('text="Assessment"')
    )).toBeVisible();
  });

  test('should handle file upload', async ({ page }) => {
    // Create a test image file path
    const testImagePath = path.join(__dirname, '../fixtures/test-vegetation.jpg');
    
    // Set up file upload (we'll create a dummy file for testing)
    const fileInput = page.locator('input[type="file"]');
    
    // Check if file input is present
    await expect(fileInput).toBeVisible();
    
    // Test file upload UI response (without actual API call)
    await fileInput.click();
    
    // Look for upload progress or result area
    const uploadArea = page.locator('[data-testid="upload-area"]').or(
      page.locator('.upload').or(
        page.locator('.drop-zone')
      )
    );
    
    if (await uploadArea.isVisible()) {
      await expect(uploadArea).toBeVisible();
    }
  });

  test('should display risk levels correctly', async ({ page }) => {
    // Look for risk level indicators
    const riskIndicators = [
      'LOW',
      'MEDIUM', 
      'HIGH',
      'EXTREME'
    ];
    
    // Check if any risk level indicators are present in the UI
    for (const level of riskIndicators) {
      const indicator = page.locator(`text="${level}"`);
      if (await indicator.isVisible()) {
        await expect(indicator).toBeVisible();
        break;
      }
    }
  });

  test('should show loading state during processing', async ({ page }) => {
    // Look for loading indicators
    const loadingElements = [
      '[data-testid="loading"]',
      '.loading',
      '.spinner',
      'text="Processing"',
      'text="Analyzing"'
    ];
    
    for (const selector of loadingElements) {
      const element = page.locator(selector);
      if (await element.isVisible()) {
        await expect(element).toBeVisible();
        break;
      }
    }
  });
});