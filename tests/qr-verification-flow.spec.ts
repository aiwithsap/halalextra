import { test, expect } from '@playwright/test';

test.describe('QR Code Verification Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should access verification page from homepage', async ({ page }) => {
    // Click on "Verify Certificate" or similar link from homepage
    await page.click('text=Verify Certificate');
    await expect(page).toHaveURL('/verify');
    
    // Check verification page elements
    await expect(page.locator('text=Certificate Verification')).toBeVisible();
    await expect(page.locator('text=Enter Certificate Number')).toBeVisible();
    await expect(page.locator('input[name="certificateNumber"]')).toBeVisible();
    await expect(page.locator('button:has-text("Verify")')).toBeVisible();
  });

  test('should verify valid certificate by certificate number', async ({ page }) => {
    await page.goto('/verify');
    
    // Enter a valid certificate number (this would be a test certificate in real scenario)
    await page.fill('input[name="certificateNumber"]', 'HE2025001');
    await page.click('button:has-text("Verify")');
    
    // Should show certificate details
    await expect(page.locator('[data-testid="certificate-details"]')).toBeVisible();
    await expect(page.locator('text=Certificate Status: Valid')).toBeVisible();
    await expect(page.locator('text=Business Name')).toBeVisible();
    await expect(page.locator('text=Certificate Number')).toBeVisible();
    await expect(page.locator('text=Issue Date')).toBeVisible();
    await expect(page.locator('text=Expiry Date')).toBeVisible();
    await expect(page.locator('text=Inspector')).toBeVisible();
    
    // Should show QR code for this certificate
    await expect(page.locator('[data-testid="certificate-qr-code"]')).toBeVisible();
    
    // Should show validation badge/seal
    await expect(page.locator('[data-testid="halal-certification-seal"]')).toBeVisible();
  });

  test('should handle invalid certificate number', async ({ page }) => {
    await page.goto('/verify');
    
    // Enter invalid certificate number
    await page.fill('input[name="certificateNumber"]', 'INVALID123');
    await page.click('button:has-text("Verify")');
    
    // Should show error message
    await expect(page.locator('text=Certificate not found')).toBeVisible();
    await expect(page.locator('text=Please check the certificate number and try again')).toBeVisible();
    
    // Should not show certificate details
    await expect(page.locator('[data-testid="certificate-details"]')).not.toBeVisible();
  });

  test('should handle expired certificate', async ({ page }) => {
    await page.goto('/verify');
    
    // Enter expired certificate number
    await page.fill('input[name="certificateNumber"]', 'HE2023001');
    await page.click('button:has-text("Verify")');
    
    // Should show certificate details but with expired status
    await expect(page.locator('[data-testid="certificate-details"]')).toBeVisible();
    await expect(page.locator('text=Certificate Status: Expired')).toBeVisible();
    await expect(page.locator('text=This certificate has expired')).toBeVisible();
    
    // Should show expired badge/warning
    await expect(page.locator('[data-testid="expired-certificate-warning"]')).toBeVisible();
  });

  test('should handle revoked certificate', async ({ page }) => {
    await page.goto('/verify');
    
    // Enter revoked certificate number
    await page.fill('input[name="certificateNumber"]', 'HE2024999');
    await page.click('button:has-text("Verify")');
    
    // Should show certificate details but with revoked status
    await expect(page.locator('text=Certificate Status: Revoked')).toBeVisible();
    await expect(page.locator('text=This certificate has been revoked')).toBeVisible();
    
    // Should show revocation warning
    await expect(page.locator('[data-testid="revoked-certificate-warning"]')).toBeVisible();
  });

  test('should access verification via direct URL with certificate number', async ({ page }) => {
    // Navigate directly to verification page with certificate number
    await page.goto('/verify/HE2025001');
    
    // Should automatically load and show certificate details
    await expect(page.locator('[data-testid="certificate-details"]')).toBeVisible();
    await expect(page.locator('text=Certificate Status: Valid')).toBeVisible();
    
    // Certificate number field should be pre-filled
    await expect(page.locator('input[name="certificateNumber"]')).toHaveValue('HE2025001');
  });

  test('should handle QR scanner functionality', async ({ page }) => {
    await page.goto('/verify');
    
    // Check if QR scanner button/option is available
    await expect(page.locator('button:has-text("Scan QR Code")')).toBeVisible();
    
    // Click to open QR scanner
    await page.click('button:has-text("Scan QR Code")');
    
    // Should show camera permission request or scanner interface
    // Note: In headless mode, camera won't work, but we can test UI elements
    await expect(page.locator('[data-testid="qr-scanner-modal"]')).toBeVisible();
    await expect(page.locator('text=Position QR code in camera view')).toBeVisible();
    
    // Should have close/cancel option
    await expect(page.locator('button:has-text("Cancel")')).toBeVisible();
    
    // Close scanner
    await page.click('button:has-text("Cancel")');
    await expect(page.locator('[data-testid="qr-scanner-modal"]')).not.toBeVisible();
  });

  test('should validate certificate number format', async ({ page }) => {
    await page.goto('/verify');
    
    // Try with empty input
    await page.click('button:has-text("Verify")');
    await expect(page.locator('text=Please enter a certificate number')).toBeVisible();
    
    // Try with too short input
    await page.fill('input[name="certificateNumber"]', '123');
    await page.click('button:has-text("Verify")');
    await expect(page.locator('text=Certificate number must be at least 8 characters')).toBeVisible();
    
    // Try with invalid format
    await page.fill('input[name="certificateNumber"]', 'invalid-format');
    await page.click('button:has-text("Verify")');
    await expect(page.locator('text=Invalid certificate number format')).toBeVisible();
  });

  test('should show certificate details in multiple languages', async ({ page }) => {
    await page.goto('/verify');
    
    // Verify a certificate first
    await page.fill('input[name="certificateNumber"]', 'HE2025001');
    await page.click('button:has-text("Verify")');
    
    // Should show certificate details in default language (English)
    await expect(page.locator('text=Certificate Status: Valid')).toBeVisible();
    
    // Change to Arabic
    await page.click('[data-testid="language-selector"]');
    await page.click('text=العربية');
    
    // Certificate details should update to Arabic
    await expect(page.locator('text=حالة الشهادة: صالحة')).toBeVisible();
    
    // Change to Urdu
    await page.click('[data-testid="language-selector"]');
    await page.click('text=اردو');
    
    // Certificate details should update to Urdu
    await expect(page.locator('text=سرٹیفکیٹ کی حالت: درست')).toBeVisible();
  });

  test('should print or download certificate', async ({ page }) => {
    await page.goto('/verify');
    
    // Verify a certificate first
    await page.fill('input[name="certificateNumber"]', 'HE2025001');
    await page.click('button:has-text("Verify")');
    
    // Should show download/print options for valid certificate
    await expect(page.locator('button:has-text("Download Certificate")')).toBeVisible();
    await expect(page.locator('button:has-text("Print Certificate")')).toBeVisible();
    
    // Test download functionality
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Download Certificate")');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('HE2025001');
  });

  test('should handle network errors gracefully', async ({ page }) => {
    await page.goto('/verify');
    
    // Simulate network offline (this might require additional setup)
    await page.route('**/api/certificates/**', route => route.abort());
    
    await page.fill('input[name="certificateNumber"]', 'HE2025001');
    await page.click('button:has-text("Verify")');
    
    // Should show network error message
    await expect(page.locator('text=Network error. Please check your connection and try again.')).toBeVisible();
  });
});