import type { NextConfig } from "next";

// Security headers applied to every response.
// Ref: https://owasp.org/www-project-secure-headers/
const securityHeaders = [
  // Prevent MIME-type sniffing — stops browsers from guessing content types
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Block the page from being embedded in an iframe (clickjacking protection)
  { key: "X-Frame-Options", value: "DENY" },
  // Only send the origin as referrer on cross-origin requests
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Disable unnecessary browser features that could be abused
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  // Force HTTPS for 1 year, include subdomains (only effective in production)
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  // Block reflected XSS in older browsers
  { key: "X-XSS-Protection", value: "1; mode=block" },
  // Content-Security-Policy — restrict sources of scripts, styles, images, fonts
  // 'unsafe-inline' on style is required for Tailwind inline styles; tighten later with nonces.
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // unsafe-eval needed by Next.js dev; remove in prod if possible
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://*.supabase.co https://lh3.googleusercontent.com https://avatars.githubusercontent.com https://ui-avatars.com https://images.unsplash.com",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.resend.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  reactCompiler: true,

  async headers() {
    return [
      {
        // Apply security headers to every route
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        // Public product/category endpoints — cache aggressively at CDN
        source: "/api/(products|categories)(.*)",
        headers: [
          { key: "Cache-Control", value: "public, s-maxage=60, stale-while-revalidate=300" },
        ],
      },
      {
        // Payment settings — cache for 5 minutes (changes infrequently)
        source: "/api/settings/payment",
        headers: [
          { key: "Cache-Control", value: "public, s-maxage=300, stale-while-revalidate=600" },
        ],
      },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
      { protocol: "https", hostname: "lh3.googleusercontent.com", pathname: "**" },
      { protocol: "https", hostname: "avatars.githubusercontent.com", pathname: "**" },
      { protocol: "https", hostname: "ui-avatars.com", pathname: "**" },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "**" },
    ],
  },
};

export default nextConfig;
