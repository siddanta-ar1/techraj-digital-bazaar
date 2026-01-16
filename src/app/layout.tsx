// File: src/app/layout.tsx
import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { InboxBanner } from "@/components/layout/InboxBanner";
import { MainNav } from "@/components/layout/MainNav";
import { ContactBar } from "@/components/layout/ContactBar";
import { CategoryMarquee } from "@/components/layout/CategoryMarquee";
import { Footer } from "@/components/layout/Footer";
import { Providers } from "@/lib/providers/Providers"; // Import the new wrapper
import { MobileHeader } from "@/components/layout/MobileHeader";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Techraj Digital Bazar - Digital Products & Services",
  description:
    "Your trusted platform for digital products, game codes, and online services in Nepal.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${poppins.variable} font-sans min-h-screen bg-slate-50 text-slate-900`}
      >
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
