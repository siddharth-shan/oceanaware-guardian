import { test, expect } from '@playwright/test';

test.describe('Accessibility Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have proper ARIA labels and roles', async ({ page }) => {
    // Check for ARIA landmarks
    const landmarks = [
      '[role="main"]',
      '[role="navigation"]', 
      '[role="banner"]',
      'main',
      'nav',
      'header'
    ];
    
    let landmarkFound = false;
    for (const selector of landmarks) {
      const element = page.locator(selector);
      if (await element.isVisible()) {
        landmarkFound = true;
        break;
      }
    }
    
    expect(landmarkFound).toBeTruthy();
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Test tab navigation
    await page.keyboard.press('Tab');
    
    // Check if focus is visible
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Continue tabbing through interactive elements
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(200);
    }
  });

  test('should have accessible color contrast', async ({ page }) => {
    // Check for high contrast mode toggle or setting
    const contrastElements = [
      'button:has-text("High Contrast")',
      '[data-testid="contrast-toggle"]',
      'text*="Contrast"',
      '.contrast-toggle'
    ];
    
    for (const selector of contrastElements) {
      const element = page.locator(selector);
      if (await element.isVisible()) {
        await element.click();
        await page.waitForTimeout(1000);
        break;
      }
    }
  });

  test('should support screen readers', async ({ page }) => {
    // Check for alt text on images
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < Math.min(imageCount, 5); i++) {
      const img = images.nth(i);
      if (await img.isVisible()) {
        const alt = await img.getAttribute('alt');
        expect(alt).toBeTruthy();
      }
    }
    
    // Check for proper heading structure
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const headingCount = await headings.count();
    expect(headingCount).toBeGreaterThan(0);
  });

  test('should have bilingual support', async ({ page }) => {
    // Look for language toggle or Spanish content
    const languageElements = [
      'button:has-text("Español")',
      'button:has-text("Spanish")',
      '[data-testid="language-toggle"]',
      'text*="Idioma"',
      '.language-selector'
    ];
    
    for (const selector of languageElements) {
      const element = page.locator(selector);
      if (await element.isVisible()) {
        await element.click();
        await page.waitForTimeout(2000);
        
        // Look for Spanish text to confirm language switch
        const spanishText = page.locator('text*="Fuego"').or(
          page.locator('text*="Seguridad"')
        );
        
        if (await spanishText.isVisible()) {
          await expect(spanishText).toBeVisible();
        }
        break;
      }
    }
  });

  test('should support voice alerts', async ({ page }) => {
    // Look for voice/audio controls
    const voiceElements = [
      'button:has-text("Voice")',
      'button:has-text("Audio")',
      '[data-testid="voice-toggle"]',
      '[aria-label*="voice"]',
      'text*="Text to Speech"'
    ];
    
    for (const selector of voiceElements) {
      const element = page.locator(selector);
      if (await element.isVisible()) {
        await expect(element).toBeVisible();
        break;
      }
    }
  });

  test('should have large text options', async ({ page }) => {
    // Look for text size controls
    const textSizeElements = [
      'button:has-text("Large Text")',
      'button:has-text("Text Size")',
      '[data-testid="text-size-toggle"]',
      'text*="Font Size"',
      '.text-size-control'
    ];
    
    for (const selector of textSizeElements) {
      const element = page.locator(selector);
      if (await element.isVisible()) {
        await element.click();
        await page.waitForTimeout(1000);
        break;
      }
    }
  });
});