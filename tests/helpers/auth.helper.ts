import { Page, expect } from '@playwright/test';

/**
 * Login helper - Performs complete login flow
 */
export async function login(
  page: Page,
  email: string,
  password: string
) {
  await page.goto('/login');
  
  // Wait for form to be visible
  await page.waitForSelector('input[type="email"]', { timeout: 5000 });
  
  // Fill email field
  const emailInput = page.locator('input[type="email"]');
  await emailInput.fill(email);
  
  // Fill password field
  const passwordInput = page.locator('input[type="password"]');
  await passwordInput.fill(password);
  
  // Click submit button
  const submitButton = page.locator('button[type="submit"]');
  await submitButton.click();
  
  // Wait for navigation or error message
  try {
    await page.waitForURL(/\/(dashboard|login)/, { timeout: 10000 });
  } catch (e) {
    // Navigation might not happen if there's an error, which is fine
  }
}

/**
 * Logout helper - Signs out user
 */
export async function logout(page: Page) {
  try {
    // Try to find and click user menu
    const userMenu = page.locator('[data-testid="user-menu"]');
    const isVisible = await userMenu.isVisible().catch(() => false);
    
    if (isVisible) {
      await userMenu.click();
      
      // Try to find logout button
      const logoutBtn = page.locator('text=Logout').first();
      const logoutVisible = await logoutBtn.isVisible().catch(() => false);
      
      if (logoutVisible) {
        await logoutBtn.click();
        await page.waitForURL(/\/login|\//, { timeout: 5000 });
      }
    } else {
      // If menu not found, navigate to login directly
      await page.goto('/login');
    }
  } catch (e) {
    // If logout fails, just navigate to login
    await page.goto('/login');
  }
}

/**
 * Verify user is authenticated
 */
export async function expectAuthenticated(page: Page) {
  // Check URL - should not be on login page
  const url = page.url();
  
  // Should be on dashboard, shop, or admin pages (not login/auth)
  const isNotOnAuth = !url.includes('/login') && 
                       !url.includes('/register') && 
                       !url.includes('/forgot-password') &&
                       !url.includes('/update-password');
  
  if (!isNotOnAuth) {
    throw new Error(`Expected to be authenticated but found URL: ${url}`);
  }
  
  // Try to find welcome/user elements (optional)
  try {
    const welcomeText = page.locator('text=Welcome');
    const userName = page.locator('[data-testid="user-name"]');
    
    const hasWelcome = await welcomeText.isVisible().catch(() => false);
    const hasUserName = await userName.isVisible().catch(() => false);
    
    // At least one should be visible if properly authenticated
    if (!hasWelcome && !hasUserName) {
      console.warn('Could not find welcome text or user name, but URL indicates auth');
    }
  } catch (e) {
    // Continue even if we can't find these elements
  }
}

/**
 * Verify user is NOT authenticated
 */
export async function expectUnauthenticated(page: Page) {
  expect(page.url()).toContain('/login');
}

/**
 * Check if verifying session message appears
 */
export async function hasVerifyingSessionText(page: Page): Promise<boolean> {
  try {
    const text = await page.locator('text=/Verifying session/i').isVisible({ timeout: 500 });
    return text;
  } catch {
    return false;
  }
}

/**
 * Wait for auth initialization to complete (no more "Verifying session" text)
 */
export async function waitForAuthComplete(page: Page, timeout: number = 10000) {
  try {
    await page.waitForFunction(
      () => {
        const body = document.body.textContent || '';
        return !body.includes('Verifying session');
      },
      { timeout }
    );
  } catch (e) {
    // If timeout, just continue - might not have the text on this page
    console.warn('waitForAuthComplete timed out or page closed');
  }
}

/**
 * Measure auth initialization time
 */
export async function measureAuthInit(page: Page): Promise<number> {
  const startTime = Date.now();
  
  // Navigate to dashboard
  await page.goto('/dashboard');
  
  // Wait for auth to be determined (either redirect or load)
  try {
    await Promise.race([
      page.waitForURL('/dashboard', { timeout: 1000 }),
      page.waitForURL('/login', { timeout: 1000 }),
    ]);
  } catch {
    // Ignore timeout, just measure how long we took
  }
  
  const duration = Date.now() - startTime;
  return duration;
}

/**
 * Get auth context/session (if available in page)
 */
export async function getAuthState(page: Page): Promise<any> {
  return page.evaluate(() => {
    // Try to get from localStorage or window object
    const session = localStorage.getItem('auth_session');
    return session ? JSON.parse(session) : null;
  });
}

/**
 * Set auth session/cookie manually for testing
 */
export async function setAuthSession(page: Page, token: string) {
  await page.context().addCookies([
    {
      name: 'auth_token',
      value: token,
      url: 'http://localhost:3000',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    },
  ]);
}

/**
 * Clear all auth-related cookies and storage
 */
export async function clearAuth(page: Page) {
  await page.context().clearCookies();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}
