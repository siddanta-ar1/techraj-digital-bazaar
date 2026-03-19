# 🎯 QUICK START GUIDE - Phase 1 Authentication Tests

**Last Updated**: March 19, 2026  
**Status**: ✅ All tests ready to run

---

## ⚡ Quick Start (3 Commands)

```bash
# 1. Start dev server (keep running)
npm run dev

# 2. Run tests in another terminal
npx playwright test tests/e2e/01-auth/

# 3. View results
npx playwright show-report
```

That's it! All 48 tests will run across 4 browsers. ✅

---

## 📋 Command Cheat Sheet

### Essential Commands

```bash
# List all tests that will run
npx playwright test tests/e2e/01-auth/ --list

# Run all tests
npx playwright test tests/e2e/01-auth/

# Run only chromium (fast)
npx playwright test tests/e2e/01-auth/ --project=chromium

# Run specific test by name
npx playwright test -g "Successful login"

# View test report
npx playwright show-report
```

### Development Commands

```bash
# Interactive UI (click to run tests)
npx playwright test --ui

# Watch mode (re-run on file changes)
npx playwright test --watch

# Headed mode (see browser)
npx playwright test --headed

# Debug mode (step through)
npx playwright test --debug

# Record traces (for debugging)
npx playwright test --trace on
```

### Advanced Commands

```bash
# Single threaded (if tests interfere)
npx playwright test --workers=1

# Retry failed tests
npx playwright test --retries 2

# Timeout (in ms)
npx playwright test --timeout 60000

# Verbose output
npx playwright test --reporter=list

# JSON output
npx playwright test --reporter=json

# XML output (for CI)
npx playwright test --reporter=junit
```

---

## 🧪 What Gets Tested

### Authentication Tests (10)
```
1. ✅ Successful login with valid credentials
2. ✅ Login fails with invalid credentials
3. ✅ Session persists after page refresh
4. ✅ Hard refresh (Ctrl+R) maintains session
5. ✅ Dashboard loads instantly (< 1.5s)
6. ⭐ No infinite "Verifying session..." loop
7. ✅ New tab loads instantly
8. ✅ Concurrent tabs stay synchronized
9. ✅ Invalid/expired session redirects
10. ⭐ No race conditions with concurrent auth
```

### Performance Tests (2)
```
📈 Auth initialization < 100ms
📈 Complete login flow < 3 seconds
```

### Browsers Tested (4)
```
🔷 Chromium
🔶 Firefox
🔳 WebKit
📱 Mobile Chrome
```

**Total: 48 test instances** (12 tests × 4 browsers)

---

## ✅ Pre-Flight Checklist

Before running tests:

- [ ] Node.js installed: `node --version`
- [ ] npm installed: `npm --version`
- [ ] Playwright installed: `npm install -D @playwright/test`
- [ ] Dev dependencies installed: `npm install` (or already done)
- [ ] Supabase .env.local configured
- [ ] Test users exist in Supabase:
  - `user@example.com` / `password123`
  - `admin@example.com` / `adminpass123`

---

## 🚀 Three Ways to Run

### Method 1: Run All Tests (Recommended)
```bash
npm run dev              # Terminal 1
npx playwright test      # Terminal 2 - runs all browser tests
```

### Method 2: Fast Single Browser
```bash
npm run dev                                          # Terminal 1
npx playwright test tests/e2e/01-auth/ --project=chromium  # Terminal 2
```

### Method 3: Interactive UI
```bash
npm run dev                              # Terminal 1
npx playwright test --ui                 # Terminal 2 - click to run
```

---

## 📊 Expected Results

### Success Output
```
✓ 1. Successful login with valid credentials (2.3s)
✓ 2. Login fails with invalid credentials (1.8s)
✓ 3. Session persists after page refresh (2.1s)
✓ 4. Hard refresh (Ctrl+R) on dashboard (2.0s)
✓ 5. Dashboard loads instantly < 1.5s (0.8s) ✅
✓ 6. No infinite "Verifying session..." loop (1.2s) ⭐
✓ 7. New tab with authenticated user (1.5s)
✓ 8. Concurrent tabs stay synchronized (3.2s)
✓ 9. Invalid/expired session redirects (1.9s)
✓ 10. No race conditions with concurrent auth (2.8s) ⭐
✓ performance: Auth initialization < 100ms (0.05s) 📈
✓ performance: Complete login flow < 3 seconds (2.1s) 📈

 12 passed (25.7s)
```

### Test Report
```
playwright-report/
├── index.html       ← Open this in browser!
├── data.json
└── index.js
```

---

## 🔧 Troubleshooting

### "Cannot find module '@playwright/test'"
```bash
npm install -D @playwright/test
```

### "Cannot connect to localhost:3000"
```bash
# Make sure dev server is running in Terminal 1
npm run dev
# Wait for: "Ready in X.XXs"
```

### "Tests fail with login error"
```
Check:
1. Supabase credentials in .env.local
2. Test users exist in Supabase database
3. Database is accessible
```

### "Tests timeout"
```bash
# Increase timeout
npx playwright test --timeout 60000
```

### "Only run 1 test at a time to be safe"
```bash
npx playwright test --workers=1
```

---

## 📁 Test File Locations

```
/home/mac/techraj-digital-bazaar/
├── tests/e2e/01-auth/
│   └── auth.spec.ts          ← Main test file
├── tests/helpers/
│   └── auth.helper.ts        ← Helper functions
├── tests/fixtures/
│   ├── auth.fixture.ts       ← Test fixtures
│   └── test-data.ts          ← Test data generators
├── tests/README.md           ← Detailed guide
├── playwright.config.ts      ← Configuration
└── [Results after running]
    ├── playwright-report/    ← HTML results
    └── test-results/         ← XML results
```

---

## 📚 Documentation

**In This Project:**
- [tests/README.md](tests/README.md) - Full setup guide
- [PHASE_1_AUTH_TESTS_COMPLETE.md](PHASE_1_AUTH_TESTS_COMPLETE.md) - What was built
- [TEST_EXECUTION_REPORT.md](TEST_EXECUTION_REPORT.md) - How to run
- [PHASE_1_SELF_TEST_VALIDATION.md](PHASE_1_SELF_TEST_VALIDATION.md) - Validation proof
- [PHASE_1_FINAL_SUMMARY.md](PHASE_1_FINAL_SUMMARY.md) - Complete summary

**External:**
- [Playwright Docs](https://playwright.dev)
- [TypeScript Guide](https://playwright.dev/docs/test-typescript)

---

## 💡 Pro Tips

### Tip 1: Debug Failed Tests
```bash
npx playwright test --debug
# Step through test in inspector
```

### Tip 2: See Browser Actions
```bash
npx playwright test --headed
# Watch browser open and interact
```

### Tip 3: Run One Test
```bash
npx playwright test -g "Successful login"
# Just run tests matching this name
```

### Tip 4: Keep Report Open
```bash
npx playwright show-report
# View detailed results with screenshots
```

### Tip 5: Record Session
```bash
npx playwright test --trace on
# Capture full interaction trace
npx playwright show-trace trace-file-path
```

---

## 🎯 Daily Workflow

```bash
# Terminal 1: Keep running (one time)
npm run dev

# Terminal 2: During development
npx playwright test -g "Successful login"   # Run one test
npx playwright test --ui                     # Interactive mode
npx playwright test                          # Run all tests

# When done, view results
npx playwright show-report
```

---

## ✨ What You'll See

### Console Output
```
Running 12 tests using 1 worker

[chromium] › e2e/01-auth/auth.spec.ts › Authentication - Complete Test Suite › 1. Successful login with valid credentials
  ✓ [chromium] › e2e/01-auth/auth.spec.ts › Authentication - Complete Test Suite › 1. Successful login with valid credentials (2.3s)
```

### HTML Report
- Interactive test results
- Screenshot of each step
- Video of failed tests (optional)
- Performance metrics
- Test timing details

---

## 🎉 Success Criteria

✅ All commands work without errors  
✅ 48 tests discovered  
✅ 48 tests pass  
✅ HTML report generates  
✅ No "Verifying session" infinite loops  
✅ No race condition errors  
✅ All performance targets met  

---

## 🚀 Next Steps

1. **Run tests**: `npm run dev` then `npx playwright test`
2. **Review results**: `npx playwright show-report`
3. **All pass?** Move to Phase 2 (Checkout Tests)
4. **Any fails?** See Troubleshooting section above

---

## 📞 Quick Help

| Issue | Solution |
|-------|----------|
| Can't find tests | Make sure in `/home/mac/techraj-digital-bazaar` directory |
| Dev server won't start | Check port 3000 not in use: `lsof -i :3000` |
| Login tests fail | Verify test users in Supabase |
| Timeout errors | Check CPU/RAM, or increase timeout |
| Report not generated | Run: `npx playwright show-report` |
| Need to restart | Kill server with Ctrl+C, then `npm run dev` again |

---

## ✅ One-Minute Setup

```bash
# 1. Copy & paste this entire block:
cd /home/mac/techraj-digital-bazaar
npm install -D @playwright/test

# 2. Terminal 1: Run and leave open
npm run dev

# 3. Terminal 2: Run tests
npx playwright test tests/e2e/01-auth/

# 4. View results
npx playwright show-report
```

**That's it! Tests will run and you'll see the report. 🎉**

---

**Ready? Run the tests now! 🚀**

