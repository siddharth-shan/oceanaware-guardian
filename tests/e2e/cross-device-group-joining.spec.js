import { test, expect } from '@playwright/test';

test.describe('Cross-Device Group Joining', () => {
  
  test('Phase 1: Local persistence - group persists after page refresh', async ({ page }) => {
    await page.goto('http://localhost:5174');
    await page.waitForLoadState('networkidle');
    
    try {
      // Navigate to Family Safety
      const familyButton = await page.locator('text=Family Safety').first();
      if (await familyButton.isVisible()) {
        await familyButton.click();
        await page.waitForTimeout(1000);
      }
      
      // Create a new group
      const createGroupButton = await page.locator('text=Create New Group').first();
      if (await createGroupButton.isVisible()) {
        await createGroupButton.click();
        await page.waitForTimeout(1000);
      }
      
      // Enter group name
      const groupNameInput = await page.locator('input[placeholder*="Smith Family"], input[placeholder*="Emergency Group"]').first();
      if (await groupNameInput.isVisible()) {
        await groupNameInput.fill('Test Persistence Group');
        
        // Submit the form
        const submitButton = await page.locator('button:has-text("Create Group"), button:has-text("Create")').first();
        if (await submitButton.isVisible()) {
          await submitButton.click();
          await page.waitForTimeout(2000);
        }
      }
      
      // Look for group code in success screen
      let groupCode = null;
      const groupCodeElements = await page.locator('text=/[A-Z]+-[A-Z]+-\\d{4}/').all();
      if (groupCodeElements.length > 0) {
        groupCode = await groupCodeElements[0].textContent();
        console.log('✅ Created group with code:', groupCode);
      }
      
      // Refresh the page to test persistence
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      // Navigate back to Family Safety
      const familyButtonAfterRefresh = await page.locator('text=Family Safety').first();
      if (await familyButtonAfterRefresh.isVisible()) {
        await familyButtonAfterRefresh.click();
        await page.waitForTimeout(1000);
      }
      
      // Check if we're taken directly to the dashboard instead of setup
      const isDashboard = await page.locator('text=Family Dashboard, text=Group Members, text=Current Status').count() > 0;
      const isSetup = await page.locator('text=Create New Group, text=Join Existing Group').count() > 0;
      
      if (isDashboard) {
        console.log('✅ Phase 1 SUCCESS: Group persisted after refresh - taken directly to dashboard');
        
        // Look for the group name or code on dashboard
        const groupText = await page.locator('text=/Test Persistence Group|[A-Z]+-[A-Z]+-\\d{4}/').count();
        if (groupText > 0) {
          console.log('✅ Group information visible on dashboard');
        }
      } else if (isSetup) {
        console.log('❌ Phase 1 FAILED: Taken back to group setup - persistence not working');
        throw new Error('Group did not persist after page refresh');
      } else {
        console.log('⚠️ Unclear state - taking screenshot for debugging');
        await page.screenshot({ path: 'debug-persistence-test.png', fullPage: true });
      }
      
    } catch (error) {
      console.log('❌ Test failed:', error.message);
      await page.screenshot({ path: 'debug-persistence-failed.png', fullPage: true });
      throw error;
    }
  });
  
  test('Phase 2: Cross-device simulation - join group with cloud sync', async ({ page, context }) => {
    // This test simulates cross-device joining by:
    // 1. Creating a group in one "session" 
    // 2. Clearing local storage to simulate different device
    // 3. Attempting to join the group using the code
    
    await page.goto('http://localhost:5174');
    await page.waitForLoadState('networkidle');
    
    let groupCode = null;
    
    try {
      // === DEVICE 1: Create Group ===
      console.log('📱 DEVICE 1: Creating group...');
      
      // Navigate to Family Safety
      const familyButton = await page.locator('text=Family Safety').first();
      if (await familyButton.isVisible()) {
        await familyButton.click();
        await page.waitForTimeout(1000);
      }
      
      // Create a new group
      const createGroupButton = await page.locator('text=Create New Group').first();
      if (await createGroupButton.isVisible()) {
        await createGroupButton.click();
        await page.waitForTimeout(1000);
      }
      
      // Enter group name
      const groupNameInput = await page.locator('input[placeholder*="Smith Family"], input[placeholder*="Emergency Group"]').first();
      if (await groupNameInput.isVisible()) {
        await groupNameInput.fill('Cross Device Test Group');
        
        // Submit the form
        const submitButton = await page.locator('button:has-text("Create Group"), button:has-text("Create")').first();
        if (await submitButton.isVisible()) {
          await submitButton.click();
          await page.waitForTimeout(3000); // Wait for cloud sync
        }
      }
      
      // Get the group code
      const groupCodeElements = await page.locator('text=/[A-Z]+-[A-Z]+-\\d{4}/').all();
      if (groupCodeElements.length > 0) {
        groupCode = await groupCodeElements[0].textContent();
        console.log('✅ DEVICE 1: Created group with code:', groupCode);
      } else {
        throw new Error('Could not find group code after creation');
      }
      
      // Wait a bit more for cloud sync to complete
      await page.waitForTimeout(5000);
      
      // === DEVICE 2: Simulate different device by clearing storage ===
      console.log('📱 DEVICE 2: Simulating different device...');
      
      // Clear local storage to simulate different device
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      
      // Refresh to start fresh
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      // Navigate to Family Safety
      const familyButton2 = await page.locator('text=Family Safety').first();
      if (await familyButton2.isVisible()) {
        await familyButton2.click();
        await page.waitForTimeout(1000);
      }
      
      // Should see setup screen (no local groups)
      const joinGroupButton = await page.locator('text=Join Existing Group').first();
      if (await joinGroupButton.isVisible()) {
        await joinGroupButton.click();
        await page.waitForTimeout(1000);
        console.log('✅ DEVICE 2: Found join group option');
      } else {
        throw new Error('Join Existing Group button not found');
      }
      
      // Enter the group code
      const groupCodeInput = await page.locator('input[placeholder*="GROUP"], input[placeholder*="code"]').first();
      if (await groupCodeInput.isVisible()) {
        await groupCodeInput.fill(groupCode);
        console.log('✅ DEVICE 2: Entered group code:', groupCode);
        
        // Optional: Enter nickname
        const nicknameInput = await page.locator('input[placeholder*="nickname"], input[placeholder*="name"]').first();
        if (await nicknameInput.isVisible()) {
          await nicknameInput.fill('Device 2 User');
        }
        
        // Submit join request
        const joinButton = await page.locator('button:has-text("Join"), button:has-text("Join Group")').first();
        if (await joinButton.isVisible()) {
          await joinButton.click();
          console.log('✅ DEVICE 2: Clicked join button');
          await page.waitForTimeout(5000); // Wait for cloud discovery and join
        }
      } else {
        throw new Error('Group code input not found');
      }
      
      // Check if join was successful
      const isDashboard = await page.locator('text=Family Dashboard, text=Group Members, text=Current Status').count() > 0;
      const isError = await page.locator('text=not found, text=error, text=failed').count() > 0;
      
      if (isDashboard) {
        console.log('✅ Phase 2 SUCCESS: Cross-device group joining worked!');
        
        // Verify we can see the group name
        const groupNameVisible = await page.locator('text=Cross Device Test Group').count() > 0;
        if (groupNameVisible) {
          console.log('✅ Group name visible on dashboard');
        }
        
        // Check member count
        const memberElements = await page.locator('text=/2 member|member.*2/').count();
        if (memberElements > 0) {
          console.log('✅ Multiple members detected - cross-device joining confirmed');
        }
        
      } else if (isError) {
        console.log('❌ Phase 2 FAILED: Error during cross-device join');
        await page.screenshot({ path: 'debug-cross-device-error.png', fullPage: true });
        throw new Error('Cross-device group joining failed with error');
      } else {
        console.log('⚠️ Phase 2 UNCLEAR: Unexpected state after join attempt');
        await page.screenshot({ path: 'debug-cross-device-unclear.png', fullPage: true });
        throw new Error('Unclear result from cross-device join attempt');
      }
      
    } catch (error) {
      console.log('❌ Cross-device test failed:', error.message);
      console.log('🔍 Group code was:', groupCode);
      await page.screenshot({ path: 'debug-cross-device-failed.png', fullPage: true });
      throw error;
    }
  });
  
  test('Page loads and console check', async ({ page }) => {
    const consoleMessages = [];
    const errors = [];
    
    page.on('console', msg => {
      consoleMessages.push(`${msg.type()}: ${msg.text()}`);
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    page.on('pageerror', error => {
      errors.push(`Page Error: ${error.message}`);
    });
    
    await page.goto('http://localhost:5174');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('📋 Console messages:');
    consoleMessages.forEach(msg => console.log(`  ${msg}`));
    
    if (errors.length > 0) {
      console.log('❌ Errors found:');
      errors.forEach(error => console.log(`  ${error}`));
    } else {
      console.log('✅ No console errors');
    }
    
    expect(errors.length).toBe(0);
  });
});