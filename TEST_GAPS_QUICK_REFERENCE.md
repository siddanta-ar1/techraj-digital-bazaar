# 🎯 Quick Reference - Test Gaps Checklist

## 📊 At-a-Glance Summary

| # | Feature Area | Test Count | Priority | Performance Critical | Status |
|---|---|---|---|---|---|
| 1 | Authentication Flows | 10 | 🔴 CRITICAL | ✅ Yes | ⚪ Not Started |
| 2 | Checkout & Orders | 15 | 🔴 CRITICAL | ✅ Yes | ⚪ Not Started |
| 3 | Cart Operations | 10 | 🟠 HIGH | ✅ Yes | ⚪ Not Started |
| 4 | Promo Code Validation | 10 | 🟠 HIGH | ✅ Yes | ⚪ Not Started |
| 5 | Product Browsing | 8 | 🟡 MEDIUM | ✅ Yes | ⚪ Not Started |
| 6 | Wallet & Topup | 10 | 🟠 HIGH | ✅ Yes | ⚪ Not Started |
| 7 | Admin Orders | 8 | 🟠 HIGH | ❌ No | ⚪ Not Started |
| 8 | Admin Products | 10 | 🟡 MEDIUM | ❌ No | ⚪ Not Started |
| 9 | Admin Categories | 6 | 🟡 MEDIUM | ❌ No | ⚪ Not Started |
| 10 | Admin Promos | 4 | 🟡 MEDIUM | ❌ No | ⚪ Not Started |
| 11 | Admin Users | 6 | 🟡 MEDIUM | ❌ No | ⚪ Not Started |
| 12 | Admin Dashboard | 5 | 🟡 MEDIUM | ❌ No | ⚪ Not Started |
| 13 | Admin Settings | 4 | 🟢 LOW | ❌ No | ⚪ Not Started |
| 14 | Refund System | 6 | 🟡 MEDIUM | ❌ No | ⚪ Not Started |
| 15 | User Dashboard | 8 | 🟡 MEDIUM | ❌ No | ⚪ Not Started |
| 16 | File Uploads | 6 | 🟡 MEDIUM | ✅ Yes | ⚪ Not Started |
| 17 | Email Notifications | 8 | 🟡 MEDIUM | ❌ No | ⚪ Not Started |
| 18 | Error Handling | 10 | 🟠 HIGH | ✅ Yes | ⚪ Not Started |
| 19 | Responsive Design | 8 | 🟡 MEDIUM | ❌ No | ⚪ Not Started |
| 20 | Accessibility (A11Y) | 6 | 🟡 MEDIUM | ❌ No | ⚪ Not Started |
| | **TOTALS** | **172+ Tests** | | **8 Critical** | |

---

## 🔥 Top 10 High-Impact Test Areas (Start Here)

### Tier 1: MUST TEST FIRST (Do these in first 2 weeks)
1. ✅ **Login + Dashboard load** - 5 tests
2. ✅ **Checkout complete flow** - 8 tests
3. ✅ **Cart add/remove/update** - 6 tests
4. ✅ **Promo code application** - 5 tests
5. ✅ **Wallet payment path** - 4 tests

### Tier 2: CRITICAL NEXT (Weeks 3-4)
6. **Admin order management** - 8 tests
7. **Product filtering & search** - 6 tests
8. **Payment screenshot upload** - 4 tests
9. **Session persistence** - 3 tests
10. **Error handling** - 6 tests

---

## 🐛 Known Bug Verification Tests

These are bugs that are documented as "fixed" but need test coverage to prevent regression:

- [ ] **NaN in Categories Form** 
  - Verify sort_order never becomes NaN
  - Test null → 0 default conversion

- [ ] **CSV Export Buttons**
  - Test orders CSV export
  - Test users CSV export
  - Verify file format and download

- [ ] **Order Stats Icons**
  - Test ShoppingBag, Clock, Package, CheckCircle icons render
  - Test hover effects

- [ ] **Auth Infinite Loop**
  - Session verification completes < 100ms
  - No "Verifying session..." infinite loop
  - New tab loads dashboard instantly

- [ ] **Auth Race Conditions**
  - Concurrent login attempts handled
  - useEffect cleanup prevents memory leaks

- [ ] **Server Auth Protection**
  - Dashboard server-side redirect works
  - No client-side loading on protected routes

---

## 🎯 API Endpoints Requiring Tests

### Auth APIs
- POST `/api/auth/signup` 
- POST `/api/auth/login`
- POST `/api/auth/logout`
- POST `/api/auth/refresh-token`

### Product APIs
- GET `/api/products` (with filters, search, pagination)
- GET `/api/products/[slug]`
- GET `/api/categories`

### Cart & Checkout APIs
- POST `/api/orders/create`
- POST `/api/promo/validate`
- POST `/api/upload/payment-screenshot`

### Wallet APIs
- POST `/api/wallet/topup`
- GET `/api/wallet/transactions`
- GET `/api/wallet/topup` (user requests)

### Admin APIs
- GET `/api/admin/orders` (with filters)
- PATCH `/api/admin/orders` (status update)
- GET `/api/admin/wallet/topup-requests`
- POST `/api/admin/wallet/topup-requests`
- GET `/api/settings/payment`

### Payment Settings API
- GET `/api/settings/payment`

---

## 📈 Performance Targets by Feature

| Feature | Metric | Target | Status |
|---|---|---|---|
| Auth | Initialization time | < 100ms | ⚪ |
| Dashboard | Page load | < 1.5s | ⚪ |
| Products | API response | < 800ms | ⚪ |
| Checkout | Form submit → success | < 2s | ⚪ |
| Promo | Validation API | < 500ms | ⚪ |
| File Upload | Payment screenshot | < 3s | ⚪ |
| Wallet | Balance update | < 500ms | ⚪ |
| CSV Export | Generate & download | < 2s | ⚪ |
| Search | Product search API | < 600ms | ⚪ |
| Admin Orders | List API response | < 1s | ⚪ |

---

## 🏗️ Recommended Test Structure

```
playwright.config.ts          # Main config
tests/
├── fixtures/                 # Custom fixtures
│   ├── auth.fixture.ts       # Auth helpers
│   ├── db.fixture.ts         # DB setup/teardown
│   └── data.fixture.ts       # Test data generators
├── helpers/                  # Utility functions
│   ├── login.helper.ts
│   ├── checkout.helper.ts
│   └── assertions.helper.ts
├── e2e/                      # End-to-end tests
│   ├── 01-auth/             # Run first
│   ├── 02-shop/             # Run after auth
│   ├── 03-admin/            # Run last
│   └── 04-edge-cases/
├── api/                      # API tests
│   ├── auth.spec.ts
│   ├── orders.spec.ts
│   └── wallet.spec.ts
├── performance/              # Performance tests
│   ├── page-load.spec.ts
│   ├── api-response.spec.ts
│   └── load-test.spec.ts
└── visual/                   # Visual regression tests
    └── ui-consistency.spec.ts
```

---

## 🚨 Critical Paths to Automate

These user journeys MUST have test automation:

### Path 1: Guest → Login → Dashboard
```
1. User visits /login
2. Enters credentials
3. Clicks submit
4. Redirected to /dashboard
5. Dashboard loads instantly (< 1s)
6. Wallet balance displays
```

### Path 2: Browse → Cart → Checkout → Order Success
```
1. User browses /products
2. Filters or searches
3. Views product details
4. Adds to cart
5. Views /cart
6. Proceeds to /checkout
7. Fills delivery details
8. Selects payment method
9. Submits order
10. Redirected to /order-success
11. Order appears in dashboard
```

### Path 3: Apply Promo → Verify Discount → Pay
```
1. User in checkout with cart
2. Enters promo code
3. Code validated (< 500ms)
4. Discount appears
5. Final amount updates
6. Payment submits correctly
7. Order created with discount
```

### Path 4: Admin Login → Manage Orders → Export CSV
```
1. Admin logs in
2. Navigates to /admin/orders
3. Filters orders by status
4. Searches for specific order
5. Updates order status
6. Exports as CSV
7. Downloads file
```

---

## 📋 Test Data Requirements

### Users
- Regular user (with wallet balance)
- Admin user
- User with no wallet balance
- User with pending topup request

### Products
- Featured products
- Products with variants
- Products with options (PPOM)
- Products with inventory codes
- Out of stock products

### Orders
- Pending orders
- Processing orders
- Completed orders
- Orders with promo codes
- Orders with inventory codes

### Promo Codes
- Valid percentage discount
- Valid flat discount
- Expired promo
- Exhausted usage limit
- Inventory codes (gift cards)

---

## ✅ Definition of Done for Tests

A test suite is complete when:
- [ ] All 172+ test cases defined in PLAYWRIGHT_TEST_GAPS_ANALYSIS.md have tests
- [ ] All critical APIs have endpoint tests
- [ ] All known bugs have regression tests
- [ ] Performance targets verified for each feature
- [ ] Responsive design tested on mobile/tablet/desktop
- [ ] Error scenarios tested and handled gracefully
- [ ] CI/CD integration complete
- [ ] Test documentation updated
- [ ] Code coverage ≥ 80% for critical paths
- [ ] All tests pass consistently (no flaky tests)

---

## 🔄 Test Execution Order

**Why order matters:** Tests should follow the dependency chain

1. **Auth tests first** (other tests depend on login)
2. **Product tests next** (needed for cart)
3. **Cart tests** (needed for checkout)
4. **Checkout tests** (transaction tests)
5. **Promo tests** (integrated with checkout)
6. **Admin tests** (isolated, no dependencies)
7. **Performance tests** (verify optimizations)

---

**Total Estimated Test Count**: 172+ tests  
**Estimated Coverage Time**: 4-6 weeks with 1 developer  
**Recommended Team Size**: 2 engineers (1 full-time test automation, 1 part-time)

