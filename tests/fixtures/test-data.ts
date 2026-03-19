/**
 * Test Data Generators
 */

export function generateTestUser() {
  const timestamp = Date.now();
  return {
    email: `test-user-${timestamp}@example.com`,
    password: 'TestPassword123!@#',
    fullName: `Test User ${timestamp}`,
    phone: `+977984${Math.floor(Math.random() * 10000000)}`,
  };
}

export function generateTestPromoCode() {
  return {
    code: `TEST${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
    discountPercentage: 10,
    maxUses: 100,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  };
}

export function generateTestProduct() {
  const timestamp = Date.now();
  return {
    name: `Test Product ${timestamp}`,
    slug: `test-product-${timestamp}`,
    description: 'This is a test product for automation testing',
    price: Math.floor(Math.random() * 5000) + 100,
    quantity: Math.floor(Math.random() * 1000) + 10,
  };
}

export function generateTestOrder() {
  return {
    items: [
      {
        productId: 'test-product-1',
        variantId: 'variant-1',
        quantity: Math.floor(Math.random() * 5) + 1,
        price: Math.floor(Math.random() * 5000) + 100,
      },
    ],
    paymentMethod: 'wallet',
    totalAmount: 5000,
    finalAmount: 5000,
    deliveryDetails: {
      contactEmail: 'user@example.com',
      contactPhone: '+9779846908072',
      notes: 'Test order - automation',
    },
  };
}

// Known test user credentials (should exist in test DB)
export const TEST_USERS = {
  REGULAR_USER: {
    email: 'user@example.com',
    password: 'password123',
    name: 'Test User',
  },
  ADMIN_USER: {
    email: 'admin@example.com',
    password: 'adminpass123',
    name: 'Admin User',
  },
  LOW_BALANCE_USER: {
    email: 'lowbalance@example.com',
    password: 'password123',
    name: 'Low Balance User',
    walletBalance: 100,
  },
  HIGH_BALANCE_USER: {
    email: 'highbalance@example.com',
    password: 'password123',
    name: 'High Balance User',
    walletBalance: 50000,
  },
};

// Promo codes for testing
export const TEST_PROMO_CODES = {
  VALID: 'SAVE10',
  EXPIRED: 'EXPIRED2020',
  EXHAUSTED: 'MAXUSED',
  INACTIVE: 'INACTIVE123',
};
