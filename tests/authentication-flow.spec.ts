import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login page correctly', async ({ page }) => {
    await page.click('text=Login');
    await expect(page).toHaveURL('/login');
    
    // Check login form elements
    await expect(page.locator('text=Login to Your Account')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Check for role selection if available
    await expect(page.locator('[data-testid="role-selector"]')).toBeVisible();
  });

  test('should validate login form fields', async ({ page }) => {
    await page.goto('/login');
    
    // Try to submit empty form
    await page.click('button[type="submit"]');
    
    // Should show validation errors
    await expect(page.locator('text=Email is required')).toBeVisible();
    await expect(page.locator('text=Password is required')).toBeVisible();
    
    // Test invalid email format
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=Please enter a valid email address')).toBeVisible();
  });

  test('should handle invalid login credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Enter invalid credentials
    await page.fill('input[name="email"]', 'invalid@test.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('text=Invalid email or password')).toBeVisible();
    
    // Should remain on login page
    await expect(page).toHaveURL('/login');
  });

  test('should login successfully as admin', async ({ page }) => {
    await page.goto('/login');
    
    // Select admin role
    await page.click('[data-testid="role-selector"]');
    await page.click('text=Admin');
    
    // Enter admin credentials
    await page.fill('input[name="email"]', 'admin@halalextra.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Should redirect to admin dashboard
    await expect(page).toHaveURL('/admin/dashboard');
    await expect(page.locator('text=Admin Dashboard')).toBeVisible();
    
    // Should show user info in header
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    await expect(page.locator('text=admin@halalextra.com')).toBeVisible();
  });

  test('should login successfully as inspector', async ({ page }) => {
    await page.goto('/login');
    
    // Select inspector role
    await page.click('[data-testid="role-selector"]');
    await page.click('text=Inspector');
    
    // Enter inspector credentials
    await page.fill('input[name="email"]', 'inspector@halalextra.com');
    await page.fill('input[name="password"]', 'inspector123');
    await page.click('button[type="submit"]');
    
    // Should redirect to inspector dashboard
    await expect(page).toHaveURL('/inspector/dashboard');
    await expect(page.locator('text=Inspector Dashboard')).toBeVisible();
  });

  test('should handle role-based access control', async ({ page }) => {
    // Login as inspector
    await page.goto('/login');
    await page.click('[data-testid="role-selector"]');
    await page.click('text=Inspector');
    await page.fill('input[name="email"]', 'inspector@halalextra.com');
    await page.fill('input[name="password"]', 'inspector123');
    await page.click('button[type="submit"]');
    
    // Should be on inspector dashboard
    await expect(page).toHaveURL('/inspector/dashboard');
    
    // Try to access admin pages - should be redirected or show access denied
    await page.goto('/admin/dashboard');
    await expect(page.locator('text=Access Denied')).toBeVisible();
    // OR should redirect to login/unauthorized page
    // await expect(page).toHaveURL('/login');
  });

  test('should remember login session', async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.click('[data-testid="role-selector"]');
    await page.click('text=Admin');
    await page.fill('input[name="email"]', 'admin@halalextra.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Verify logged in
    await expect(page).toHaveURL('/admin/dashboard');
    
    // Navigate to different page
    await page.goto('/');
    
    // Should still be logged in - user menu should be visible
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    
    // Direct navigation to dashboard should work
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL('/admin/dashboard');
    await expect(page.locator('text=Admin Dashboard')).toBeVisible();
  });

  test('should logout properly', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.click('[data-testid="role-selector"]');
    await page.click('text=Admin');
    await page.fill('input[name="email"]', 'admin@halalextra.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/admin/dashboard');
    
    // Logout
    await page.click('[data-testid="user-menu"]');
    await page.click('text=Logout');
    
    // Should redirect to homepage or login
    await expect(page).toHaveURL('/');
    
    // User menu should no longer be visible
    await expect(page.locator('[data-testid="user-menu"]')).not.toBeVisible();
    
    // Should show login link instead
    await expect(page.locator('text=Login')).toBeVisible();
    
    // Direct access to protected routes should redirect to login
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL('/login');
  });

  test('should handle session timeout', async ({ page }) => {
    // This would typically involve manipulating session cookies or waiting
    // For testing purposes, we can simulate by clearing cookies
    
    // Login first
    await page.goto('/login');
    await page.click('[data-testid="role-selector"]');
    await page.click('text=Admin');
    await page.fill('input[name="email"]', 'admin@halalextra.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/admin/dashboard');
    
    // Clear session cookies to simulate timeout
    await page.context().clearCookies();
    
    // Try to access protected route
    await page.goto('/admin/applications');
    
    // Should redirect to login
    await expect(page).toHaveURL('/login');
    
    // Should show session timeout message
    await expect(page.locator('text=Your session has expired. Please login again.')).toBeVisible();
  });

  test('should handle password visibility toggle', async ({ page }) => {
    await page.goto('/login');
    
    const passwordInput = page.locator('input[name="password"]');
    const toggleButton = page.locator('[data-testid="password-toggle"]');
    
    // Password should initially be hidden
    await expect(passwordInput).toHaveAttribute('type', 'password');
    
    // Click toggle to show password
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
    
    // Click again to hide password
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('should handle forgot password functionality', async ({ page }) => {
    await page.goto('/login');
    
    // Check if forgot password link exists
    await expect(page.locator('text=Forgot Password?')).toBeVisible();
    await page.click('text=Forgot Password?');
    
    // Should show forgot password form
    await expect(page.locator('text=Reset Password')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('button:has-text("Send Reset Link")')).toBeVisible();
    
    // Test email validation
    await page.click('button:has-text("Send Reset Link")');
    await expect(page.locator('text=Email is required')).toBeVisible();
    
    // Submit valid email
    await page.fill('input[name="email"]', 'admin@halalextra.com');
    await page.click('button:has-text("Send Reset Link")');
    
    // Should show success message
    await expect(page.locator('text=Password reset link sent to your email')).toBeVisible();
    
    // Should have link to return to login
    await expect(page.locator('text=Back to Login')).toBeVisible();
    await page.click('text=Back to Login');
    await expect(page).toHaveURL('/login');
  });

  test('should redirect to intended page after login', async ({ page }) => {
    // Try to access protected page while not logged in
    await page.goto('/admin/applications');
    
    // Should redirect to login with return URL
    await expect(page).toHaveURL('/login?returnUrl=%2Fadmin%2Fapplications');
    
    // Login
    await page.click('[data-testid="role-selector"]');
    await page.click('text=Admin');
    await page.fill('input[name="email"]', 'admin@halalextra.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Should redirect to originally requested page
    await expect(page).toHaveURL('/admin/applications');
  });
});