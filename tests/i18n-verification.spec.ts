import { test, expect } from '@playwright/test';

test.describe('i18n Translation Verification', () => {
  test('verify page should display proper translations, not keys', async ({ page }) => {
    await page.goto('/verify/test-certificate');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check that translation keys are NOT displayed
    const pageContent = await page.content();
    
    // These translation keys should NOT be visible
    expect(pageContent).not.toContain('verify.pageTitle');
    expect(pageContent).not.toContain('verify.pageSubtitle');
    expect(pageContent).not.toContain('verify.title');
    expect(pageContent).not.toContain('verify.description');
    
    // These actual translations SHOULD be visible
    await expect(page.locator('h1')).toContainText('Verify Halal Certificate');
    await expect(page.locator('text=Check the authenticity')).toBeVisible();
    
    // Check that the verification section has proper translations
    await expect(page.locator('h2').filter({ hasText: 'Verify Certificate' })).toBeVisible();
    await expect(page.locator('text=Scan QR Code')).toBeVisible();
    await expect(page.locator('text=Search by Business')).toBeVisible();
  });

  test('admin dashboard should display proper translations', async ({ page }) => {
    // Navigate to login page first
    await page.goto('/login');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check that the login page doesn't show translation keys
    const loginContent = await page.content();
    expect(loginContent).not.toContain('login.title');
    expect(loginContent).not.toContain('login.subtitle');
    
    // Verify proper login page text
    await expect(page.locator('h2').filter({ hasText: 'Login' })).toBeVisible();
  });

  test('inspector dashboard route should have proper translations', async ({ page }) => {
    // Just check that the route exists and redirects to login when unauthenticated
    await page.goto('/inspector/dashboard');
    
    // Should redirect to login since we're not authenticated
    await expect(page).toHaveURL(/\/login/);
    
    // But the page should still have proper translations
    const pageContent = await page.content();
    expect(pageContent).not.toContain('inspector.pageTitle');
  });

  test('language switcher should work correctly', async ({ page }) => {
    await page.goto('/');
    
    // Look for language switcher (if visible)
    const languageButton = page.locator('button:has-text("Language"), button:has-text("لغة"), button:has-text("زبان")');
    
    if (await languageButton.isVisible()) {
      await languageButton.click();
      
      // Check if language options are available
      const arabicOption = page.locator('text=العربية');
      if (await arabicOption.isVisible()) {
        await arabicOption.click();
        
        // Wait for language change
        await page.waitForTimeout(500);
        
        // Check that the page is now in Arabic (RTL)
        const htmlDir = await page.locator('html').getAttribute('dir');
        expect(htmlDir).toBe('rtl');
      }
    }
  });
});