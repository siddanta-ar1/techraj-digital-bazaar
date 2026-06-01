# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev           # Start dev server (BROWSERSLIST env vars are pre-set in the script)
npm run build         # Production build
npm run start         # Start production server
npx tsc --noEmit      # Type-check without emitting files

# Testing (Playwright E2E only — no unit test runner)
npm run test:e2e                                     # All tests
npx playwright test tests/e2e/01-auth/               # Auth suite only
npx playwright test tests/e2e/01-auth/auth.spec.ts -g "Successful login"  # Single test
npx playwright test --ui                             # Interactive UI
npx playwright test --headed                         # Headed mode
npx playwright test --debug                          # Debug mode
npx playwright show-report                           # View HTML report after run
```

E2E tests require a `.env.test` file with `TEST_USER_EMAIL`, `TEST_USER_PASSWORD`, `TEST_ADMIN_EMAIL`, `TEST_ADMIN_PASSWORD`, and `BASE_URL=http://localhost:3000`. Tests run sequentially (not parallel) because they share auth state.

## Architecture Overview

**Next.js 16 App Router** with React 19 and the React Compiler (`babel-plugin-react-compiler`) enabled — memo/useMemo/useCallback are largely unnecessary for new code.

### Route Structure

```
src/app/
├── (auth)/          # Login, register, forgot-password, update-password
├── (shop)/          # Products listing, product detail, cart, checkout, order-success
├── dashboard/       # User orders, wallet, settings
├── admin/           # Full admin panel (products, orders, users, promos, wallet, options)
├── api/             # All API routes
└── page.tsx         # Homepage (server component, parallel data fetches)
```

Admin pages follow a consistent **Server Page + Client Component** split: `page.tsx` fetches initial data server-side and passes it as `initialData` props to a `*Client.tsx` component that owns local state and mutations.

### Two Supabase Clients — Critical Distinction

**Always choose the right client:**

| Client | File | When to Use |
|--------|------|-------------|
| `createClient()` (server) | `src/lib/supabase/server.ts` | **Async**, user-scoped, respects RLS. Use in Server Components and API routes for anything user-context-sensitive. |
| `createAdminClient()` | `src/lib/supabase/server.ts` | **Sync**, service-role key, bypasses RLS entirely. Use for admin operations, order creation, promo increments, and any write that must bypass row-level policies. |
| `createClient()` (browser) | `src/lib/supabase/client.ts` | Singleton for client components. Never use this in server-side code. |

The server `createClient()` is async because it reads from the Next.js cookie store. `createAdminClient()` is synchronous and must never be called in browser code.

### Authentication Flow

`AuthProvider` (`src/lib/providers/AuthProvider.tsx`) is the single source of truth for client-side auth state. It uses `onAuthStateChange` — not `getSession()` — to avoid race conditions. Key behaviours:

- Immediately sets a minimal user from the JWT on `SIGNED_IN`/`INITIAL_SESSION` (`is_synced: false`) to prevent UI flash
- Then fetches the full profile from `public.users` (includes `wallet_balance`, `role`)
- Uses a `syncingRef` + `pendingAuthUserRef` pattern to queue concurrent auth events rather than drop them
- `role` comes from `user.app_metadata.role` (set server-side), not from `public.users`

In API routes and middleware, always use `supabase.auth.getUser()` — never `getSession()`. The middleware validates JWTs on every request and handles maintenance mode, admin protection, and auth redirects.

### Middleware Protection Model

```
/admin/*            → must be role=admin
/dashboard/*        → must be authenticated
/checkout/*         → must be authenticated
/api/admin/*        → must be role=admin (middleware + per-route verifyAdmin())
```

Admin API routes also call `verifyAdmin()` locally as a defence-in-depth check — middleware alone is not sufficient because Next.js middleware can be bypassed in certain edge cases.

### Wallet & Order System

- Users pre-fund a wallet via top-up requests (manual admin approval)
- At checkout, wallet balance is deducted via the `deduct_wallet_balance` RPC (atomic)
- On wallet payment, digital codes are assigned immediately via `claim_product_codes_atomic` RPC
- Promo usage is tracked with `increment_promo_usage` / `decrement_promo_usage` RPCs; the increment runs before order insert so rollback RPCs are called if anything after it fails
- Rate limiting (`src/lib/rateLimit.ts`) is in-memory sliding-window — works per-process; swap for Redis/Upstash for multi-instance deployments

### PPOM (Product Price Option Matrix)

Products can have `ppom_enabled = true`, which activates a custom pricing engine:
- `option_groups` → `options` define selectable attributes (e.g. region, denomination)
- `option_combinations` stores pre-calculated prices for specific option combos
- `src/lib/ppom-utils.ts` contains all price calculation, combination matching, and selection validation logic
- `PurchaseSection` component (client) orchestrates option selection and price display

### CSS & Animation System

Tailwind v4 (`@import "tailwindcss"` — no `@tailwind` directives). Custom animation utilities are in `globals.css`:

- **Easing vars**: `--ease-out`, `--ease-in-out`, `--ease-spring` (Emil Kowalski standard curves)
- **Entrance animations**: `.animate-fade-up`, `.animate-fade-in`, `.animate-scale-in`
- **Stagger helpers**: `.stagger-1` through `.stagger-6` (60ms increments), `.stagger-grid` for product grids
- **Button press feedback**: Global `button:active` scale(0.97) — all buttons respond to press without per-component code
- **Reduced motion**: Fully respected — all animations disabled, marquee becomes scrollable

Fonts: Inter via `--font-inter` (body/`font-sans`), Space Grotesk via `--font-display` (h1–h4). Both loaded via `next/font/google` with `display: swap`.

### Security Headers

All security headers (CSP, HSTS, X-Frame-Options, etc.) are configured in `next.config.ts` via the `headers()` function — not in middleware. The CSP allows `unsafe-inline` on scripts (required by Next.js dev); this should be tightened with nonces for production.

### Email

All transactional emails go through Resend (`src/lib/resend.ts`). Functions: `sendOrderEmail`, `sendTopupApprovedEmail`, `sendCodesDeliveredEmail`, `sendAdminTopupNotificationEmail`, `sendOrderStatusEmail`. All are fire-and-forget (never awaited at call sites) — email failure does not fail the request.

### Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY     # Server-only — never expose to client
RESEND_API_KEY
ADMIN_EMAIL                   # Recipient for admin notification emails
```
