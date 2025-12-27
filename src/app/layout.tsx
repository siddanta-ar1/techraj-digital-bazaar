import type { Metadata } from 'next'
import { Inter, Poppins } from 'next/font/google'
import './globals.css'
import { InboxBanner } from '@/components/layout/InboxBanner'
import { MainNav } from '@/components/layout/MainNav'
import { ContactBar } from '@/components/layout/ContactBar'
import { CategoryMarquee } from '@/components/layout/CategoryMarquee'
import { Footer } from '@/components/layout/Footer'
import { AuthProvider } from '@/lib/providers/AuthProvider'
import { CartProvider } from '@/contexts/CartContext'
import { MobileHeader } from '@/components/layout/MobileHeader' // We will create this file separate

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const poppins = Poppins({ 
  weight: ['400', '500', '600', '700'], 
  subsets: ['latin'], 
  variable: '--font-poppins' 
})

export const metadata: Metadata = {
  title: 'Techraj Digital Bazar - Digital Products & Services',
  description: 'Your trusted platform for digital products, game codes, and online services in Nepal.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${poppins.variable} font-sans min-h-screen bg-slate-50 text-slate-900`}>
        <AuthProvider>
          <CartProvider>
            <div className="flex min-h-screen flex-col">
              {/* Inbox Banner - Global */}
              <InboxBanner />

              {/* Desktop Layout (Hidden on Mobile) */}
              <div className="hidden md:block">
                <MainNav />
                <ContactBar />
                <CategoryMarquee />
              </div>
              
              {/* Mobile Layout (Hidden on Desktop) */}
              <div className="md:hidden sticky top-0 z-50 bg-white">
                <MobileHeader />
              </div>
              
              <main className="flex-1 w-full relative">
                {children}
              </main>
              
              <Footer />
            </div>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  )
}