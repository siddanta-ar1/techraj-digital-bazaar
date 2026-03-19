# 📝 Playwright Test Examples & Templates

This document provides code templates and examples for implementing tests for the identified gaps.

---

## 🔧 Setup & Configuration

### playwright.config.ts Template

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  fullyParallel: false, // Disable parallel for auth tests
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 1, // Sequential for stable auth tests
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
```

---

## 🔐 AUTHENTICATION TESTS

### Example 1: Login Flow Test

```typescript
// tests/e2e/01-auth/login.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication - Login Flow', () => {
  test('successful login with valid credentials', async ({ page }) => {
    // Navigate to login
    await page.goto('/login');
    
    // Fill form
    await page.fill('input[type="email"]', 'user@example.com');
    await page.fill('input[type="password"]', 'password123');
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Wait for navigation and verify
    await page.waitForURL('/dashboard');
    expect(page.url()).toContain('/dashboard');
    
    // Verify user info displays
    await expect(page.locator('text=Welcome')).toBeVisible();
  });

  test('login fails with invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrongpass');
    
    await page.click('button[type="submit"]');
    
    // Error message should appear
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
    
    // Should stay on login page
    expect(page.url()).toContain('/login');
  });

  test('dashboard loads instantly (< 1s) with valid session', async ({ page, context }) => {
    // Set session cookie (simulating existing login)
    const sessionToken = 'valid-token-123';
    await context.addCookies([{
      name: 'session',
      value: sessionToken,
      url: 'http://localhost:3000'
    }]);
    
    // Measure load time
    const startTime = Date.now();
    await page.goto('/dashboard');
    const loadTime = Date.now() - startTime;
    
    // Should load in < 1 second
    expect(loadTime).toBeLessThan(1000);
    
    // Verify dashboard displays
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('no infinite "Verifying session..." loop', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/dashboard');
    
    // Wait for either dashboard load or redirect
    await Promise.race([
      page.waitForURL('/dashboard'),
      page.waitForURL('/login'),
      new Promise(resolve => setTimeout(resolve, 3000)) // 3s timeout
    ]);
    
    const duration = Date.now() - startTime;
    
    // Should complete auth check in < 2 seconds
    expect(duration).toBeLessThan(2000);
    
    // Should not see "Verifying session..." text for more than 1 second
    const verifyingText = page.locator('text=Verifying session');
    if (await verifyingText.isVisible()) {
      await page.waitForFunction(
        () => {
          const elem = document.body.textContent;
          return !elem?.includes('Verifying session...');
        },
        { timeout: 1000 }
      );
    }
  });

  test('session persists after page refresh', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'user@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await page.waitForURL('/dashboard');
    await expect(page.locator('text=Welcome')).toBeVisible();
    
    // Refresh page
    await page.reload();
    
    // Should stay on dashboard (not redirect to login)
    expect(page.url()).toContain('/dashboard');
    await expect(page.locator('text=Welcome')).toBeVisible();
  });

  test('new tab with authenticated user loads instantly', async ({ browser }) => {
    // First tab: login
    const context = await browser.newContext();
    const page1 = await context.newPage();
    
    await page1.goto('/login');
    await page1.fill('input[type="email"]', 'user@example.com');
    await page1.fill('input[type="password"]', 'password123');
    await page1.click('button[type="submit"]');
    await page1.waitForURL('/dashboard');
    
    // Second tab: open dashboard in new tab (shares context/cookies)
    const page2 = await context.newPage();
    
    const startTime = Date.now();
    await page2.goto('/dashboard');
    const loadTime = Date.now() - startTime;
    
    // Should load instantly (< 500ms for fresh tab)
    expect(loadTime).toBeLessThan(500);
    
    // Should display dashboard content immediately
    await expect(page2.locator('text=Dashboard')).toBeVisible();
    
    await context.close();
  });
});
```

---

## 🛒 CHECKOUT TESTS

### Example 2: Complete Checkout Flow

```typescript
// tests/e2e/02-shop/checkout.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Checkout - Complete Order Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'user@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    // Add item to cart
    await page.goto('/products');
    await page.click('button:has-text("Add to Cart"):first-of-type');
    
    // Verify item added
    const cartBadge = page.locator('[data-testid="cart-count"]');
    await expect(cartBadge).toContainText('1');
  });

  test('complete checkout with wallet payment', async ({ page }) => {
    // Navigate to checkout
    await page.goto('/checkout');
    
    // Fill delivery details
    await page.fill('input[name="contactEmail"]', 'user@example.com');
    await page.fill('input[name="contactPhone"]', '+9779846908072');
    await page.fill('textarea[name="additionalNotes"]', 'Please deliver in morning');
    
    // Select wallet payment
    await page.click('text=Wallet Payment');
    
    // Verify total amount
    const totalAmount = await page.locator('[data-testid="total-amount"]').textContent();
    expect(totalAmount).toMatch(/Rs\./);
    
    // Submit order
    await page.click('button:has-text("Place Order")');
    
    // Wait for success page
    await page.waitForURL(/\/order-success/);
    
    // Verify success message
    await expect(page.locator('text=Order Placed Successfully')).toBeVisible();
    
    // Verify order number displays
    const orderNumber = page.locator('[data-testid="order-number"]');
    await expect(orderNumber).toBeVisible();
  });

  test('checkout fails with insufficient wallet balance', async ({ page }) => {
    // Mock insufficient balance scenario
    // (In real test, ensure test user has low balance)
    
    await page.goto('/checkout');
    
    // Fill delivery details
    await page.fill('input[name="contactEmail"]', 'user@example.com');
    await page.fill('input[name="contactPhone"]', '+9779846908072');
    
    // Select wallet payment
    await page.click('text=Wallet Payment');
    
    // Submit button should be disabled
    const submitButton = page.locator('button:has-text("Place Order")');
    await expect(submitButton).toBeDisabled();
  });

  test('checkout with manual payment (bank transfer)', async ({ page }) => {
    await page.goto('/checkout');
    
    // Fill delivery details
    await page.fill('input[name="contactEmail"]', 'user@example.com');
    await page.fill('input[name="contactPhone"]', '+9779846908072');
    
    // Select bank transfer
    await page.click('text=Bank Transfer');
    
    // Fill manual payment details
    await page.fill('input[name="transactionId"]', 'TXN123456');
    await page.fill('input[name="manualAmountPaid"]', '5000');
    
    // Upload payment screenshot
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/payment-screenshot.png');
    
    // Wait for upload to complete
    await page.waitForFunction(() => {
      const preview = document.querySelector('[data-testid="screenshot-preview"]');
      return preview !== null;
    });
    
    // Submit order
    await page.click('button:has-text("Pay Rs.")');
    
    // Wait for success
    await page.waitForURL(/\/order-success/);
    await expect(page.locator('text=Order Placed Successfully')).toBeVisible();
  });

  test('form validation for empty fields', async ({ page }) => {
    await page.goto('/checkout');
    
    // Try to submit without filling form
    await page.click('button:has-text("Place Order")');
    
    // Error messages should appear
    await expect(page.locator('text=Email is required')).toBeVisible();
    await expect(page.locator('text=Phone is required')).toBeVisible();
  });

  test('checkout page loads in < 1.5 seconds', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/checkout');
    
    // Wait for form to be interactive
    await page.waitForSelector('input[name="contactEmail"]');
    
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(1500);
  });
});
```

---

## 🎟️ PROMO CODE TESTS

### Example 3: Promo Code Validation

```typescript
// tests/e2e/02-shop/promo.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Promo Code - Validation & Application', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to checkout with cart
    await page.goto('/login');
    await page.fill('input[type="email"]', 'user@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    // Add item to cart and go to checkout
    await page.goto('/products');
    await page.click('button:has-text("Add to Cart"):first-of-type');
    await page.goto('/checkout');
  });

  test('apply valid percentage promo code', async ({ page }) => {
    // Measure original price
    const originalTotal = await page.locator('[data-testid="original-total"]')
      .textContent()
      .then(t => parseFloat(t?.replace('Rs. ', '') || '0'));
    
    // Enter promo code
    await page.fill('input[name="promoCode"]', 'SAVE10');
    await page.click('button:has-text("Apply")');
    
    // Wait for validation
    await page.waitForTimeout(500);
    
    // Discount should appear
    await expect(page.locator('text=Discount')).toBeVisible();
    
    // New total should be less
    const newTotal = await page.locator('[data-testid="final-total"]')
      .textContent()
      .then(t => parseFloat(t?.replace('Rs. ', '') || '0'));
    
    expect(newTotal).toBeLessThan(originalTotal);
    
    // Verify discount percentage applied
    const discountText = await page.locator('[data-testid="discount-amount"]')
      .textContent();
    expect(discountText).toMatch(/Rs\./);
  });

  test('invalid promo code shows error', async ({ page }) => {
    await page.fill('input[name="promoCode"]', 'INVALID123');
    await page.click('button:has-text("Apply")');
    
    // Error message should appear
    await expect(page.locator('text=Invalid promo code')).toBeVisible();
    
    // Discount should not be applied
    const discountSection = page.locator('[data-testid="discount-section"]');
    await expect(discountSection).not.toBeVisible();
  });

  test('expired promo code rejected', async ({ page }) => {
    // Use a promo code that expired
    await page.fill('input[name="promoCode"]', 'EXPIRED2020');
    await page.click('button:has-text("Apply")');
    
    // Should show expiry error
    await expect(page.locator('text=Promo code has expired')).toBeVisible();
  });

  test('promo code with usage limit', async ({ page }) => {
    // First application should work
    await page.fill('input[name="promoCode"]', 'LIMITED5');
    await page.click('button:has-text("Apply")');
    
    // Should apply successfully
    await expect(page.locator('text=Discount')).toBeVisible();
    
    // (In integration test, would need to check if limit is exhausted)
  });

  test('promo validation responds in < 500ms', async ({ page }) => {
    // Intercept API call
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/api/promo/validate') &&
                   response.status() === 200
    );
    
    // Apply promo
    await page.fill('input[name="promoCode"]', 'VALID99');
    
    const startTime = Date.now();
    await page.click('button:has-text("Apply")');
    const response = await responsePromise;
    const responseTime = Date.now() - startTime;
    
    expect(responseTime).toBeLessThan(500);
    expect(response.status()).toBe(200);
  });

  test('inventory code (gift card) applies discount', async ({ page }) => {
    const originalTotal = await page.locator('[data-testid="original-total"]')
      .textContent()
      .then(t => parseFloat(t?.replace('Rs. ', '') || '0'));
    
    // Apply inventory code
    await page.fill('input[name="promoCode"]', 'GIFTCARD123');
    await page.click('button:has-text("Apply")');
    
    // Should apply as inventory code
    await expect(page.locator('text=Gift Card Applied')).toBeVisible();
    
    // Discount should appear
    const newTotal = await page.locator('[data-testid="final-total"]')
      .textContent()
      .then(t => parseFloat(t?.replace('Rs. ', '') || '0'));
    
    expect(newTotal).toBeLessThan(originalTotal);
  });

  test('remove applied promo code', async ({ page }) => {
    // Apply promo
    await page.fill('input[name="promoCode"]', 'SAVE10');
    await page.click('button:has-text("Apply")');
    await expect(page.locator('text=Discount')).toBeVisible();
    
    const discountedTotal = await page.locator('[data-testid="final-total"]')
      .textContent()
      .then(t => parseFloat(t?.replace('Rs. ', '') || '0'));
    
    // Remove promo
    await page.click('button[data-testid="remove-promo"]');
    
    // Discount section should disappear
    await expect(page.locator('[data-testid="discount-section"]')).not.toBeVisible();
    
    // Total should return to original
    const restoredTotal = await page.locator('[data-testid="original-total"]')
      .textContent()
      .then(t => parseFloat(t?.replace('Rs. ', '') || '0'));
    
    expect(restoredTotal).toBeGreaterThan(discountedTotal);
  });
});
```

---

## 💰 WALLET TESTS

### Example 4: Wallet & Topup System

```typescript
// tests/e2e/03-dashboard/wallet.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Wallet - Balance & Topup', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'user@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('display user wallet balance', async ({ page }) => {
    await page.goto('/dashboard/wallet');
    
    // Wallet balance should be visible
    const balanceElement = page.locator('[data-testid="wallet-balance"]');
    await expect(balanceElement).toBeVisible();
    
    // Should match format "Rs. XXXX.XX"
    const balanceText = await balanceElement.textContent();
    expect(balanceText).toMatch(/Rs\. \d+(\.\d{2})?/);
  });

  test('submit topup request with valid amount', async ({ page }) => {
    await page.goto('/dashboard/wallet');
    
    // Click topup button
    await page.click('button:has-text("Request Topup")');
    
    // Fill form
    await page.fill('input[name="amount"]', '5000');
    await page.selectOption('select[name="paymentMethod"]', 'esewa');
    await page.fill('input[name="transactionId"]', 'TXN123456');
    
    // Upload screenshot
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/payment-screenshot.png');
    
    // Submit
    await page.click('button:has-text("Submit Request")');
    
    // Success message
    await expect(page.locator('text=Topup request submitted')).toBeVisible();
  });

  test('topup amount validation', async ({ page }) => {
    await page.goto('/dashboard/wallet');
    await page.click('button:has-text("Request Topup")');
    
    // Amount too low
    await page.fill('input[name="amount"]', '50');
    await page.click('button:has-text("Submit Request")');
    await expect(page.locator('text=Minimum amount')).toBeVisible();
    
    // Amount too high
    await page.fill('input[name="amount"]', '100000');
    await page.click('button:has-text("Submit Request")');
    await expect(page.locator('text=Maximum amount')).toBeVisible();
  });

  test('prevent duplicate pending topup requests', async ({ page }) => {
    await page.goto('/dashboard/wallet');
    
    // Submit first topup
    await page.click('button:has-text("Request Topup")');
    await page.fill('input[name="amount"]', '5000');
    await page.selectOption('select[name="paymentMethod"]', 'esewa');
    await page.fill('input[name="transactionId"]', 'TXN111');
    await page.click('button:has-text("Submit Request")');
    
    // Try to submit second topup
    await page.goto('/dashboard/wallet');
    await page.click('button:has-text("Request Topup")');
    
    // Should show error about pending request
    await expect(page.locator('text=pending top-up request')).toBeVisible();
  });

  test('view topup request history', async ({ page }) => {
    await page.goto('/dashboard/wallet');
    
    // View topup requests
    await page.click('text=Topup History');
    
    // Should display previous topup requests
    const requestsList = page.locator('[data-testid="topup-requests-list"]');
    await expect(requestsList).toBeVisible();
    
    // Each request should show status
    const statusBadges = page.locator('[data-testid="request-status"]');
    expect(await statusBadges.count()).toBeGreaterThan(0);
  });

  test('view transaction history', async ({ page }) => {
    await page.goto('/dashboard/wallet');
    
    // Click on transactions tab
    await page.click('text=Transactions');
    
    // Transaction list should load
    const transactionList = page.locator('[data-testid="transaction-list"]');
    await expect(transactionList).toBeVisible();
    
    // Each transaction should show type, amount, date
    const transactions = page.locator('[data-testid="transaction-item"]');
    expect(await transactions.count()).toBeGreaterThan(0);
  });

  test('wallet balance updates after topup approval', async ({ page, context }) => {
    // Get initial balance
    await page.goto('/dashboard/wallet');
    const initialBalance = await page.locator('[data-testid="wallet-balance"]')
      .textContent()
      .then(t => parseFloat(t?.replace(/Rs\. /, '') || '0'));
    
    // (In real test, admin would approve topup)
    // Simulate balance update via WebSocket or polling
    
    // Reload page
    await page.reload();
    
    // Balance should be updated
    const updatedBalance = await page.locator('[data-testid="wallet-balance"]')
      .textContent()
      .then(t => parseFloat(t?.replace(/Rs\. /, '') || '0'));
    
    expect(updatedBalance).toBeGreaterThan(initialBalance);
  });
});
```

---

## 🔄 PERFORMANCE TESTS

### Example 5: Response Time & Load Testing

```typescript
// tests/performance/api-response-times.spec.ts
import { test, expect } from '@playwright/test';

test.describe('API Performance', () => {
  test('products API responds in < 800ms', async ({ page }) => {
    const startTime = Date.now();
    
    const response = await page.request.get(
      '/api/products?page=1&limit=12'
    );
    
    const responseTime = Date.now() - startTime;
    
    expect(response.status()).toBe(200);
    expect(responseTime).toBeLessThan(800);
  });

  test('promo validation API responds in < 500ms', async ({ page }) => {
    const startTime = Date.now();
    
    const response = await page.request.post(
      '/api/promo/validate',
      {
        data: {
          code: 'SAVE10',
          totalAmount: 5000
        }
      }
    );
    
    const responseTime = Date.now() - startTime;
    
    expect(response.status()).toBe(200);
    expect(responseTime).toBeLessThan(500);
  });

  test('orders API responds in < 1s', async ({ page, context }) => {
    // Set auth headers
    // ...
    
    const startTime = Date.now();
    
    const response = await page.request.get(
      '/api/admin/orders?page=1&limit=10'
    );
    
    const responseTime = Date.now() - startTime;
    
    expect(response.status()).toBe(200);
    expect(responseTime).toBeLessThan(1000);
  });

  test('page load time (dashboard) is < 1.5s', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/dashboard', { waitUntil: 'networkidle' });
    
    const pageLoadTime = Date.now() - startTime;
    
    expect(pageLoadTime).toBeLessThan(1500);
  });
});
```

---

## 📱 RESPONSIVE DESIGN TESTS

### Example 6: Mobile Responsiveness

```typescript
// tests/responsive/mobile.spec.ts
import { test, expect, devices } from '@playwright/test';

test.describe('Responsive Design - Mobile', () => {
  test.use({ ...devices['iPhone 12'] });

  test('cart page responsive on mobile', async ({ page }) => {
    await page.goto('/cart');
    
    // Main elements should be visible
    await expect(page.locator('text=Your Cart')).toBeVisible();
    
    // Cart items should stack vertically
    const cartItems = page.locator('[data-testid="cart-item"]');
    const firstItem = cartItems.first();
    const secondItem = cartItems.nth(1);
    
    // Get bounding boxes
    const firstBox = await firstItem.boundingBox();
    const secondBox = await secondItem.boundingBox();
    
    // Second item should be below first (mobile layout)
    expect(secondBox?.y).toBeGreaterThan(firstBox?.y || 0);
  });

  test('mobile header is accessible', async ({ page }) => {
    await page.goto('/');
    
    // Mobile menu button should be visible
    const menuButton = page.locator('[data-testid="mobile-menu-button"]');
    await expect(menuButton).toBeVisible();
    
    // Click to open
    await menuButton.click();
    
    // Menu should appear
    const menu = page.locator('[data-testid="mobile-menu"]');
    await expect(menu).toBeVisible();
  });

  test('checkout form is usable on mobile', async ({ page }) => {
    // Login and go to checkout
    // ...
    
    await page.goto('/checkout');
    
    // All form inputs should be visible
    const emailInput = page.locator('input[name="contactEmail"]');
    const phoneInput = page.locator('input[name="contactPhone"]');
    
    await expect(emailInput).toBeInViewport();
    await expect(phoneInput).toBeInViewport();
    
    // Buttons should have sufficient size (44px minimum)
    const submitButton = page.locator('button:has-text("Place Order")');
    const box = await submitButton.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
  });
});
```

---

## ✅ CUSTOM FIXTURES & HELPERS

### Helper Functions

```typescript
// tests/helpers/auth.helper.ts
import { Page, expect } from '@playwright/test';

export async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard');
}

export async function logout(page: Page) {
  await page.click('[data-testid="user-menu"]');
  await page.click('text=Logout');
  await page.waitForURL('/login');
}

export async function expectAuthenticated(page: Page) {
  await expect(page.locator('text=Welcome')).toBeVisible();
  expect(page.url()).not.toContain('/login');
}

export async function expectUnauthenticated(page: Page) {
  expect(page.url()).toContain('/login');
}

// tests/helpers/checkout.helper.ts
export async function addToCart(page: Page, productName: string) {
  await page.goto('/products');
  await page.locator(`button:has-text("${productName}")`)
    .locator('.. button:has-text("Add to Cart")')
    .click();
}

export async function proceedToCheckout(page: Page) {
  await page.goto('/cart');
  await page.click('button:has-text("Proceed to Checkout")');
  await page.waitForURL('/checkout');
}

export async function fillCheckoutForm(page: Page, details: {
  email: string;
  phone: string;
  notes?: string;
}) {
  await page.fill('input[name="contactEmail"]', details.email);
  await page.fill('input[name="contactPhone"]', details.phone);
  if (details.notes) {
    await page.fill('textarea[name="additionalNotes"]', details.notes);
  }
}

export async function selectPaymentMethod(page: Page, method: 'wallet' | 'esewa' | 'khalti' | 'bank_transfer') {
  const methodText = {
    'wallet': 'Wallet Payment',
    'esewa': 'eSewa',
    'khalti': 'Khalti',
    'bank_transfer': 'Bank Transfer'
  };
  
  await page.click(`text=${methodText[method]}`);
}

export async function submitOrder(page: Page) {
  await page.click('button:has-text("Place Order")');
  await page.waitForURL(/\/order-success/);
}

// tests/helpers/performance.helper.ts
export async function measureResponseTime(page: Page, url: string, method: string = 'GET') {
  const startTime = Date.now();
  
  const response = method === 'GET' 
    ? await page.request.get(url)
    : await page.request.post(url);
  
  const responseTime = Date.now() - startTime;
  
  return {
    responseTime,
    status: response.status(),
    data: await response.json()
  };
}

export async function measurePageLoadTime(page: Page, url: string) {
  const startTime = Date.now();
  
  await page.goto(url, { waitUntil: 'networkidle' });
  
  const loadTime = Date.now() - startTime;
  
  return loadTime;
}
```

### Test Fixtures

```typescript
// tests/fixtures/auth.fixture.ts
import { test as base } from '@playwright/test';

type AuthFixture = {
  authenticatedPage: Page;
  adminPage: Page;
};

export const test = base.extend<AuthFixture>({
  authenticatedPage: async ({ page }, use) => {
    // Login regular user
    await page.goto('/login');
    await page.fill('input[type="email"]', 'user@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    await use(page);
    
    // Cleanup: logout
    await page.click('[data-testid="user-menu"]');
    await page.click('text=Logout');
  },

  adminPage: async ({ page }, use) => {
    // Login admin user
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'adminpass');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    // Navigate to admin panel
    await page.goto('/admin');
    
    await use(page);
    
    // Cleanup
    await page.click('[data-testid="user-menu"]');
    await page.click('text=Logout');
  }
});

export { expect };
```

---

## 📊 TEST DATA GENERATOR

```typescript
// tests/fixtures/data-generator.ts
export function generateUser() {
  const timestamp = Date.now();
  return {
    email: `test-user-${timestamp}@example.com`,
    password: 'TestPassword123!',
    fullName: `Test User ${timestamp}`,
    phone: `+977984${Math.floor(Math.random() * 10000000)}`
  };
}

export function generatePromoCode() {
  return {
    code: `TEST${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
    discountPercentage: 10,
    maxUses: 100,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  };
}

export function generateProduct() {
  return {
    name: `Test Product ${Date.now()}`,
    slug: `test-product-${Date.now()}`,
    description: 'Test product description',
    price: Math.floor(Math.random() * 5000) + 100,
    quantity: Math.floor(Math.random() * 1000) + 10
  };
}

export function generateOrder() {
  return {
    items: [
      {
        productId: 'test-product-1',
        variantId: 'variant-1',
        quantity: Math.floor(Math.random() * 5) + 1,
        price: Math.floor(Math.random() * 5000) + 100
      }
    ],
    paymentMethod: 'wallet',
    totalAmount: 5000,
    finalAmount: 5000,
    deliveryDetails: {
      contactEmail: 'user@example.com',
      contactPhone: '+9779846908072',
      notes: 'Test order'
    }
  };
}
```

---

This comprehensive guide provides templates for all major test categories. Adapt these examples to your specific application needs and API contracts.

