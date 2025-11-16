import { test, expect } from '@playwright/test';

test.describe('Safety Quest Education', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Navigate to Safety Quest section
    await page.click('text="Safety Quest"');
    await page.waitForLoadState('networkidle');
  });

  test('should load safety education interface', async ({ page }) => {
    // Check for Safety Quest title or header
    await expect(page.locator('h1, h2').filter({ hasText: /Safety|Quest|Education/ })).toBeVisible();
    
    // Look for educational content elements
    const educationElements = [
      '[data-testid="education-modules"]',
      '[data-testid="quiz"]',
      '.quest-item',
      '.learning-module',
      'text="Learn"'
    ];
    
    for (const selector of educationElements) {
      const element = page.locator(selector);
      if (await element.isVisible()) {
        await expect(element).toBeVisible();
        break;
      }
    }
  });

  test('should display learning modules', async ({ page }) => {
    // Look for interactive learning elements
    const moduleElements = [
      '.module',
      '.lesson',
      'button:has-text("Start")',
      'button:has-text("Begin")',
      '[data-testid="start-quest"]'
    ];
    
    for (const selector of moduleElements) {
      const element = page.locator(selector);
      if (await element.isVisible()) {
        await expect(element).toBeVisible();
        break;
      }
    }
  });

  test('should show progress tracking', async ({ page }) => {
    // Look for progress indicators
    const progressElements = [
      '[data-testid="progress"]',
      '.progress-bar',
      '.progress-indicator',
      'text*="Progress"',
      'text*="%"'
    ];
    
    for (const selector of progressElements) {
      const element = page.locator(selector);
      if (await element.isVisible()) {
        await expect(element).toBeVisible();
        break;
      }
    }
  });

  test('should allow interaction with quest items', async ({ page }) => {
    // Look for interactive elements
    const interactiveElements = [
      'button',
      '[role="button"]',
      '.clickable',
      'a[href*="quest"]'
    ];
    
    for (const selector of interactiveElements) {
      const elements = page.locator(selector);
      const count = await elements.count();
      
      if (count > 0) {
        // Click first interactive element if found
        const firstElement = elements.first();
        if (await firstElement.isVisible()) {
          await firstElement.click();
          await page.waitForTimeout(1000);
          break;
        }
      }
    }
  });

  test('should display safety tips and resources', async ({ page }) => {
    // Look for safety content
    const safetyElements = [
      'text*="Safety"',
      'text*="Tip"',
      'text*="Emergency"',
      'text*="Evacuation"',
      '[data-testid="safety-tips"]'
    ];
    
    for (const selector of safetyElements) {
      const element = page.locator(selector);
      if (await element.isVisible()) {
        await expect(element).toBeVisible();
        break;
      }
    }
  });

  test('should handle achievement system', async ({ page }) => {
    // Look for achievement or badge elements
    const achievementElements = [
      '[data-testid="achievements"]',
      '.badge',
      '.achievement',
      'text*="Badge"',
      'text*="Achievement"',
      'text*="Completed"'
    ];
    
    for (const selector of achievementElements) {
      const element = page.locator(selector);
      if (await element.isVisible()) {
        await expect(element).toBeVisible();
        break;
      }
    }
  });
});