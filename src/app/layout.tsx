// File: src/app/layout.tsx
import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { InboxBanner } from "@/components/layout/InboxBanner";
import { MainNav } from "@/components/layout/MainNav";
import { ContactBar } from "@/components/layout/ContactBar";
import { CategoryMarquee } from "@/components/layout/CategoryMarquee";
import { Footer } from "@/components/layout/Footer";
import { Providers } from "@/lib/providers/Providers";
import { MobileHeader } from "@/components/layout/MobileHeader";

// Inter for body — now properly wired via --font-sans in globals.css
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
// Space Grotesk for headings — distinctive personality, still highly legible
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://techrajshop.com"),
  title: {
    default: "Techraj Digital Shop – Buy Digital Products in Nepal",
    template: "%s | Techraj",
  },
  description:
    "Techraj Digital Shop (techrajshop.com) – Nepal's trusted store for PUBG UC, Freefire Diamonds, Netflix, Steam Gift Cards and 100+ instant digital products. Fast delivery, secure payment.",
  keywords: [
    "techraj",
    "techrajshop",
    "techraj digital shop",
    "techrajshop.com",
    "digital products nepal",
    "pubg uc nepal",
    "freefire diamonds nepal",
    "game top up nepal",
    "steam gift card nepal",
    "netflix nepal",
    "instant digital delivery nepal",
    "buy digital products nepal",
  ],
  authors: [{ name: "Techraj Digital Shop", url: "https://techrajshop.com" }],
  creator: "Techraj Digital Shop",
  publisher: "Techraj Digital Shop",
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  openGraph: {
    type: "website",
    locale: "en_NP",
    url: "https://techrajshop.com",
    siteName: "Techraj Digital Shop",
    title: "Techraj Digital Shop – Buy Digital Products in Nepal",
    description:
      "Nepal's trusted store for PUBG UC, Freefire Diamonds, Netflix, Steam Gift Cards and 100+ instant digital products. Instant delivery.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Techraj Digital Shop – Nepal's Digital Products Store",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Techraj Digital Shop – Digital Products Nepal",
    description:
      "Nepal's trusted store for PUBG UC, Freefire Diamonds, Netflix & 100+ instant digital products.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://bayreevaezoccjcjxtex.supabase.co" />
        <link rel="dns-prefetch" href="https://bayreevaezoccjcjxtex.supabase.co" />
      </head>
      <body
        suppressHydrationWarning
        className={`${inter.variable} ${spaceGrotesk.variable} font-sans min-h-screen bg-slate-50 text-slate-900`}
      >
        {/* Strip browser-extension attributes before React hydrates — uses next/script
            beforeInteractive so it runs in the HTML before React initialises (React 19
            does not execute plain <script> tags inside components on the client). */}
        <Script id="ext-attr-cleanup" strategy="beforeInteractive">{`(function(){var o=new MutationObserver(function(m){m.forEach(function(r){if(r.attributeName&&r.attributeName.startsWith('bis_'))r.target.removeAttribute(r.attributeName)})});o.observe(document.documentElement,{attributes:true,subtree:true,attributeFilter:['bis_skin_checked','bis_register']});document.querySelectorAll('[bis_skin_checked],[bis_register]').forEach(function(el){el.removeAttribute('bis_skin_checked');el.removeAttribute('bis_register')})})()`}</Script>
        {/* Wrap the entire app content in the Providers component */}
        <Providers>
          <div className="flex min-h-screen flex-col">
            {/* Inbox Banner - Global */}
            <InboxBanner />

            {/* Desktop Header Components */}
            <div className="hidden md:block">
              <MainNav />
              <ContactBar />
            </div>

            {/* Mobile Header (Hidden on Desktop) */}
            <div className="md:hidden sticky top-0 z-50 bg-white shadow-sm">
              <MobileHeader />
            </div>

            {/* Marquee - Now visible on BOTH Mobile and Desktop */}
            <div className="border-b border-slate-200 bg-white">
              <CategoryMarquee />
            </div>

            <main className="flex-1 w-full relative">{children}</main>

            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
