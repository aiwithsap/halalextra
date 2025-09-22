import { test, expect } from '@playwright/test';

test.describe('Dashboard Routes Test', () => {
  test('should access dashboard routes without 404 errors', async ({ page }) => {
    console.log('🚀 Testing dashboard routes after fixes...');

    // Test admin route (should redirect to login but not 404)
    console.log('1️⃣ Testing /admin route...');
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // Should either load login page or dashboard (but not 404)
    const response = page.url();
    console.log(`Admin route redirected to: ${response}`);
    expect(response).not.toContain('not-found');

    // Test inspector route (should redirect to login but not 404)
    console.log('2️⃣ Testing /inspector route...');
    await page.goto('/inspector');
    await page.waitForLoadState('networkidle');

    const response2 = page.url();
    console.log(`Inspector route redirected to: ${response2}`);
    expect(response2).not.toContain('not-found');

    // Test that login page loads properly
    console.log('3️⃣ Testing login page...');
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Check for login form elements
    const loginButton = page.locator('button:has-text("Login"), button:has-text("Sign in"), button[type="submit"]');
    await expect(loginButton.first()).toBeVisible();

    console.log('✅ All dashboard routes working correctly!');
  });
});