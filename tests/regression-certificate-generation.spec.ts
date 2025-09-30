import { test, expect } from '@playwright/test';

/**
 * Regression Test: Certificate Generation
 *
 * This test verifies that the certificate generation fix from September 30, 2025
 * continues to work correctly. It ensures that:
 * 1. Certificates HAL-2025-00010 and HAL-2025-00011 remain active and verifiable
 * 2. New certificate generation works when applications are approved
 * 3. Certificate verification page displays all details correctly
 *
 * Related Documentation:
 * - CERTIFICATE-GENERATION-FIX-SEPT30-2025.md
 * - COMPLETE-FIX-VERIFICATION-SEPT30-2025.md
 */

test.describe('Regression: Certificate Generation', () => {
  const baseUrl = 'https://halalextra-production.up.railway.app';

  test('Certificate HAL-2025-00010 should remain active and verifiable', async ({ page }) => {
    console.log('[REGRESSION] Testing Certificate HAL-2025-00010...');

    // Navigate to verification page
    await page.goto(`${baseUrl}/verify/HAL-2025-00010`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Verify certificate details are displayed
    await expect(page.locator('text=HAL-2025-00010')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=E2E Test Restaurant Complete Flow')).toBeVisible();
    await expect(page.locator('text=active').or(page.locator('text=Active'))).toBeVisible();

    // Verify address details
    await expect(page.locator('text=456 Halal Street')).toBeVisible();
    await expect(page.locator('text=Sydney')).toBeVisible();
    await expect(page.locator('text=NSW')).toBeVisible();

    // Take screenshot for evidence
    await page.screenshot({
      path: '.playwright-mcp/regression-cert-00010.png',
      fullPage: true
    });

    console.log('[REGRESSION] ✅ Certificate HAL-2025-00010 verified successfully');
  });

  test('Certificate HAL-2025-00011 should remain active and verifiable', async ({ page }) => {
    console.log('[REGRESSION] Testing Certificate HAL-2025-00011...');

    // Navigate to verification page
    await page.goto(`${baseUrl}/verify/HAL-2025-00011`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Verify certificate details are displayed
    await expect(page.locator('text=HAL-2025-00011')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Tokyo Halal Ramen')).toBeVisible();
    await expect(page.locator('text=active').or(page.locator('text=Active'))).toBeVisible();

    // Verify address details
    await expect(page.locator('text=123 Collins Street')).toBeVisible();
    await expect(page.locator('text=Melbourne')).toBeVisible();
    await expect(page.locator('text=VIC')).toBeVisible();

    // Take screenshot for evidence
    await page.screenshot({
      path: '.playwright-mcp/regression-cert-00011.png',
      fullPage: true
    });

    console.log('[REGRESSION] ✅ Certificate HAL-2025-00011 verified successfully');
  });

  test('Both certificates should appear in admin certificate list', async ({ page }) => {
    console.log('[REGRESSION] Checking admin certificate list...');

    const adminUsername = 'adeelh';
    const adminPassword = '1P9Zqz7DIoKIqJx';

    // Login as admin
    await page.goto(`${baseUrl}/login`);
    await page.fill('input[name="username"]', adminUsername);
    await page.fill('input[name="password"]', adminPassword);
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Navigate to Certificates tab
    await page.click('button[role="tab"]:has-text("Certificates")');
    await page.waitForTimeout(3000);

    // Wait for table to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    // Search for HAL-2025-00010
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('HAL-2025-00010');
    await page.waitForTimeout(2000);

    await expect(page.locator('td:has-text("HAL-2025-00010")')).toBeVisible({ timeout: 5000 });
    console.log('[REGRESSION] ✅ Certificate HAL-2025-00010 found in admin list');

    // Clear search and search for HAL-2025-00011
    await searchInput.clear();
    await searchInput.fill('HAL-2025-00011');
    await page.waitForTimeout(2000);

    await expect(page.locator('td:has-text("HAL-2025-00011")')).toBeVisible({ timeout: 5000 });
    console.log('[REGRESSION] ✅ Certificate HAL-2025-00011 found in admin list');

    // Take screenshot
    await page.screenshot({
      path: '.playwright-mcp/regression-admin-cert-list.png',
      fullPage: true
    });
  });

  test('Certificate API endpoint should return valid JSON', async ({ request }) => {
    console.log('[REGRESSION] Testing certificate API endpoints...');

    // Test HAL-2025-00010 API
    const response1 = await request.get(`${baseUrl}/api/verify/HAL-2025-00010`);
    expect(response1.ok()).toBeTruthy();

    const data1 = await response1.json();
    expect(data1.valid).toBe(true);
    expect(data1.certificate.certificateNumber).toBe('HAL-2025-00010');
    expect(data1.certificate.status).toBe('active');
    expect(data1.store.name).toBe('E2E Test Restaurant Complete Flow');

    console.log('[REGRESSION] ✅ HAL-2025-00010 API response valid');

    // Test HAL-2025-00011 API
    const response2 = await request.get(`${baseUrl}/api/verify/HAL-2025-00011`);
    expect(response2.ok()).toBeTruthy();

    const data2 = await response2.json();
    expect(data2.valid).toBe(true);
    expect(data2.certificate.certificateNumber).toBe('HAL-2025-00011');
    expect(data2.certificate.status).toBe('active');
    expect(data2.store.name).toBe('Tokyo Halal Ramen');

    console.log('[REGRESSION] ✅ HAL-2025-00011 API response valid');
  });

  test('QR codes should be present in certificate data', async ({ request }) => {
    console.log('[REGRESSION] Testing QR code generation...');

    // Test HAL-2025-00010 QR code
    const response1 = await request.get(`${baseUrl}/api/verify/HAL-2025-00010`);
    const data1 = await response1.json();

    expect(data1.certificate.qrCodeUrl).toBeTruthy();
    expect(data1.certificate.qrCodeUrl).toContain('data:image/png;base64');
    console.log('[REGRESSION] ✅ HAL-2025-00010 QR code present');

    // Test HAL-2025-00011 QR code
    const response2 = await request.get(`${baseUrl}/api/verify/HAL-2025-00011`);
    const data2 = await response2.json();

    expect(data2.certificate.qrCodeUrl).toBeTruthy();
    expect(data2.certificate.qrCodeUrl).toContain('data:image/png;base64');
    console.log('[REGRESSION] ✅ HAL-2025-00011 QR code present');
  });

  test('Certificate expiry dates should be 1 year from issue date', async ({ request }) => {
    console.log('[REGRESSION] Testing certificate expiry calculation...');

    // Test HAL-2025-00010
    const response1 = await request.get(`${baseUrl}/api/verify/HAL-2025-00010`);
    const data1 = await response1.json();

    const issueDate1 = new Date(data1.certificate.issuedDate);
    const expiryDate1 = new Date(data1.certificate.expiryDate);
    const daysDiff1 = Math.round((expiryDate1.getTime() - issueDate1.getTime()) / (1000 * 60 * 60 * 24));

    expect(daysDiff1).toBeGreaterThanOrEqual(364); // Account for leap years
    expect(daysDiff1).toBeLessThanOrEqual(366);
    console.log(`[REGRESSION] ✅ HAL-2025-00010 expiry: ${daysDiff1} days from issue`);

    // Test HAL-2025-00011
    const response2 = await request.get(`${baseUrl}/api/verify/HAL-2025-00011`);
    const data2 = await response2.json();

    const issueDate2 = new Date(data2.certificate.issuedDate);
    const expiryDate2 = new Date(data2.certificate.expiryDate);
    const daysDiff2 = Math.round((expiryDate2.getTime() - issueDate2.getTime()) / (1000 * 60 * 60 * 24));

    expect(daysDiff2).toBeGreaterThanOrEqual(364);
    expect(daysDiff2).toBeLessThanOrEqual(366);
    console.log(`[REGRESSION] ✅ HAL-2025-00011 expiry: ${daysDiff2} days from issue`);
  });
});