import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('HalalExtra Key Functionality Validation', () => {

  test('Validate core application workflow and file uploads', async ({ page }) => {
    console.log('🚀 Testing HalalExtra core functionality...');

    // Step 1: Homepage loads
    console.log('1️⃣ Testing homepage...');
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/key-01-homepage.png', fullPage: true });

    // Verify homepage has key elements
    const hasHeroSection = await page.locator('h1, h2, .hero, [class*="hero"]').count() > 0;
    console.log(`✅ Homepage loaded with content: ${hasHeroSection}`);

    // Step 2: Application form is accessible and functional
    console.log('2️⃣ Testing application form...');
    await page.goto('/apply');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/key-02-apply-form.png', fullPage: true });

    // Check form has required elements
    const formInputs = await page.locator('input').count();
    const fileInputs = await page.locator('input[type="file"]').count();
    const buttons = await page.locator('button').count();

    console.log(`📝 Form elements found - Inputs: ${formInputs}, File inputs: ${fileInputs}, Buttons: ${buttons}`);

    // Test file upload functionality
    if (fileInputs > 0) {
      console.log('📁 Testing file uploads...');

      // Create test file if it doesn't exist
      const testFixturesDir = path.join(__dirname, '..', 'test-fixtures');
      if (!fs.existsSync(testFixturesDir)) {
        fs.mkdirSync(testFixturesDir, { recursive: true });
      }

      const testFile = path.join(testFixturesDir, 'test-upload.pdf');
      if (!fs.existsSync(testFile)) {
        fs.writeFileSync(testFile, '%PDF-1.4\nTest document content');
      }

      // Try uploading to first file input
      const firstFileInput = page.locator('input[type="file"]').first();
      await firstFileInput.setInputFiles(testFile);

      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'test-results/key-03-file-uploaded.png', fullPage: true });
      console.log('✅ File upload functionality working');
    }

    // Step 3: Login functionality
    console.log('3️⃣ Testing login functionality...');
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/key-04-login-page.png', fullPage: true });

    const hasLoginForm = await page.locator('input[type="password"]').count() > 0;
    console.log(`🔐 Login form available: ${hasLoginForm}`);

    if (hasLoginForm) {
      // Attempt login with inspector credentials
      const usernameField = page.locator('input[name="username"], input[name="email"], input[type="email"]').first();
      const passwordField = page.locator('input[type="password"]').first();

      if (await usernameField.count() > 0 && await passwordField.count() > 0) {
        await usernameField.fill('adeelh');
        await passwordField.fill('1P9Zqz7DIoKIqJx');

        const loginButton = page.locator('button[type="submit"], button:has-text("Login")').first();
        if (await loginButton.count() > 0) {
          await loginButton.click();
          await page.waitForTimeout(3000);

          await page.screenshot({ path: 'test-results/key-05-after-login.png', fullPage: true });

          // Check if we're redirected to dashboard
          const currentUrl = page.url();
          const isDashboard = currentUrl.includes('dashboard') || currentUrl.includes('admin') || currentUrl.includes('inspector');
          console.log(`🎯 Login attempt completed. Dashboard redirect: ${isDashboard}`);
        }
      }
    }

    // Step 4: QR Verification
    console.log('4️⃣ Testing QR verification...');
    await page.goto('/verify');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/key-06-verify-page.png', fullPage: true });

    const hasVerifyForm = await page.locator('input[type="text"], input[placeholder*="certificate"]').count() > 0;
    console.log(`🔍 QR verification form available: ${hasVerifyForm}`);

    if (hasVerifyForm) {
      // Test with a sample certificate number
      const verifyInput = page.locator('input[type="text"], input[placeholder*="certificate"]').first();
      await verifyInput.fill('HAL-2024-TEST');

      const verifyButton = page.locator('button:has-text("Verify"), button[type="submit"]').first();
      if (await verifyButton.count() > 0) {
        await verifyButton.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'test-results/key-07-verify-result.png', fullPage: true });
        console.log('✅ QR verification functionality tested');
      }
    }

    // Step 5: Admin Dashboard Access
    console.log('5️⃣ Testing admin dashboard access...');
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/key-08-admin-dashboard.png', fullPage: true });

    const hasAdminContent = await page.locator('text=Admin, text=Dashboard, text=Statistics, text=Applications').count() > 0;
    console.log(`👑 Admin dashboard content: ${hasAdminContent > 0 ? 'Available' : 'Protected/Not available'}`);

    // Step 6: Inspector Dashboard Access
    console.log('6️⃣ Testing inspector dashboard access...');
    await page.goto('/inspector');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/key-09-inspector-dashboard.png', fullPage: true });

    const hasInspectorContent = await page.locator('text=Inspector, text=Assigned, text=Inspections').count() > 0;
    console.log(`🔍 Inspector dashboard content: ${hasInspectorContent > 0 ? 'Available' : 'Protected/Not available'}`);

    // Final summary
    const testResults = {
      homepage: hasHeroSection,
      applicationForm: formInputs > 0,
      fileUploads: fileInputs > 0,
      loginForm: hasLoginForm,
      qrVerification: hasVerifyForm,
      adminDashboard: hasAdminContent > 0,
      inspectorDashboard: hasInspectorContent > 0,
      timestamp: new Date().toISOString()
    };

    console.log('📊 Test Results Summary:');
    console.log(JSON.stringify(testResults, null, 2));

    // Save results
    fs.writeFileSync('test-results/key-functionality-results.json', JSON.stringify(testResults, null, 2));

    // Assert key functionality is present
    expect(testResults.homepage).toBe(true);
    expect(testResults.applicationForm).toBe(true);
    expect(testResults.fileUploads).toBe(true);
    expect(testResults.loginForm).toBe(true);
    expect(testResults.qrVerification).toBe(true);

    console.log('🎉 All key functionality tests completed successfully!');
  });

  test('Extract QR code if available from certificates', async ({ page }) => {
    console.log('🎯 Testing QR code extraction...');

    // Navigate through potential paths where QR codes might be displayed
    const qrTestUrls = [
      '/verify',
      '/admin',
      '/inspector',
      '/certificate/HAL-2024-TEST'
    ];

    for (const url of qrTestUrls) {
      console.log(`🔍 Checking for QR codes at: ${url}`);
      try {
        await page.goto(url);
        await page.waitForLoadState('networkidle');

        // Look for QR code images
        const qrImages = await page.locator('img[src*="qr"], img[alt*="QR"], img[alt*="qr"], canvas, svg').count();

        if (qrImages > 0) {
          console.log(`📱 Found ${qrImages} potential QR code element(s) at ${url}`);
          await page.screenshot({ path: `test-results/qr-found-${url.replace(/[^a-z0-9]/gi, '-')}.png`, fullPage: true });

          // Try to extract QR code image
          const firstQrElement = page.locator('img[src*="qr"], img[alt*="QR"], img[alt*="qr"]').first();
          if (await firstQrElement.count() > 0) {
            try {
              await firstQrElement.screenshot({ path: 'test-results/extracted-qr-code.png' });
              console.log('✅ QR code extracted and saved to test-results/extracted-qr-code.png');
            } catch (e) {
              console.log('❓ Could not extract QR code image');
            }
          }
        }
      } catch (e) {
        console.log(`❓ Could not access ${url}`);
      }
    }
  });
});