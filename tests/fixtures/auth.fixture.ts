import { test as base, Page } from '@playwright/test';
import { login, logout } from '../helpers/auth.helper';

type AuthFixtures = {
  authenticatedPage: Page;
  adminPage: Page;
};

/**
 * Fixture: Automatically logs in a regular user
 */
export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // Login as regular user
    await login(page, 'user@example.com', 'password123');
    
    // Verify logged in
    await page.waitForURL('/dashboard');
    
    // Pass page to test
    await use(page);
    
    // Cleanup: Logout
    try {
      await logout(page);
    } catch (e) {
      // Logout may fail if page was already navigated, ignore
      console.log('Logout cleanup skipped');
    }
  },

  adminPage: async ({ page }, use) => {
    // Login as admin user
    await login(page, 'admin@example.com', 'adminpass123');
    
    // Verify logged in
    await page.waitForURL('/dashboard');
    
    // Navigate to admin panel
    await page.goto('/admin');
    
    // Pass page to test
    await use(page);
    
    // Cleanup
    try {
      await logout(page);
    } catch (e) {
      console.log('Logout cleanup skipped');
    }
  },
});

export { expect } from '@playwright/test';
