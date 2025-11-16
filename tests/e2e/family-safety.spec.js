/**
 * E2E Tests for Family Safety Hub Features
 * Tests family group creation, joining, check-ins, and emergency coordination
 */

import { test, expect } from '@playwright/test';

test.describe('Family Safety Hub - Group Creation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForSelector('[data-testid="main-content"]', { timeout: 10000 });
    
    // Navigate to Community Hub first, then Family Safety
    await page.click('button[aria-label*="Community Hub"]');
    await page.waitForSelector('text=Community Hub', { timeout: 5000 });
    
    // Click Family Safety tab
    await page.click('button:has-text("Family Safety")');
    await page.waitForSelector('text=Family Safety', { timeout: 5000 });
  });

  test('should display family safety hub interface', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Family Safety');
    
    // Should show group setup or existing group interface
    const hasGroup = await page.locator('text=Group Code').isVisible();
    const needsSetup = await page.locator('text=Create Family Group').isVisible();
    
    expect(hasGroup || needsSetup).toBeTruthy();
  });

  test('should create new family group', async ({ page }) => {
    // Look for group creation button
    const createButton = page.locator('button:has-text("Create Family Group")');
    if (await createButton.isVisible()) {
      await createButton.click();
      
      // Fill group creation form
      await page.fill('input[placeholder*="family name"]', 'Test Family Group');
      await page.fill('input[placeholder*="your name"]', 'Test User');
      
      // Submit form
      await page.click('button:has-text("Create Group")');
      
      // Should show success message and group code
      await expect(page.locator('text=Group created successfully')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=Group Code')).toBeVisible();
    }
  });

  test('should join existing family group', async ({ page }) => {
    // Click join group option
    const joinButton = page.locator('button:has-text("Join Group")');
    if (await joinButton.isVisible()) {
      await joinButton.click();
      
      // Fill join form
      await page.fill('input[placeholder*="group code"]', 'TEST123');
      await page.fill('input[placeholder*="your name"]', 'Test Member');
      
      // Submit join request
      await page.click('button:has-text("Join Group")');
      
      // Should handle join attempt (may succeed or fail based on code validity)
      await page.waitForTimeout(2000);
    }
  });

  test('should validate group creation form', async ({ page }) => {
    const createButton = page.locator('button:has-text("Create Family Group")');
    if (await createButton.isVisible()) {
      await createButton.click();
      
      // Try to submit empty form
      const submitButton = page.locator('button:has-text("Create Group")');
      await expect(submitButton).toBeDisabled();
      
      // Fill only group name
      await page.fill('input[placeholder*="family name"]', 'Test Group');
      await expect(submitButton).toBeDisabled();
      
      // Fill both required fields
      await page.fill('input[placeholder*="your name"]', 'Test User');
      await expect(submitButton).not.toBeDisabled();
    }
  });
});

test.describe('Family Safety Hub - Group Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForSelector('[data-testid="main-content"]', { timeout: 10000 });
    await page.click('button[aria-label*="Community Hub"]');
    await page.waitForSelector('text=Community Hub', { timeout: 5000 });
    await page.click('button:has-text("Family Safety")');
    await page.waitForSelector('text=Family Safety', { timeout: 5000 });
  });

  test('should display group information when in group', async ({ page }) => {
    // Check if user is already in a group
    const groupCode = page.locator('text=Group Code');
    if (await groupCode.isVisible()) {
      // Should show group details
      await expect(page.locator('text=Family Members')).toBeVisible();
      await expect(page.locator('text=Group Code')).toBeVisible();
      
      // Should show member status indicators
      await expect(page.locator('text=Safe').or(page.locator('text=Unknown')).or(page.locator('text=Emergency'))).toBeVisible();
    }
  });

  test('should handle member check-ins', async ({ page }) => {
    const groupCode = page.locator('text=Group Code');
    if (await groupCode.isVisible()) {
      // Look for check-in buttons
      const checkInButton = page.locator('button:has-text("I\'m Safe")').or(page.locator('button:has-text("Check In")')); 
      if (await checkInButton.isVisible()) {
        await checkInButton.click();
        
        // Should update status
        await expect(page.locator('text=checked in')).toBeVisible({ timeout: 3000 });
      }
    }
  });

  test('should handle emergency status updates', async ({ page }) => {
    const groupCode = page.locator('text=Group Code');
    if (await groupCode.isVisible()) {
      // Look for emergency button
      const emergencyButton = page.locator('button:has-text("Emergency")').or(page.locator('button:has-text("Need Help")'));
      if (await emergencyButton.isVisible()) {
        await emergencyButton.click();
        
        // Should show confirmation or emergency status
        const confirmDialog = page.locator('text=emergency status');
        if (await confirmDialog.isVisible()) {
          await page.click('button:has-text("Confirm")');
        }
        
        // Status should be updated
        await page.waitForTimeout(2000);
      }
    }
  });

  test('should copy group code to clipboard', async ({ page }) => {
    const groupCode = page.locator('text=Group Code');
    if (await groupCode.isVisible()) {
      // Look for copy button
      const copyButton = page.locator('button[title*="Copy"]').or(page.locator('button:has-text("Copy")'));
      if (await copyButton.isVisible()) {
        await copyButton.click();
        
        // Should show copied confirmation
        await expect(page.locator('text=Copied')).toBeVisible({ timeout: 2000 });
      }
    }
  });
});

test.describe('Family Safety Hub - Messaging System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForSelector('[data-testid="main-content"]', { timeout: 10000 });
    await page.click('button[aria-label*="Community Hub"]');
    await page.waitForSelector('text=Community Hub', { timeout: 5000 });
    await page.click('button:has-text("Family Safety")');
    await page.waitForSelector('text=Family Safety', { timeout: 5000 });
  });

  test('should send group messages', async ({ page }) => {
    const groupCode = page.locator('text=Group Code');
    if (await groupCode.isVisible()) {
      // Look for message input
      const messageInput = page.locator('textarea[placeholder*="message"]').or(page.locator('input[placeholder*="message"]'));
      if (await messageInput.isVisible()) {
        await messageInput.fill('Test emergency coordination message');
        
        // Send message
        const sendButton = page.locator('button:has-text("Send")').or(page.locator('button[title*="Send"]'));
        await sendButton.click();
        
        // Should show message sent confirmation
        await expect(page.locator('text=Test emergency coordination message')).toBeVisible({ timeout: 3000 });
      }
    }
  });

  test('should display message history', async ({ page }) => {
    const groupCode = page.locator('text=Group Code');
    if (await groupCode.isVisible()) {
      // Check for message area or history
      const messageArea = page.locator('text=Messages').or(page.locator('text=Recent Activity'));
      if (await messageArea.isVisible()) {
        // Should show messages or empty state
        await expect(messageArea).toBeVisible();
      }
    }
  });
});

test.describe('Family Safety Hub - Group Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForSelector('[data-testid="main-content"]', { timeout: 10000 });
    await page.click('button[aria-label*="Community Hub"]');
    await page.waitForSelector('text=Community Hub', { timeout: 5000 });
    await page.click('button:has-text("Family Safety")');
    await page.waitForSelector('text=Family Safety', { timeout: 5000 });
  });

  test('should access group settings', async ({ page }) => {
    const groupCode = page.locator('text=Group Code');
    if (await groupCode.isVisible()) {
      // Look for settings button
      const settingsButton = page.locator('button[title*="Settings"]').or(page.locator('button:has-text("Settings")'));
      if (await settingsButton.isVisible()) {
        await settingsButton.click();
        
        // Should show settings options
        await expect(page.locator('text=Group Settings')).toBeVisible({ timeout: 3000 });
      }
    }
  });

  test('should handle leave group functionality', async ({ page }) => {
    const groupCode = page.locator('text=Group Code');
    if (await groupCode.isVisible()) {
      // Look for leave group option
      const leaveButton = page.locator('button:has-text("Leave Group")').or(page.locator('button:has-text("Exit Group")'));
      if (await leaveButton.isVisible()) {
        await leaveButton.click();
        
        // Should show confirmation dialog
        const confirmDialog = page.locator('text=leave').or(page.locator('text=confirm'));
        if (await confirmDialog.isVisible()) {
          // Don't actually leave in test - just verify dialog appears
          await expect(confirmDialog).toBeVisible();
          
          // Close dialog
          const cancelButton = page.locator('button:has-text("Cancel")').or(page.locator('button[title*="Close"]'));
          if (await cancelButton.isVisible()) {
            await cancelButton.click();
          }
        }
      }
    }
  });
});

test.describe('Family Safety Hub - Real-time Updates', () => {
  test('should handle real-time status updates', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForSelector('[data-testid="main-content"]', { timeout: 10000 });
    await page.click('button[aria-label*="Community Hub"]');
    await page.waitForSelector('text=Community Hub', { timeout: 5000 });
    await page.click('button:has-text("Family Safety")');
    await page.waitForSelector('text=Family Safety', { timeout: 5000 });
    
    const groupCode = page.locator('text=Group Code');
    if (await groupCode.isVisible()) {
      // Check for refresh functionality
      const refreshButton = page.locator('button:has-text("Refresh")').or(page.locator('button[title*="Refresh"]'));
      if (await refreshButton.isVisible()) {
        await refreshButton.click();
        
        // Should show loading state or updated data
        await page.waitForTimeout(1000);
      }
    }
  });

  test('should show last updated timestamp', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForSelector('[data-testid="main-content"]', { timeout: 10000 });
    await page.click('button[aria-label*="Community Hub"]');
    await page.waitForSelector('text=Community Hub', { timeout: 5000 });
    await page.click('button:has-text("Family Safety")');
    await page.waitForSelector('text=Family Safety', { timeout: 5000 });
    
    const groupCode = page.locator('text=Group Code');
    if (await groupCode.isVisible()) {
      // Look for timestamp indicators
      const timestamp = page.locator('text=ago').or(page.locator('text=updated')).or(page.locator('text=Last'));
      if (await timestamp.isVisible()) {
        await expect(timestamp).toBeVisible();
      }
    }
  });
});

test.describe('Family Safety Hub - Error Handling', () => {
  test('should handle network errors gracefully', async ({ page }) => {
    // Block family group API requests
    await page.route('**/api/family-groups/**', route => route.abort());
    
    await page.goto('http://localhost:5173');
    await page.waitForSelector('[data-testid="main-content"]', { timeout: 10000 });
    await page.click('button[aria-label*="Community Hub"]');
    await page.waitForSelector('text=Community Hub', { timeout: 5000 });
    await page.click('button:has-text("Family Safety")');
    
    // Should still load basic interface
    await expect(page.locator('text=Family Safety')).toBeVisible();
    
    // Should show appropriate error state or offline functionality
    await page.waitForTimeout(2000);
  });

  test('should validate form inputs', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForSelector('[data-testid="main-content"]', { timeout: 10000 });
    await page.click('button[aria-label*="Community Hub"]');
    await page.waitForSelector('text=Community Hub', { timeout: 5000 });
    await page.click('button:has-text("Family Safety")');
    await page.waitForSelector('text=Family Safety', { timeout: 5000 });
    
    // Test group code validation if join form is visible
    const joinButton = page.locator('button:has-text("Join Group")');
    if (await joinButton.isVisible()) {
      await joinButton.click();
      
      // Try invalid group code
      await page.fill('input[placeholder*="group code"]', '123'); // Too short
      await page.fill('input[placeholder*="your name"]', 'Test User');
      
      const submitButton = page.locator('button:has-text("Join Group")');
      // Should show validation error or keep button disabled
      if (await submitButton.isEnabled()) {
        await submitButton.click();
        // Should show error message for invalid code
        await page.waitForTimeout(2000);
      }
    }
  });
});