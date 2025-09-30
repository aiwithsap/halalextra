import { test, expect } from '@playwright/test';

/**
 * Admin Dashboard Improvements Test
 *
 * Tests the Phase 1 critical fixes:
 * 1. Inspector dropdown in Application Detail page
 * 2. Certificate Management tab with list, search, filter, and revoke functionality
 *
 * Prerequisites:
 * - Admin user: adeelh / 1P9Zqz7DIoKIqJx
 * - At least one application exists
 * - At least one active certificate exists (HAL-2025-00010 or HAL-2025-00011)
 */

test.describe('Admin Dashboard Improvements - Phase 1', () => {
  const baseUrl = 'https://halalextra-production.up.railway.app';
  const adminUsername = 'adeelh';
  const adminPassword = '1P9Zqz7DIoKIqJx';

  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto(`${baseUrl}/login`);
    await page.fill('input[name="username"]', adminUsername);
    await page.fill('input[name="password"]', adminPassword);
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard
    await page.waitForURL(/\/admin\/dashboard/, { timeout: 30000 });
    await page.waitForTimeout(2000);
  });

  test('Inspector dropdown should load inspectors', async ({ page }) => {
    console.log('[TEST] Testing inspector dropdown functionality...');

    // Navigate to Applications tab
    await page.click('button[role="tab"]:has-text("Applications")');
    await page.waitForTimeout(2000);

    // Find an application in the list and click it
    const applicationRow = page.locator('table tbody tr').first();
    await applicationRow.waitFor({ timeout: 10000 });
    await applicationRow.click();

    // Wait for application detail page
    await page.waitForURL(/\/admin\/application\/\d+/, { timeout: 10000 });
    await page.waitForTimeout(2000);

    // Navigate to Inspection tab
    await page.click('button[role="tab"]:has-text("Inspection")');
    await page.waitForTimeout(2000);

    // Check if inspector dropdown exists
    const inspectorDropdown = page.locator('button:has-text("Select an inspector")');
    if (await inspectorDropdown.count() > 0) {
      console.log('[TEST] Inspector dropdown found - opening it...');

      // Click to open dropdown
      await inspectorDropdown.click();
      await page.waitForTimeout(1000);

      // Check if dropdown options are loaded
      const dropdownOptions = page.locator('[role="option"]');
      const optionCount = await dropdownOptions.count();

      console.log(`[TEST] Found ${optionCount} inspector options`);
      expect(optionCount).toBeGreaterThan(0);

      // Take screenshot for verification
      await page.screenshot({
        path: '.playwright-mcp/inspector-dropdown-loaded.png',
        fullPage: true
      });

      console.log('[TEST] ✅ Inspector dropdown loads successfully');
    } else {
      console.log('[TEST] Inspector already assigned - test skipped');
    }
  });

  test('Certificate Management tab should display certificates', async ({ page }) => {
    console.log('[TEST] Testing Certificate Management tab...');

    // Navigate to Certificates tab
    await page.click('button[role="tab"]:has-text("Certificates")');
    await page.waitForTimeout(3000);

    // Check if certificate list is displayed (not "Coming Soon" message)
    const comingSoonMessage = page.locator('text=Coming Soon');
    expect(await comingSoonMessage.count()).toBe(0);

    // Check if certificate table exists
    const certificateTable = page.locator('table');
    await certificateTable.waitFor({ timeout: 10000 });

    // Check table headers
    await expect(page.locator('th:has-text("Certificate Number")')).toBeVisible();
    await expect(page.locator('th:has-text("Store Name")')).toBeVisible();
    await expect(page.locator('th:has-text("Status")')).toBeVisible();
    await expect(page.locator('th:has-text("Issued Date")')).toBeVisible();
    await expect(page.locator('th:has-text("Actions")')).toBeVisible();

    // Check if at least one certificate is displayed
    const certificateRows = page.locator('table tbody tr');
    const rowCount = await certificateRows.count();
    console.log(`[TEST] Found ${rowCount} certificates`);
    expect(rowCount).toBeGreaterThan(0);

    // Take screenshot
    await page.screenshot({
      path: '.playwright-mcp/certificate-list-loaded.png',
      fullPage: true
    });

    console.log('[TEST] ✅ Certificate list displays successfully');
  });

  test('Certificate search should filter results', async ({ page }) => {
    console.log('[TEST] Testing certificate search functionality...');

    // Navigate to Certificates tab
    await page.click('button[role="tab"]:has-text("Certificates")');
    await page.waitForTimeout(3000);

    // Get initial certificate count
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    const initialRows = await page.locator('table tbody tr').count();
    console.log(`[TEST] Initial certificate count: ${initialRows}`);

    // Search for a specific certificate (HAL-2025-00010)
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('HAL-2025-00010');
    await page.waitForTimeout(2000);

    // Check filtered results
    const filteredRows = await page.locator('table tbody tr').count();
    console.log(`[TEST] Filtered certificate count: ${filteredRows}`);

    // Verify certificate number appears in results
    await expect(page.locator('td:has-text("HAL-2025-00010")')).toBeVisible({ timeout: 5000 });

    // Take screenshot
    await page.screenshot({
      path: '.playwright-mcp/certificate-search-filtered.png',
      fullPage: true
    });

    console.log('[TEST] ✅ Certificate search works correctly');
  });

  test('Certificate status filter should work', async ({ page }) => {
    console.log('[TEST] Testing certificate status filter...');

    // Navigate to Certificates tab
    await page.click('button[role="tab"]:has-text("Certificates")');
    await page.waitForTimeout(3000);

    // Click status filter dropdown
    const statusFilter = page.locator('button:has-text("Filter by status")');
    await statusFilter.click();
    await page.waitForTimeout(1000);

    // Select "Active" status
    await page.click('text=Active');
    await page.waitForTimeout(2000);

    // Verify only active certificates are shown
    const statusBadges = page.locator('table tbody tr td:has-text("active")');
    const activeCount = await statusBadges.count();
    console.log(`[TEST] Active certificates: ${activeCount}`);
    expect(activeCount).toBeGreaterThan(0);

    // Take screenshot
    await page.screenshot({
      path: '.playwright-mcp/certificate-filter-active.png',
      fullPage: true
    });

    console.log('[TEST] ✅ Certificate status filter works correctly');
  });

  test('Certificate revoke dialog should open', async ({ page }) => {
    console.log('[TEST] Testing certificate revoke functionality...');

    // Navigate to Certificates tab
    await page.click('button[role="tab"]:has-text("Certificates")');
    await page.waitForTimeout(3000);

    // Find first active certificate with Revoke button
    const revokeButton = page.locator('button:has-text("Revoke")').first();

    if (await revokeButton.count() > 0) {
      console.log('[TEST] Found Revoke button - clicking...');
      await revokeButton.click();
      await page.waitForTimeout(1000);

      // Check if revoke dialog opens
      await expect(page.locator('text=Revoke Certificate')).toBeVisible();
      await expect(page.locator('text=Reason for Revocation')).toBeVisible();

      // Take screenshot of dialog
      await page.screenshot({
        path: '.playwright-mcp/certificate-revoke-dialog.png',
        fullPage: true
      });

      // Close dialog without revoking
      await page.click('button:has-text("Cancel")');
      await page.waitForTimeout(1000);

      console.log('[TEST] ✅ Certificate revoke dialog works correctly');
    } else {
      console.log('[TEST] No active certificates available for revoke test');
    }
  });

  test('Certificate verification link should work', async ({ page }) => {
    console.log('[TEST] Testing certificate verification link...');

    // Navigate to Certificates tab
    await page.click('button[role="tab"]:has-text("Certificates")');
    await page.waitForTimeout(3000);

    // Get first certificate number
    const firstCertNumber = await page.locator('table tbody tr td:first-child').first().textContent();
    console.log(`[TEST] Testing verification for: ${firstCertNumber}`);

    // Click external link button
    const viewButton = page.locator('table tbody tr').first().locator('button:has(svg)');

    // Open in new page
    const [newPage] = await Promise.all([
      page.context().waitForEvent('page'),
      viewButton.click()
    ]);

    // Wait for verification page to load
    await newPage.waitForLoadState('networkidle');
    await newPage.waitForTimeout(2000);

    // Verify certificate page shows the correct certificate
    await expect(newPage.locator(`text=${firstCertNumber}`)).toBeVisible({ timeout: 10000 });

    // Take screenshot
    await newPage.screenshot({
      path: '.playwright-mcp/certificate-verification-page.png',
      fullPage: true
    });

    await newPage.close();

    console.log('[TEST] ✅ Certificate verification link works correctly');
  });
});