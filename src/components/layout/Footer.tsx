import Link from 'next/link'
import { Facebook, Youtube, Globe, Mail, Phone, MapPin } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-800">
      <div className="container mx-auto px-4 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand & About */}
          <div className="space-y-6">
            <div className="flex items-center gap-1">
               <span className="text-2xl font-black text-indigo-500 tracking-tighter">TECH</span>
               <span className="text-2xl font-black text-white tracking-tighter">RAJ</span>
               <span className="text-xl font-bold text-amber-500">.NP</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-sm">
              Your premier digital platform for instant game top-ups, gift cards, virtual payments, and digital marketing services in Nepal.
            </p>
            <div className="flex gap-4">
              <SocialLink href="https://facebook.com/profile.php?id=61569895337580" icon={<Facebook className="w-5 h-5" />} />
              <SocialLink href="https://youtube.com/@techraj687" icon={<Youtube className="w-5 h-5" />} />
              <SocialLink href="https://tronlinebazar.com" icon={<Globe className="w-5 h-5" />} />
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-white font-bold text-lg mb-6">Contact Us</h4>
            <ul className="space-y-4 text-sm text-slate-400">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-indigo-500 shrink-0" />
                <span>Bharatpur, Chitwan, Nepal</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-indigo-500 shrink-0" />
                <span>+977-9846908072</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-indigo-500 shrink-0" />
                <a href="mailto:support@tronlinebazar.com" className="hover:text-white transition-colors">
                  support@tronlinebazar.com
                </a>
              </li>
              <li className="pt-2 border-t border-slate-800 mt-2">
                <span className="block text-xs text-slate-500 mb-1">Manager</span>
                <a href="https://www.facebook.com/kandelr687" className="text-indigo-400 hover:text-indigo-300 font-medium">
                  Raju Kandel
                </a>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold text-lg mb-6">Quick Links</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/products" className="text-slate-400 hover:text-indigo-400 hover:translate-x-1 inline-block transition-all">
                  Browse Shop
                </Link>
              </li>
              <li>
                <Link href="/category/games" className="text-slate-400 hover:text-indigo-400 hover:translate-x-1 inline-block transition-all">
                  Game Codes
                </Link>
              </li>
              <li>
                <Link href="/category/gift-cards" className="text-slate-400 hover:text-indigo-400 hover:translate-x-1 inline-block transition-all">
                  Gift Cards
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-slate-400 hover:text-indigo-400 hover:translate-x-1 inline-block transition-all">
                  My Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Support & Legal */}
          <div>
            <h4 className="text-white font-bold text-lg mb-6">Legal</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/terms" className="text-slate-400 hover:text-indigo-400 hover:translate-x-1 inline-block transition-all">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-slate-400 hover:text-indigo-400 hover:translate-x-1 inline-block transition-all">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/refund" className="text-slate-400 hover:text-indigo-400 hover:translate-x-1 inline-block transition-all">
                  Refund Policy
                </Link>
              </li>
              <li>
                <a href="https://tiktok.com/@techraj687" className="text-slate-400 hover:text-indigo-400 hover:translate-x-1 inline-block transition-all">
                  Follow on TikTok
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} Techraj Digital Bazar. All rights reserved.
          </p>
          <div className="flex gap-6 text-xs text-slate-500">
             <span>Secure Payment</span>
             <span>Instant Delivery</span>
             <span>24/7 Support</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

function SocialLink({ href, icon }: { href: string; icon: React.ReactNode }) {
  return (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer"
      className="bg-slate-800 p-2 rounded-lg text-slate-400 hover:bg-indigo-600 hover:text-white transition-all duration-300 hover:-translate-y-1"
    >
      {icon}
    </a>
  )
}