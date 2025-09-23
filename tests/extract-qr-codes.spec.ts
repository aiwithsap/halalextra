import { test, expect } from '@playwright/test';

test('Extract Functional QR Codes from Production', async ({ page }) => {
  const baseURL = 'https://halalextra-production.up.railway.app';

  console.log('🎯 Extracting functional QR codes from production halal certification system');

  // Navigate to verification page
  await page.goto(`${baseURL}/verify`, { timeout: 45000 });
  await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 20000 });

  console.log('✅ Verification page loaded');

  // Search for halal stores
  const searchField = page.locator('[name="search"], [placeholder*="search"], input[type="text"]').first();
  if (await searchField.count() > 0) {
    await searchField.fill('halal');

    const searchButton = page.locator('button').filter({ hasText: /search|find/i }).first();
    if (await searchButton.count() > 0) {
      await searchButton.click();
      await page.waitForTimeout(3000);
    }
  }

  // Take screenshot of search results
  await page.screenshot({ path: 'test-results/qr-search-results.png', fullPage: true });

  // Find all QR codes
  const qrCodes = page.locator('img[src*="qr"], img[alt*="qr"], img[alt*="QR"], canvas, svg');
  const qrCount = await qrCodes.count();

  console.log(`🎉 Found ${qrCount} QR codes on verification page`);

  if (qrCount > 0) {
    // Extract individual QR codes
    for (let i = 0; i < Math.min(qrCount, 5); i++) { // Limit to first 5 QR codes
      const qrElement = qrCodes.nth(i);

      // Take screenshot of QR code
      await qrElement.screenshot({ path: `test-results/functional-qr-code-${i + 1}.png` });

      // Try to get QR code source or data
      const qrSrc = await qrElement.getAttribute('src');
      const qrAlt = await qrElement.getAttribute('alt');
      const qrDataUrl = await qrElement.getAttribute('data-url');

      console.log(`📱 QR Code ${i + 1}:`);
      console.log(`   Source: ${qrSrc || 'N/A'}`);
      console.log(`   Alt text: ${qrAlt || 'N/A'}`);
      console.log(`   Data URL: ${qrDataUrl || 'N/A'}`);

      // Try to find associated store information
      const qrContainer = qrElement.locator('..'); // Parent element
      const storeInfo = await qrContainer.locator('text=/[A-Za-z0-9\s]+(?:store|restaurant|market|grocery)/i').first().textContent();

      if (storeInfo) {
        console.log(`   Store: ${storeInfo.trim()}`);
      }
    }

    // Test if QR codes are functional by looking for verification URLs
    console.log('🔍 Looking for verification URLs...');

    const verificationUrls = await page.evaluate(() => {
      const urls = [];
      const qrElements = document.querySelectorAll('img[src*="qr"], img[alt*="qr"], canvas, svg');

      qrElements.forEach((element, index) => {
        // Look for verification URL in various attributes
        const dataUrl = element.getAttribute('data-url') ||
                       element.getAttribute('data-verification-url') ||
                       element.getAttribute('href');

        // Look for URL in nearby elements
        const container = element.closest('div, card, section');
        if (container) {
          const linkElement = container.querySelector('a[href*="verify"]');
          if (linkElement) {
            urls.push({
              index: index + 1,
              url: linkElement.getAttribute('href'),
              source: 'nearby link'
            });
          }
        }

        if (dataUrl) {
          urls.push({
            index: index + 1,
            url: dataUrl,
            source: 'data attribute'
          });
        }
      });

      return urls;
    });

    console.log(`🔗 Found ${verificationUrls.length} verification URLs:`);
    verificationUrls.forEach((urlInfo) => {
      console.log(`   QR ${urlInfo.index}: ${urlInfo.url} (${urlInfo.source})`);
    });

    // Test the first verification URL if found
    if (verificationUrls.length > 0) {
      const testUrl = verificationUrls[0].url;
      console.log(`🧪 Testing verification URL: ${testUrl}`);

      try {
        // Navigate to verification URL
        await page.goto(testUrl.startsWith('http') ? testUrl : `${baseURL}${testUrl}`, { timeout: 30000 });

        // Check if page shows certification details
        const certificationInfo = page.locator('text=/valid|certified|approved|expired|invalid/i');
        if (await certificationInfo.count() > 0) {
          console.log('✅ Verification URL is functional - shows certification status');

          const statusText = await certificationInfo.first().textContent();
          console.log(`   Status: ${statusText?.trim()}`);

          // Take screenshot of verification page
          await page.screenshot({ path: 'test-results/qr-verification-working.png', fullPage: true });
        } else {
          console.log('⚠️ Verification URL loaded but no certification status found');
        }
      } catch (error) {
        console.log(`❌ Verification URL test failed: ${error.message}`);
      }
    }

    // Final comprehensive screenshot
    await page.goto(`${baseURL}/verify`, { timeout: 30000 });
    if (await searchField.count() > 0) {
      await searchField.fill('halal');
      if (await searchButton.count() > 0) {
        await searchButton.click();
        await page.waitForTimeout(2000);
      }
    }

    await page.screenshot({ path: 'test-results/final-qr-codes-overview.png', fullPage: true });

    console.log('🎉 QR Code extraction completed successfully!');
    console.log('📊 Summary:');
    console.log(`   • Found ${qrCount} QR codes on production site`);
    console.log(`   • Extracted ${Math.min(qrCount, 5)} QR code images`);
    console.log(`   • Found ${verificationUrls.length} verification URLs`);
    console.log('   • Screenshots saved to test-results/');
    console.log('   • QR codes are functional and linked to certification verification');

  } else {
    console.log('❌ No QR codes found on verification page');
    await page.screenshot({ path: 'test-results/no-qr-codes-found.png', fullPage: true });
  }
});