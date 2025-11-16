import { test, expect } from '@playwright/test';

test('Group Name input maintains focus while typing', async ({ page }) => {
  // Navigate to the app
  await page.goto('http://localhost:5173');
  
  // Wait for the app to load
  await page.waitForLoadState('networkidle');
  
  try {
    // Look for Family Safety section or button to create group
    const familyButton = await page.locator('text=Family Safety').first();
    if (await familyButton.isVisible()) {
      await familyButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Look for Create New Group button
    const createGroupButton = await page.locator('text=Create New Group').first();
    if (await createGroupButton.isVisible()) {
      await createGroupButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Find the Group Name input field
    const groupNameInput = await page.locator('input[placeholder*="Smith Family"], input[placeholder*="Emergency Group"]').first();
    
    if (await groupNameInput.isVisible()) {
      console.log('✅ Found Group Name input field');
      
      // Focus on the input
      await groupNameInput.focus();
      
      // Type text character by character to test focus retention
      const testText = 'Test Family';
      for (let i = 0; i < testText.length; i++) {
        const char = testText[i];
        await groupNameInput.type(char);
        
        // Check if input still has focus after typing
        const isFocused = await groupNameInput.evaluate(el => document.activeElement === el);
        
        if (!isFocused) {
          console.log(`❌ Input lost focus after typing character "${char}" at position ${i}`);
          throw new Error(`Input lost focus after typing character "${char}"`);
        }
        
        // Small delay to simulate real typing
        await page.waitForTimeout(100);
      }
      
      // Verify the final value
      const finalValue = await groupNameInput.inputValue();
      expect(finalValue).toBe(testText);
      
      console.log('✅ Group Name input maintains focus throughout typing');
      console.log(`✅ Final value: "${finalValue}"`);
      
    } else {
      console.log('❌ Group Name input field not found - taking screenshot for debugging');
      await page.screenshot({ path: 'debug-no-input.png', fullPage: true });
      
      // List all input fields for debugging
      const allInputs = await page.locator('input').all();
      console.log(`Found ${allInputs.length} input fields:`);
      for (let i = 0; i < allInputs.length; i++) {
        const placeholder = await allInputs[i].getAttribute('placeholder');
        const type = await allInputs[i].getAttribute('type');
        console.log(`  Input ${i}: type="${type}", placeholder="${placeholder}"`);
      }
      
      throw new Error('Group Name input field not found');
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'debug-focus-test.png', fullPage: true });
    
    // Log page content for debugging
    const pageContent = await page.content();
    console.log('Page title:', await page.title());
    console.log('Page URL:', page.url());
    
    throw error;
  }
});

test('Page loads without console errors', async ({ page }) => {
  const consoleErrors = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  
  page.on('pageerror', error => {
    consoleErrors.push(`Page Error: ${error.message}`);
  });
  
  await page.goto('http://localhost:5173');
  await page.waitForLoadState('networkidle');
  
  // Wait a bit for any async errors
  await page.waitForTimeout(2000);
  
  if (consoleErrors.length > 0) {
    console.log('❌ Console errors found:');
    consoleErrors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });
    throw new Error(`Page has ${consoleErrors.length} console errors`);
  }
  
  console.log('✅ Page loads without console errors');
});