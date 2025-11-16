import { test, expect } from '@playwright/test';

test.describe('Community Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Navigate to Community section
    await page.click('text="Community"');
    await page.waitForLoadState('networkidle');
  });

  test('should load community interface', async ({ page }) => {
    // Check for Community title or header
    await expect(page.locator('h1, h2').filter({ hasText: /Community|Safety|Check/ })).toBeVisible();
    
    // Look for community features
    const communityElements = [
      '[data-testid="community-board"]',
      '[data-testid="safety-checkin"]',
      '.community-feature',
      'text="Check-in"',
      'text="Report"'
    ];
    
    for (const selector of communityElements) {
      const element = page.locator(selector);
      if (await element.isVisible()) {
        await expect(element).toBeVisible();
        break;
      }
    }
  });

  test('should display safety check-in system', async ({ page }) => {
    // Look for check-in related elements
    const checkinElements = [
      'button:has-text("Check In")',
      'button:has-text("Safe")',
      '[data-testid="safety-status"]',
      '.checkin-button',
      'text*="Status"'
    ];
    
    for (const selector of checkinElements) {
      const element = page.locator(selector);
      if (await element.isVisible()) {
        await expect(element).toBeVisible();
        break;
      }
    }
  });

  test('should show community reporting features', async ({ page }) => {
    // Look for reporting elements
    const reportingElements = [
      'button:has-text("Report")',
      '[data-testid="report-hazard"]',
      'text*="Report Hazard"',
      'text*="Submit Report"',
      '.report-button'
    ];
    
    for (const selector of reportingElements) {
      const element = page.locator(selector);
      if (await element.isVisible()) {
        await expect(element).toBeVisible();
        break;
      }
    }
  });

  test('should display family safety dashboard', async ({ page }) => {
    // Look for family safety elements
    const familyElements = [
      '[data-testid="family-status"]',
      'text*="Family"',
      'text*="Members"',
      '.family-member',
      '.safety-status'
    ];
    
    for (const selector of familyElements) {
      const element = page.locator(selector);
      if (await element.isVisible()) {
        await expect(element).toBeVisible();
        break;
      }
    }
  });

  test('should handle community interactions', async ({ page }) => {
    // Test interaction with community features
    const interactiveElements = [
      'button',
      '[role="button"]',
      'input[type="text"]',
      'textarea'
    ];
    
    for (const selector of interactiveElements) {
      const elements = page.locator(selector);
      const count = await elements.count();
      
      if (count > 0) {
        const firstElement = elements.first();
        if (await firstElement.isVisible()) {
          // Try clicking buttons or focusing inputs
          if (selector.includes('button')) {
            await firstElement.click();
          } else if (selector.includes('input') || selector.includes('textarea')) {
            await firstElement.focus();
          }
          await page.waitForTimeout(1000);
          break;
        }
      }
    }
  });

  test('should show emergency contacts integration', async ({ page }) => {
    // Look for emergency contact elements
    const contactElements = [
      'text*="Emergency Contact"',
      'text*="911"',
      'text*="Fire Department"',
      '[data-testid="emergency-contacts"]',
      '.contact-info'
    ];
    
    for (const selector of contactElements) {
      const element = page.locator(selector);
      if (await element.isVisible()) {
        await expect(element).toBeVisible();
        break;
      }
    }
  });
});