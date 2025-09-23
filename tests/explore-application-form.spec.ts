import { test, expect } from '@playwright/test';

test('Explore Application Form Structure', async ({ page }) => {
  const baseURL = 'https://halalextra-production.up.railway.app';

  await page.goto(`${baseURL}/apply`, { timeout: 30000 });

  // Wait for page to load
  await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 20000 });

  // Take screenshot of the page
  await page.screenshot({ path: 'test-results/application-page-structure.png', fullPage: true });

  // Get all input fields
  const inputs = await page.locator('input').all();
  console.log(`Found ${inputs.length} input fields:`);

  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    const name = await input.getAttribute('name') || 'no-name';
    const placeholder = await input.getAttribute('placeholder') || 'no-placeholder';
    const type = await input.getAttribute('type') || 'text';
    const id = await input.getAttribute('id') || 'no-id';

    console.log(`Input ${i}: name="${name}", placeholder="${placeholder}", type="${type}", id="${id}"`);
  }

  // Get all textareas
  const textareas = await page.locator('textarea').all();
  console.log(`Found ${textareas.length} textarea fields:`);

  for (let i = 0; i < textareas.length; i++) {
    const textarea = textareas[i];
    const name = await textarea.getAttribute('name') || 'no-name';
    const placeholder = await textarea.getAttribute('placeholder') || 'no-placeholder';
    const id = await textarea.getAttribute('id') || 'no-id';

    console.log(`Textarea ${i}: name="${name}", placeholder="${placeholder}", id="${id}"`);
  }

  // Get all select fields
  const selects = await page.locator('select').all();
  console.log(`Found ${selects.length} select fields:`);

  for (let i = 0; i < selects.length; i++) {
    const select = selects[i];
    const name = await select.getAttribute('name') || 'no-name';
    const id = await select.getAttribute('id') || 'no-id';

    console.log(`Select ${i}: name="${name}", id="${id}"`);
  }

  // Get all buttons
  const buttons = await page.locator('button').all();
  console.log(`Found ${buttons.length} buttons:`);

  for (let i = 0; i < buttons.length; i++) {
    const button = buttons[i];
    const text = await button.textContent() || 'no-text';
    const type = await button.getAttribute('type') || 'button';

    console.log(`Button ${i}: text="${text.trim()}", type="${type}"`);
  }

  // Check for any forms
  const forms = await page.locator('form').all();
  console.log(`Found ${forms.length} forms`);

  // Extract page HTML for analysis
  const pageContent = await page.content();
  console.log('Page contains application form elements:', {
    hasStoreInput: pageContent.includes('store'),
    hasNameInput: pageContent.includes('name'),
    hasAddressInput: pageContent.includes('address'),
    hasEmailInput: pageContent.includes('email'),
    hasPhoneInput: pageContent.includes('phone')
  });
});