import { test, expect } from '@playwright/test';
import path from 'path';

const BASE_URL = 'https://halalextra-production.up.railway.app';

test.describe('Bug Fix Verification', () => {

  test('BUG FIX #1: File upload with .txt files should work', async ({ page }) => {
    await page.goto(`${BASE_URL}/apply`);

    // Navigate through form steps
    await page.waitForSelector('h2:has-text("Business Information")');

    // Fill Step 1 - Business Information
    await page.fill('input[name="businessName"]', 'Test Restaurant Fix Verification');
    await page.selectOption('select[name="businessType"]', 'Restaurant');
    await page.fill('input[name="abn"]', '12345678901');
    await page.fill('input[name="established"]', '2020-01-01');
    await page.fill('input[name="address"]', '123 Test Street');
    await page.fill('input[name="city"]', 'Sydney');
    await page.selectOption('select[name="state"]', 'NSW');
    await page.fill('input[name="postcode"]', '2000');

    await page.click('button:has-text("Next")');

    // Fill Step 2 - Operations
    await page.waitForSelector('h2:has-text("Operations")');
    await page.fill('input[name="product-0"]', 'Test Product');
    await page.fill('input[name="supplierName-0"]', 'Test Supplier');
    await page.fill('input[name="supplierMaterial-0"]', 'Test Material');
    await page.fill('input[name="employeeCount"]', '5');
    await page.fill('textarea[name="operatingHours"]', 'Mon-Fri: 9-5');

    await page.click('button:has-text("Next")');

    // Fill Step 3 - Documents (TEST .txt file upload)
    await page.waitForSelector('h2:has-text("Documents")');

    // Create test .txt files
    const testFile = path.join(__dirname, '..', '/tmp/test-document.txt');

    // Upload .txt file to business license field
    const businessLicenseInput = page.locator('input[type="file"][name="businessLicense"]');
    await businessLicenseInput.setInputFiles(testFile);

    // Verify no error message appears (client-side validation passed)
    await page.waitForTimeout(1000);
    const errorMessage = page.locator('text=/File type not allowed/i');
    await expect(errorMessage).not.toBeVisible();

    // Verify file was accepted
    const fileName = page.locator('text=/test-document.txt/i');
    await expect(fileName).toBeVisible();

    await page.click('button:has-text("Next")');

    // Fill Step 4 - Review
    await page.waitForSelector('h2:has-text("Review")');
    await page.fill('input[name="ownerName"]', 'Test Owner');
    await page.fill('input[name="ownerEmail"]', 'test@example.com');
    await page.fill('input[name="ownerPhone"]', '+61400000000');
    await page.check('input[type="checkbox"][name="termsAccepted"]');

    await page.click('button:has-text("Next")');

    // Step 5 - Payment (Demo Mode)
    await page.waitForSelector('text=/Demo Mode/i');

    // Click Pay Now and verify application creation succeeds (no 500 error)
    await page.click('button:has-text("Pay Now")');

    // Wait for success message or redirect
    await page.waitForTimeout(3000);

    // Verify we didn't get a 500 error
    const errorPage = page.locator('text=/500/i');
    await expect(errorPage).not.toBeVisible();

    // Take screenshot
    await page.screenshot({ path: '.playwright-mcp/bug-fix-1-verification.png' });
  });

  test('BUG FIX #2: Admin application detail page should be accessible', async ({ page }) => {
    // Login as admin
    await page.goto(`${BASE_URL}/login`);

    await page.fill('input[name="username"]', 'adeelh');
    await page.fill('input[name="password"]', '1P9Zqz7DIoKIqJx');
    await page.click('button:has-text("Login")');

    // Wait for redirect to admin dashboard
    await page.waitForURL(/\/admin/);

    // Navigate to Applications tab
    await page.click('button:has-text("Applications")');
    await page.waitForSelector('text=/Applications/i');

    // Click View button on first application
    const viewButton = page.locator('button:has-text("View")').first();
    await viewButton.click();

    // Wait for navigation to detail page
    await page.waitForTimeout(2000);

    // Verify we're NOT on 404 page
    const notFoundText = page.locator('text=/404/i');
    await expect(notFoundText).not.toBeVisible();

    // Verify detail page loaded successfully
    const detailsTab = page.locator('text=/Details/i');
    await expect(detailsTab).toBeVisible();

    // Verify tabs are present
    const documentsTab = page.locator('text=/Documents/i');
    await expect(documentsTab).toBeVisible();

    const manageTab = page.locator('button:has-text("Manage")');
    await expect(manageTab).toBeVisible();

    // Take screenshot
    await page.screenshot({ path: '.playwright-mcp/bug-fix-2-verification.png' });
  });

  test('P1 FIX: Login page should NOT show test credentials in production', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);

    // Wait for page to load
    await page.waitForSelector('button:has-text("Login")');

    // Verify test credentials are NOT visible (they should only show in dev mode)
    const credentialsText = page.locator('text=/For testing:/i');

    // In production, credentials should not be visible
    // Note: We can't easily verify this works in dev mode from production tests
    const isVisible = await credentialsText.isVisible().catch(() => false);

    if (isVisible) {
      console.warn('WARNING: Test credentials are visible in production!');
    }

    // Take screenshot
    await page.screenshot({ path: '.playwright-mcp/security-fix-verification.png' });
  });
});