import { test, expect } from '@playwright/test';

test.describe('Inspector Workflow', () => {
  let inspectorCredentials = {
    email: 'inspector@halalextra.com',
    password: 'inspector123'
  };

  test.beforeEach(async ({ page }) => {
    // Login as inspector first
    await page.goto('/login');
    await page.fill('input[name="email"]', inspectorCredentials.email);
    await page.fill('input[name="password"]', inspectorCredentials.password);
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('/inspector/dashboard');
  });

  test('should display inspector dashboard with pending applications', async ({ page }) => {
    await expect(page).toHaveURL('/inspector/dashboard');
    await expect(page.locator('text=Inspector Dashboard')).toBeVisible();
    
    // Check for dashboard sections
    await expect(page.locator('text=Pending Inspections')).toBeVisible();
    await expect(page.locator('text=Recent Inspections')).toBeVisible();
    
    // Should show applications queue
    await expect(page.locator('[data-testid="applications-queue"]')).toBeVisible();
  });

  test('should view application details and start inspection', async ({ page }) => {
    // Click on the first pending application
    await page.click('[data-testid="application-item"]:first-child');
    
    // Should navigate to application detail page
    await expect(page.url()).toContain('/inspector/application/');
    
    // Check application details are displayed
    await expect(page.locator('text=Application Details')).toBeVisible();
    await expect(page.locator('text=Business Information')).toBeVisible();
    await expect(page.locator('text=Operations Details')).toBeVisible();
    await expect(page.locator('text=Documents')).toBeVisible();
    
    // Start inspection button should be available
    await expect(page.locator('button:has-text("Start Inspection")')).toBeVisible();
  });

  test('should complete full inspection process', async ({ page }) => {
    // Navigate to an application detail page
    await page.click('[data-testid="application-item"]:first-child');
    
    // Start inspection
    await page.click('button:has-text("Start Inspection")');
    
    // Fill inspection form
    await expect(page.locator('text=Inspection Checklist')).toBeVisible();
    
    // Kitchen/Food Preparation Area checks
    await page.check('input[name="cleanlinessStandards"]');
    await page.check('input[name="halLabeledIngredients"]');
    await page.check('input[name="separateStorageArea"]');
    await page.check('input[name="properEquipmentCleaning"]');
    
    // Documentation checks
    await page.check('input[name="supplierCertificates"]');
    await page.check('input[name="staffTrainingRecords"]');
    await page.check('input[name="halalPolicyDisplayed"]');
    
    // Upload inspection photos
    // Note: In real tests, you would upload actual test images
    await expect(page.locator('input[type="file"][name="kitchenPhotos"]')).toBeVisible();
    await expect(page.locator('input[type="file"][name="storagePhotos"]')).toBeVisible();
    await expect(page.locator('input[type="file"][name="certificatePhotos"]')).toBeVisible();
    
    // Add inspection notes
    await page.fill('textarea[name="inspectionNotes"]', 'All requirements met. Business maintains excellent halal standards.');
    
    // Select overall rating
    await page.click('[data-testid="rating-excellent"]');
    
    // Submit inspection
    await page.click('button:has-text("Submit Inspection")');
    
    // Should show success message and redirect
    await expect(page.locator('text=Inspection submitted successfully')).toBeVisible();
  });

  test('should reject application with proper documentation', async ({ page }) => {
    // Navigate to an application detail page
    await page.click('[data-testid="application-item"]:first-child');
    
    // Start inspection
    await page.click('button:has-text("Start Inspection")');
    
    // Fill some failing criteria
    await page.uncheck('input[name="cleanlinessStandards"]');
    await page.uncheck('input[name="supplierCertificates"]');
    
    // Add detailed rejection notes
    await page.fill('textarea[name="inspectionNotes"]', 'Failed inspection due to: 1) Kitchen cleanliness standards not met 2) Missing supplier certificates');
    
    // Select failing rating
    await page.click('[data-testid="rating-poor"]');
    
    // Reject application
    await page.click('button:has-text("Reject Application")');
    
    // Confirm rejection
    await page.click('button:has-text("Confirm Rejection")');
    
    // Should show success message
    await expect(page.locator('text=Application rejected successfully')).toBeVisible();
  });

  test('should approve application and generate certificate', async ({ page }) => {
    // Navigate to an application detail page
    await page.click('[data-testid="application-item"]:first-child');
    
    // Start inspection
    await page.click('button:has-text("Start Inspection")');
    
    // Fill all passing criteria
    await page.check('input[name="cleanlinessStandards"]');
    await page.check('input[name="halLabeledIngredients"]');
    await page.check('input[name="separateStorageArea"]');
    await page.check('input[name="properEquipmentCleaning"]');
    await page.check('input[name="supplierCertificates"]');
    await page.check('input[name="staffTrainingRecords"]');
    await page.check('input[name="halalPolicyDisplayed"]');
    
    // Add positive notes
    await page.fill('textarea[name="inspectionNotes"]', 'Excellent compliance with all halal standards. Highly recommended for certification.');
    
    // Select excellent rating
    await page.click('[data-testid="rating-excellent"]');
    
    // Approve application
    await page.click('button:has-text("Approve & Generate Certificate")');
    
    // Should show certificate generation success
    await expect(page.locator('text=Certificate generated successfully')).toBeVisible();
    
    // Should show QR code
    await expect(page.locator('[data-testid="certificate-qr-code"]')).toBeVisible();
    
    // Should show certificate details
    await expect(page.locator('text=Certificate Number')).toBeVisible();
    await expect(page.locator('text=Valid Until')).toBeVisible();
  });

  test('should view inspection history', async ({ page }) => {
    // Navigate to inspection history section
    await page.click('text=Inspection History');
    
    // Should show list of completed inspections
    await expect(page.locator('[data-testid="inspection-history-list"]')).toBeVisible();
    
    // Should show inspection details for each entry
    await expect(page.locator('text=Inspection Date')).toBeVisible();
    await expect(page.locator('text=Business Name')).toBeVisible();
    await expect(page.locator('text=Status')).toBeVisible();
  });

  test('should handle inspection form validation', async ({ page }) => {
    // Navigate to an application detail page
    await page.click('[data-testid="application-item"]:first-child');
    
    // Start inspection
    await page.click('button:has-text("Start Inspection")');
    
    // Try to submit without completing required fields
    await page.click('button:has-text("Submit Inspection")');
    
    // Should show validation errors
    await expect(page.locator('text=Please complete all required inspection items')).toBeVisible();
    await expect(page.locator('text=Inspection notes are required')).toBeVisible();
    await expect(page.locator('text=Please select a rating')).toBeVisible();
  });

  test('should logout properly', async ({ page }) => {
    // Click logout button
    await page.click('[data-testid="logout-button"]');
    
    // Should redirect to login page
    await expect(page).toHaveURL('/login');
    
    // Should not be able to access inspector pages directly
    await page.goto('/inspector/dashboard');
    await expect(page).toHaveURL('/login');
  });
});