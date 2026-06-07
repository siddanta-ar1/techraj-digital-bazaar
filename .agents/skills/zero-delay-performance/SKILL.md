# Agent Skill: Zero-Delay Next.js & Supabase Free-Tier Optimization

## Purpose
Enforce a hard requirement for instant user-interface responsiveness, eliminating the 4–5 second "rendering..." page transition freezes caused by serverless cold starts, unaligned cloud regions, and sequential database bottlenecks on Vercel and Supabase Hobby tiers.

## Core Directives

### 1. UI Rule: Never Block the Thread (Instant Transitions)
*   **Mandatory Suspense Skeletons:** Every route folder (`/app/[route]/`) that fetches asynchronous data *must* have a companion `loading.tsx` file containing layout skeletons. 
*   **Non-Blocking UI:** Page navigation must execute instantly on user click. Data fetching must happen inside React Server Components wrapped by Suspense boundaries, or client-side with immediate optimistic transitions.
*   **Visual Response:** Never let a link click freeze the screen. Immediate visual feedback is a requirement for all interactive elements.

### 2. Code Rule: Parallelize and Minimize Payload Sizes
*   **No Sequential Waterfalls:** Any endpoint or page requiring multiple database queries must use parallel execution clients (e.g., `Promise.all([query1, query2])`). Never allow multiple sequential `await` declarations for unrelated data blocks.
*   **Explicit Select Selectors:** Strict prohibition of open-ended queries (`.select('*')`). Every query must explicitly specify needed keys (e.g., `.select('id, title, price')`) to dramatically reduce transaction payloads traveling across free-tier bandwidth limits.

### 3. Infrastructure & Connection Requirements
*   **Pooler Injection:** Direct Postgres endpoint strings on port `5432` are forbidden for runtime functions. The system must use connection pooling strings (port `6543`, transaction mode `Supavisor`) to bypass the strict 60-connection max limit of the Supabase free tier.
*   **Region Matching Verification:** When configuring Vercel edge functions, the location region overrides *must* point to the identical datacenter zone where the Supabase database instance resides to prevent cross-continent latency chains.

### 4. Smart Caching Policies
*   **Edge Net Deliveries:** Static or low-frequency data arrays must be handled via Incremental Static Regeneration (`ISR`) using `export const revalidate = X;`. 
*   **Bypass Supabase Stalls:** When data can be stale for a few minutes, read directly from the Vercel edge cache mesh instead of invoking fresh database queries on every user interaction.
