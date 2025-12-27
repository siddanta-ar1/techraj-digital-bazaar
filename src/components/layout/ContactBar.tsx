import { Phone, MessageCircle, Mail, MapPin } from 'lucide-react'

export function ContactBar() {
  return (
    <div className="border-b border-slate-200 bg-slate-50 text-slate-600">
      <div className="container mx-auto px-4 py-2">
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs gap-2">
          
          {/* Left Side: Contact */}
          <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto justify-center sm:justify-start">
            <a href="tel:+9779846908072" className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors">
              <Phone className="w-3.5 h-3.5" />
              <span>+977-9846908072</span>
            </a>
            <a href="mailto:support@tronlinebazar.com" className="hidden sm:flex items-center gap-1.5 hover:text-indigo-600 transition-colors">
              <Mail className="w-3.5 h-3.5" />
              <span>support@tronlinebazar.com</span>
            </a>
            <div className="hidden sm:flex items-center gap-1.5">
               <MapPin className="w-3.5 h-3.5" />
               <span>Bharatpur, Nepal</span>
            </div>
          </div>
          
          {/* Right Side: Actions */}
          <div className="flex items-center gap-4">
            <a 
              href="https://wa.me/9779846908072" 
              target="_blank" 
              className="flex items-center gap-1.5 text-emerald-600 font-medium hover:text-emerald-700 bg-emerald-50 px-3 py-0.5 rounded-full transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp Support</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}