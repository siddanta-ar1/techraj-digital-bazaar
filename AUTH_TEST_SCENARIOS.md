# 🧪 AUTH TEST SCENARIOS - COMPREHENSIVE TESTING GUIDE

## **CRITICAL TEST CASES**

### 1. **NEW TAB SCENARIOS** ✅
- [ ] Open dashboard in new tab (authenticated user)
- [ ] Open dashboard in new tab (unauthenticated user)  
- [ ] Open dashboard in new tab (expired session)
- [ ] Switch between tabs with different auth states

**Expected Behavior:**
- Authenticated: Instant dashboard load (no "Verifying session...")
- Unauthenticated: Instant redirect to `/login`
- Expired: Clean redirect to login with session cleanup

### 2. **HARD REFRESH SCENARIOS** ✅
- [ ] Refresh dashboard page (valid session)
- [ ] Refresh dashboard page (invalid session)
- [ ] Refresh login page (authenticated user)
- [ ] Refresh any protected page

**Expected Behavior:**
- Valid session: Dashboard loads immediately
- Invalid session: Redirect to login immediately  
- No infinite loading loops

### 3. **LOGIN → DASHBOARD FLOW** ✅
- [ ] Email/password login → dashboard
- [ ] Google OAuth login → dashboard
- [ ] Login with `?redirect=/dashboard/orders` parameter
- [ ] Failed login attempt
- [ ] Login while already authenticated

**Expected Behavior:**
- Successful login: Direct redirect to dashboard (or redirect target)
- Failed login: Stay on login with error message
- Already authenticated: Redirect to dashboard

### 4. **SESSION EXPIRY SCENARIOS** ✅
- [ ] Token expires while using app
- [ ] Refresh token expires
- [ ] Manual session invalidation
- [ ] Network interruption during auth

**Expected Behavior:**
- Graceful logout and redirect to login
- No infinite loops or loading states
- Clean session cleanup

### 5. **LOGOUT SCENARIOS** ✅
- [ ] Manual logout from dashboard
- [ ] Logout and try to access protected route
- [ ] Multiple tab logout synchronization

**Expected Behavior:**
- Complete session cleanup
- Redirect to login page
- All tabs sync logout state

---

## **TESTING CHECKLIST**

### ✅ **BASIC AUTH FLOW**
```
1. Visit /dashboard (not logged in)
   → Should redirect to /login immediately

2. Login with valid credentials
   → Should redirect to /dashboard immediately
   → No "Verifying session..." screen

3. Refresh dashboard
   → Should load dashboard immediately
   → No auth loading screen

4. Logout
   → Should redirect to /login
   → Cannot access /dashboard without login
```

### ✅ **EDGE CASES**
```
1. Open multiple tabs
   → All tabs should sync auth state
   → No conflicts between tabs

2. Network interruption
   → App should handle auth gracefully
   → No infinite loading states

3. Invalid/expired tokens
   → Clean logout and redirect
   → No console errors

4. OAuth callback errors
   → Proper error messages
   → Redirect back to login
```

### ✅ **PERFORMANCE**
```
1. Dashboard load time (authenticated)
   → Should be < 500ms to show content

2. Login redirect time
   → Should be instant (< 100ms)

3. No duplicate API calls
   → Check network tab for redundant requests

4. No memory leaks
   → Auth listeners properly cleaned up
```

---

## **HOW TO TEST**

### **Manual Testing Steps:**

1. **Start Fresh:**
   ```bash
   # Clear all browser data for the app
   - Open Developer Tools
   - Application tab → Storage → Clear site data
   ```

2. **Test Unauthenticated Access:**
   ```bash
   # Go to dashboard without login
   http://localhost:3000/dashboard
   
   # Should immediately redirect to:
   http://localhost:3000/login
   ```

3. **Test Login Flow:**
   ```bash
   # Login with test credentials
   # Should redirect to dashboard immediately
   # No "Verifying session..." screen
   ```

4. **Test New Tab:**
   ```bash
   # Open new tab while logged in
   # Go to /dashboard
   # Should load immediately (no loading screen)
   ```

5. **Test Session Persistence:**
   ```bash
   # Refresh the page
   # Close and reopen browser
   # Dashboard should load without re-authentication
   ```

---

## **DEBUGGING GUIDE**

### **If "Verifying session..." appears:**
1. Check browser console for errors
2. Check Network tab for duplicate requests
3. Verify middleware is working (should redirect before client loads)
4. Check server vs client session mismatch

### **If infinite redirects occur:**
1. Check middleware logic
2. Verify session validation in server components
3. Check cookie settings and domain

### **If auth state is inconsistent:**
1. Check AuthProvider initialization
2. Verify Supabase client configuration
3. Check listener cleanup in useEffect

---

## **SUCCESS CRITERIA**

✅ **Zero infinite loading states**
✅ **Zero redirect loops**  
✅ **Zero "Verifying session..." screens**
✅ **Instant auth decisions** (< 100ms)
✅ **Cross-tab synchronization**
✅ **Clean error handling**
✅ **Proper session cleanup**

---

## **PRODUCTION READINESS CHECKLIST**

- [ ] All test scenarios pass
- [ ] No console errors in production
- [ ] Performance metrics meet targets
- [ ] Error monitoring configured
- [ ] Session security properly implemented
- [ ] HTTPS enforced for auth cookies
- [ ] Rate limiting on auth endpoints
- [ ] Proper error messages for users

---

**Remember:** A production-ready auth system should be **boring** - it should work so reliably that users never think about it.