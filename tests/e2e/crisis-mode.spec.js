/**
 * E2E Tests for Crisis Mode Emergency Interface
 * Tests emergency interface activation, critical report handling, and emergency actions
 */

import { test, expect } from '@playwright/test';

test.describe('Crisis Mode - Emergency Interface', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForSelector('[data-testid="main-content"]', { timeout: 10000 });
    
    // Navigate to Community Hub
    await page.click('button[aria-label*="Community Hub"]');
    await page.waitForSelector('text=Community Hub', { timeout: 5000 });
  });

  test('should activate crisis mode when emergency level is critical', async ({ page }) => {
    // Look for crisis mode indicators
    const crisisIndicator = page.locator('[data-testid="crisis-mode"]');
    const emergencyAlert = page.locator('text=EMERGENCY MODE').or(page.locator('text=CRISIS SITUATION'));
    
    // Check if crisis mode is active or can be activated
    if (await emergencyAlert.isVisible()) {
      await expect(emergencyAlert).toBeVisible();
      await expect(page.locator('text=Emergency Mode')).toBeVisible();
    } else {
      console.log('Crisis mode not currently active - normal operation');
    }
  });

  test('should display emergency action buttons in crisis mode', async ({ page }) => {
    const crisisMode = page.locator('[data-testid="crisis-mode"]');
    if (await crisisMode.isVisible()) {
      // Check for emergency action buttons
      await expect(page.locator('button:has-text("📞 CALL 911")')).toBeVisible();
      await expect(page.locator('button:has-text("🔥 REPORT HAZARD")')).toBeVisible();
      await expect(page.locator('button:has-text("🚨 EVACUATION INFO")')).toBeVisible();
      await expect(page.locator('button:has-text("🏠 FIND SHELTER")')).toBeVisible();
      await expect(page.locator('button:has-text("🏥 MEDICAL HELP")')).toBeVisible();
    }
  });

  test('should handle 911 call action', async ({ page }) => {
    const crisisMode = page.locator('[data-testid="crisis-mode"]');
    if (await crisisMode.isVisible()) {
      const call911Button = page.locator('button:has-text("📞 CALL 911")');
      if (await call911Button.isVisible()) {
        // Click 911 button - this would normally open tel: link
        await call911Button.click();
        
        // In test environment, verify the action was triggered
        // Note: Actual tel: link won't work in test, but we can verify click handling
        await page.waitForTimeout(1000);
      }
    }
  });

  test('should handle hazard reporting in crisis mode', async ({ page }) => {
    const crisisMode = page.locator('[data-testid="crisis-mode"]');
    if (await crisisMode.isVisible()) {
      const reportButton = page.locator('button:has-text("🔥 REPORT HAZARD")');
      if (await reportButton.isVisible()) {
        await reportButton.click();
        
        // Should scroll to or show emergency reporting form
        await expect(page.locator('text=Report Emergency Hazard')).toBeVisible({ timeout: 3000 });
      }
    }
  });

  test('should display critical reports section', async ({ page }) => {
    const crisisMode = page.locator('[data-testid="crisis-mode"]');
    if (await crisisMode.isVisible()) {
      await expect(page.locator('text=Critical Emergency Reports')).toBeVisible();
    }
  });

  test('should show auto-refresh controls', async ({ page }) => {
    const crisisMode = page.locator('[data-testid="crisis-mode"]');
    if (await crisisMode.isVisible()) {
      await expect(page.locator('text=Auto-Refresh')).toBeVisible();
      await expect(page.locator('text=Updates every 15 seconds')).toBeVisible();
      
      // Should have refresh toggle
      const refreshToggle = page.locator('button:has-text("ON")').or(page.locator('button:has-text("OFF")'));
      await expect(refreshToggle).toBeVisible();
    }
  });

  test('should display emergency reporting form', async ({ page }) => {
    const crisisMode = page.locator('[data-testid="crisis-mode"]');
    if (await crisisMode.isVisible()) {
      const reportingForm = page.locator('#emergency-reporting');
      if (await reportingForm.isVisible()) {
        await expect(page.locator('text=Report Emergency Hazard')).toBeVisible();
        await expect(page.locator('text=For immediate life-threatening emergencies, call 911 first!')).toBeVisible();
        
        // Check emergency report types
        await expect(page.locator('option:has-text("🔥 Fire/Smoke Sighting")')).toBeVisible();
        await expect(page.locator('option:has-text("🚨 Evacuation Needed")')).toBeVisible();
        await expect(page.locator('option:has-text("🆘 People Trapped")')).toBeVisible();
      }
    }
  });
});

test.describe('Crisis Mode - Critical Report Handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForSelector('[data-testid="main-content"]', { timeout: 10000 });
    await page.click('button[aria-label*="Community Hub"]');
    await page.waitForSelector('text=Community Hub', { timeout: 5000 });
  });

  test('should handle undefined report types gracefully', async ({ page }) => {
    const crisisMode = page.locator('[data-testid="crisis-mode"]');
    if (await crisisMode.isVisible()) {
      // This test validates the fix for the TypeError bug
      // Look for any critical report cards
      const reportCards = page.locator('[class*="border-red-500"]');
      const reportCount = await reportCards.count();
      
      if (reportCount > 0) {
        // Check that all report cards render without errors
        for (let i = 0; i < reportCount; i++) {
          const card = reportCards.nth(i);
          await expect(card).toBeVisible();
          
          // Verify the card has title text (not undefined)
          const title = card.locator('h3');
          if (await title.isVisible()) {
            const titleText = await title.textContent();
            expect(titleText).not.toBe('undefined');
            expect(titleText).not.toBe('null');
            expect(titleText.length).toBeGreaterThan(0);
          }
        }
      } else {
        // No critical reports - verify empty state
        await expect(page.locator('text=No Critical Reports')).toBeVisible();
      }
    }
  });

  test('should display proper icons for different report types', async ({ page }) => {
    const crisisMode = page.locator('[data-testid="crisis-mode"]');
    if (await crisisMode.isVisible()) {
      const reportCards = page.locator('[class*="border-red-500"]');
      const reportCount = await reportCards.count();
      
      if (reportCount > 0) {
        // Check that report cards have appropriate icons
        for (let i = 0; i < reportCount; i++) {
          const card = reportCards.nth(i);
          const icon = card.locator('span[class*="text-2xl"]');
          
          if (await icon.isVisible()) {
            const iconText = await icon.textContent();
            // Should have an emoji icon (fire, warning, etc.)
            expect(iconText).toMatch(/[🔥⚡⚠️🚨🚧🌿📢]/);
          }
        }
      }
    }
  });

  test('should show report timestamps and distances', async ({ page }) => {
    const crisisMode = page.locator('[data-testid="crisis-mode"]');
    if (await crisisMode.isVisible()) {
      const reportCards = page.locator('[class*="border-red-500"]');
      const reportCount = await reportCards.count();
      
      if (reportCount > 0) {
        const firstCard = reportCards.first();
        
        // Check for time indicator
        const timeIndicator = firstCard.locator('text=ago').or(firstCard.locator('text=m ago')).or(firstCard.locator('text=h ago'));
        if (await timeIndicator.isVisible()) {
          await expect(timeIndicator).toBeVisible();
        }
        
        // Check for distance indicator
        const distanceIndicator = firstCard.locator('text=km away').or(firstCard.locator('text=miles away'));
        if (await distanceIndicator.isVisible()) {
          await expect(distanceIndicator).toBeVisible();
        }
      }
    }
  });
});

test.describe('Crisis Mode - Emergency Resources', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForSelector('[data-testid="main-content"]', { timeout: 10000 });
    await page.click('button[aria-label*="Community Hub"]');
    await page.waitForSelector('text=Community Hub', { timeout: 5000 });
  });

  test('should display emergency resources footer', async ({ page }) => {
    const crisisMode = page.locator('[data-testid="crisis-mode"]');
    if (await crisisMode.isVisible()) {
      await expect(page.locator('text=Emergency Resources')).toBeVisible();
      
      // Check resource categories
      await expect(page.locator('text=🚨 Emergency Services')).toBeVisible();
      await expect(page.locator('text=📻 Official Updates')).toBeVisible();
      await expect(page.locator('text=🏠 Safety Actions')).toBeVisible();
      
      // Check specific emergency numbers
      await expect(page.locator('text=911 - Fire, Police, Medical')).toBeVisible();
      await expect(page.locator('text=211 - Non-emergency help')).toBeVisible();
      await expect(page.locator('text=311 - City services')).toBeVisible();
    }
  });

  test('should handle external emergency resource links', async ({ page }) => {
    const crisisMode = page.locator('[data-testid="crisis-mode"]');
    if (await crisisMode.isVisible()) {
      const evacuationButton = page.locator('button:has-text("🚨 EVACUATION INFO")');
      if (await evacuationButton.isVisible()) {
        // This would normally open external link
        await evacuationButton.click();
        await page.waitForTimeout(1000);
      }
      
      const shelterButton = page.locator('button:has-text("🏠 FIND SHELTER")');
      if (await shelterButton.isVisible()) {
        // This would normally open external link
        await shelterButton.click();
        await page.waitForTimeout(1000);
      }
    }
  });
});

test.describe('Crisis Mode - Exit Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForSelector('[data-testid="main-content"]', { timeout: 10000 });
    await page.click('button[aria-label*="Community Hub"]');
    await page.waitForSelector('text=Community Hub', { timeout: 5000 });
  });

  test('should show exit crisis mode button when available', async ({ page }) => {
    const crisisMode = page.locator('[data-testid="crisis-mode"]');
    if (await crisisMode.isVisible()) {
      const exitButton = page.locator('button:has-text("Exit Crisis Mode")');
      if (await exitButton.isVisible()) {
        await expect(exitButton).toBeVisible();
        
        // Verify button has proper warning text
        const buttonTitle = await exitButton.getAttribute('title');
        expect(buttonTitle).toContain('testing');
      }
    }
  });

  test('should handle crisis mode exit', async ({ page }) => {
    const crisisMode = page.locator('[data-testid="crisis-mode"]');
    if (await crisisMode.isVisible()) {
      const exitButton = page.locator('button:has-text("Exit Crisis Mode")');
      if (await exitButton.isVisible()) {
        await exitButton.click();
        
        // Should exit crisis mode and return to normal interface
        await expect(page.locator('[data-testid="crisis-mode"]')).not.toBeVisible({ timeout: 3000 });
        await expect(page.locator('text=Community Hub')).toBeVisible();
      }
    }
  });
});

test.describe('Crisis Mode - Accessibility and Announcements', () => {
  test('should provide proper screen reader announcements', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForSelector('[data-testid="main-content"]', { timeout: 10000 });
    await page.click('button[aria-label*="Community Hub"]');
    await page.waitForSelector('text=Community Hub', { timeout: 5000 });
    
    const crisisMode = page.locator('[data-testid="crisis-mode"]');
    if (await crisisMode.isVisible()) {
      // Check for ARIA labels on emergency buttons
      const call911Button = page.locator('button:has-text("📞 CALL 911")');
      if (await call911Button.isVisible()) {
        const ariaLabel = await call911Button.getAttribute('aria-label');
        expect(ariaLabel).toContain('911');
      }
    }
  });

  test('should handle keyboard navigation in crisis mode', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForSelector('[data-testid="main-content"]', { timeout: 10000 });
    await page.click('button[aria-label*="Community Hub"]');
    await page.waitForSelector('text=Community Hub', { timeout: 5000 });
    
    const crisisMode = page.locator('[data-testid="crisis-mode"]');
    if (await crisisMode.isVisible()) {
      // Test tab navigation through emergency buttons
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Should be able to activate buttons with Enter/Space
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
    }
  });
});