import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard Flow', () => {
  let adminCredentials = {
    email: 'admin@halalextra.com',
    password: 'admin123'
  };

  test.beforeEach(async ({ page }) => {
    // Login as admin first
    await page.goto('/login');
    await page.fill('input[name="email"]', adminCredentials.email);
    await page.fill('input[name="password"]', adminCredentials.password);
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('/admin/dashboard');
  });

  test('should display admin dashboard with overview metrics', async ({ page }) => {
    await expect(page).toHaveURL('/admin/dashboard');
    await expect(page.locator('text=Admin Dashboard')).toBeVisible();
    
    // Check for key metrics cards
    await expect(page.locator('[data-testid="total-applications"]')).toBeVisible();
    await expect(page.locator('[data-testid="pending-inspections"]')).toBeVisible();
    await expect(page.locator('[data-testid="active-certificates"]')).toBeVisible();
    await expect(page.locator('[data-testid="expired-certificates"]')).toBeVisible();
    
    // Check for charts/analytics
    await expect(page.locator('[data-testid="applications-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="certificates-chart"]')).toBeVisible();
    
    // Check for recent activity feed
    await expect(page.locator('text=Recent Activity')).toBeVisible();
    await expect(page.locator('[data-testid="activity-feed"]')).toBeVisible();
  });

  test('should manage applications in the applications section', async ({ page }) => {
    // Navigate to applications management
    await page.click('text=Applications');
    await expect(page).toHaveURL('/admin/applications');
    
    // Check applications table
    await expect(page.locator('[data-testid="applications-table"]')).toBeVisible();
    await expect(page.locator('text=Application ID')).toBeVisible();
    await expect(page.locator('text=Business Name')).toBeVisible();
    await expect(page.locator('text=Status')).toBeVisible();
    await expect(page.locator('text=Submission Date')).toBeVisible();
    await expect(page.locator('text=Inspector')).toBeVisible();
    
    // Check filters
    await expect(page.locator('[data-testid="status-filter"]')).toBeVisible();
    await expect(page.locator('[data-testid="date-range-filter"]')).toBeVisible();
    
    // Test status filter
    await page.click('[data-testid="status-filter"]');
    await page.click('text=Pending');
    
    // Table should update to show only pending applications
    await expect(page.locator('[data-testid="applications-table"] [data-status="pending"]')).toBeVisible();
  });

  test('should view and manage specific application details', async ({ page }) => {
    await page.goto('/admin/applications');
    
    // Click on first application in the table
    await page.click('[data-testid="applications-table"] tbody tr:first-child');
    
    // Should open application details modal or navigate to detail page
    await expect(page.locator('[data-testid="application-details-modal"]')).toBeVisible();
    
    // Check application information
    await expect(page.locator('text=Business Information')).toBeVisible();
    await expect(page.locator('text=Operations Details')).toBeVisible();
    await expect(page.locator('text=Uploaded Documents')).toBeVisible();
    await expect(page.locator('text=Payment Status')).toBeVisible();
    
    // Admin actions should be available
    await expect(page.locator('button:has-text("Assign Inspector")')).toBeVisible();
    await expect(page.locator('button:has-text("Update Status")')).toBeVisible();
    await expect(page.locator('button:has-text("Add Notes")')).toBeVisible();
  });

  test('should assign inspector to application', async ({ page }) => {
    await page.goto('/admin/applications');
    await page.click('[data-testid="applications-table"] tbody tr:first-child');
    
    // Click assign inspector
    await page.click('button:has-text("Assign Inspector")');
    
    // Should show inspector selection modal
    await expect(page.locator('[data-testid="inspector-assignment-modal"]')).toBeVisible();
    await expect(page.locator('text=Select Inspector')).toBeVisible();
    
    // Select an inspector
    await page.click('[data-testid="inspector-select"]');
    await page.click('text=John Smith (Inspector)');
    
    // Add assignment notes
    await page.fill('textarea[name="assignmentNotes"]', 'Urgent inspection required for this high-priority application');
    
    // Confirm assignment
    await page.click('button:has-text("Assign Inspector")');
    
    // Should show success message
    await expect(page.locator('text=Inspector assigned successfully')).toBeVisible();
  });

  test('should manage certificate expiration alerts', async ({ page }) => {
    // Check if expired/expiring certificates are highlighted
    await expect(page.locator('[data-testid="expiring-certificates-alert"]')).toBeVisible();
    await expect(page.locator('text=Certificates Expiring Soon')).toBeVisible();
    
    // Click to view expiring certificates
    await page.click('[data-testid="view-expiring-certificates"]');
    
    // Should show list of expiring certificates
    await expect(page.locator('[data-testid="expiring-certificates-list"]')).toBeVisible();
    
    // Should have options to contact businesses or extend certificates
    await expect(page.locator('button:has-text("Send Renewal Notice")')).toBeVisible();
    await expect(page.locator('button:has-text("Extend Certificate")')).toBeVisible();
  });

  test('should revoke certificate with proper documentation', async ({ page }) => {
    await page.goto('/admin/applications');
    
    // Find an active certificate to revoke
    await page.click('[data-testid="status-filter"]');
    await page.click('text=Certified');
    
    await page.click('[data-testid="applications-table"] tbody tr:first-child');
    
    // Revoke certificate option should be available
    await expect(page.locator('button:has-text("Revoke Certificate")')).toBeVisible();
    await page.click('button:has-text("Revoke Certificate")');
    
    // Should show revocation modal
    await expect(page.locator('[data-testid="certificate-revocation-modal"]')).toBeVisible();
    
    // Select reason for revocation
    await page.click('[data-testid="revocation-reason"]');
    await page.click('text=Non-compliance with halal standards');
    
    // Add detailed notes
    await page.fill('textarea[name="revocationNotes"]', 'Certificate revoked due to failure to maintain halal compliance as reported by follow-up inspection.');
    
    // Confirm revocation
    await page.click('button:has-text("Confirm Revocation")');
    
    // Should show confirmation
    await expect(page.locator('text=Certificate revoked successfully')).toBeVisible();
  });

  test('should generate and view analytics reports', async ({ page }) => {
    // Navigate to reports/analytics section
    await page.click('text=Analytics');
    
    // Check for various report types
    await expect(page.locator('text=Application Statistics')).toBeVisible();
    await expect(page.locator('text=Certificate Analytics')).toBeVisible();
    await expect(page.locator('text=Inspector Performance')).toBeVisible();
    
    // Test date range selection
    await page.click('[data-testid="date-range-selector"]');
    await page.click('text=Last 30 Days');
    
    // Charts should update
    await expect(page.locator('[data-testid="applications-trend-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="certification-success-rate"]')).toBeVisible();
    
    // Export report functionality
    await page.click('button:has-text("Export Report")');
    
    // Should show export options
    await expect(page.locator('text=Export Format')).toBeVisible();
    await expect(page.locator('text=PDF')).toBeVisible();
    await expect(page.locator('text=Excel')).toBeVisible();
    await expect(page.locator('text=CSV')).toBeVisible();
  });

  test('should manage feedback moderation', async ({ page }) => {
    await page.goto('/admin/feedback');
    
    // Check feedback moderation interface
    await expect(page.locator('text=Feedback Moderation')).toBeVisible();
    await expect(page.locator('[data-testid="feedback-queue"]')).toBeVisible();
    
    // Should show feedback items with moderation actions
    await expect(page.locator('button:has-text("Approve")')).toBeVisible();
    await expect(page.locator('button:has-text("Reject")')).toBeVisible();
    await expect(page.locator('button:has-text("Flag for Review")')).toBeVisible();
    
    // Test feedback approval
    await page.click('[data-testid="feedback-item"]:first-child button:has-text("Approve")');
    await expect(page.locator('text=Feedback approved successfully')).toBeVisible();
  });

  test('should manage user accounts and roles', async ({ page }) => {
    // Navigate to user management (if available)
    await page.click('text=Users');
    
    // Check users table
    await expect(page.locator('[data-testid="users-table"]')).toBeVisible();
    await expect(page.locator('text=Name')).toBeVisible();
    await expect(page.locator('text=Email')).toBeVisible();
    await expect(page.locator('text=Role')).toBeVisible();
    await expect(page.locator('text=Status')).toBeVisible();
    
    // Test adding new inspector
    await page.click('button:has-text("Add Inspector")');
    
    // Fill new inspector form
    await page.fill('input[name="name"]', 'Jane Doe');
    await page.fill('input[name="email"]', 'jane.doe@halalextra.com');
    await page.fill('input[name="phone"]', '+1234567890');
    
    // Submit form
    await page.click('button:has-text("Create Inspector Account")');
    
    // Should show success message
    await expect(page.locator('text=Inspector account created successfully')).toBeVisible();
  });

  test('should handle system settings and configuration', async ({ page }) => {
    // Navigate to settings
    await page.click('text=Settings');
    
    // Check system configuration options
    await expect(page.locator('text=System Settings')).toBeVisible();
    await expect(page.locator('text=Certificate Settings')).toBeVisible();
    await expect(page.locator('text=Email Templates')).toBeVisible();
    await expect(page.locator('text=Payment Settings')).toBeVisible();
    
    // Test updating certificate validity period
    await page.fill('input[name="certificateValidityMonths"]', '24');
    await page.click('button:has-text("Save Settings")');
    
    // Should show success message
    await expect(page.locator('text=Settings updated successfully')).toBeVisible();
  });

  test('should handle admin logout properly', async ({ page }) => {
    // Click logout
    await page.click('[data-testid="admin-logout-button"]');
    
    // Should redirect to login
    await expect(page).toHaveURL('/login');
    
    // Should not be able to access admin pages directly
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL('/login');
  });

  test('should handle pagination in applications table', async ({ page }) => {
    await page.goto('/admin/applications');
    
    // Check if pagination exists (only if there are many applications)
    const pagination = page.locator('[data-testid="applications-pagination"]');
    if (await pagination.isVisible()) {
      // Test pagination
      await page.click('[data-testid="next-page"]');
      
      // URL should update with page parameter
      await expect(page.url()).toContain('page=2');
      
      // Test page size selection
      await page.click('[data-testid="page-size-select"]');
      await page.click('text=50 per page');
      
      // Table should update with more rows
      const rows = await page.locator('[data-testid="applications-table"] tbody tr').count();
      expect(rows).toBeGreaterThan(10);
    }
  });
});