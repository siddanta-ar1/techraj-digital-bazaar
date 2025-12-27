'use client'
import { Search, ShoppingCart, User, ChevronDown, Wallet, LogOut } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/lib/providers/AuthProvider'
import { useCart } from '@/contexts/CartContext'
import { useState, useRef, useEffect } from 'react'

export function MainNav() {
  const { user, signOut } = useAuth()
  const { totalItems } = useCart()
  const [userDropdown, setUserDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-8">
          {/* Logo */}
          <Link href="/" className="text-2xl font-black tracking-tighter shrink-0">
            <span className="text-indigo-600">TECH</span>
            <span className="text-slate-800">RAJ</span>
            <span className="text-amber-500 text-lg ml-0.5">.NP</span>
          </Link>

          {/* Search Bar - Centered */}
          <div className="hidden md:flex flex-1 max-w-xl relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            </div>
            <input 
              type="text" 
              placeholder="Search for PUBG UC, Gift Cards..." 
              className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-full leading-5 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition duration-150 ease-in-out sm:text-sm"
            />
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-6 shrink-0">
            {/* Nav Links */}
            <div className="hidden lg:flex items-center gap-6 text-sm font-semibold text-slate-600">
              <Link href="/products" className="hover:text-indigo-600 transition-colors">Shop</Link>
              <Link href="/deals" className="hover:text-indigo-600 transition-colors text-amber-600">Deals</Link>
            </div>

            {/* Cart */}
            <Link href="/cart" className="relative group p-2 rounded-full hover:bg-slate-100 transition-colors">
              <ShoppingCart className="w-6 h-6 text-slate-600 group-hover:text-indigo-600" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full border-2 border-white">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* User Area */}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setUserDropdown(!userDropdown)}
                  className="flex items-center gap-2 hover:bg-slate-50 py-1 pr-2 pl-1 rounded-full border border-transparent hover:border-slate-200 transition-all"
                >
                  <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold border-2 border-indigo-50">
                    {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${userDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {userDropdown && (
                  <div className="absolute right-0 mt-2 w-60 bg-white border border-slate-100 rounded-xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-4 py-3 border-b border-slate-50 bg-slate-50/50">
                      <p className="font-bold text-slate-800 truncate">{user.full_name || 'User'}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>
                    
                    <div className="p-2">
                       <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition-colors">
                          <User className="w-4 h-4" /> Dashboard
                       </Link>
                       <Link href="/dashboard/wallet" className="flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition-colors">
                          <Wallet className="w-4 h-4" /> 
                          <span className="flex-1">Wallet</span>
                          <span className="text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-0.5 rounded-full">
                            रु {user.wallet_balance.toFixed(0)}
                          </span>
                       </Link>
                    </div>
                    
                    <div className="border-t border-slate-50 mt-1 p-2">
                      <button 
                        onClick={() => signOut()}
                        className="flex w-full items-center gap-3 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 rounded-lg transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4" /> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link 
                href="/login" 
                className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-full font-semibold text-sm hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20"
              >
                <User className="w-4 h-4" />
                <span>Login</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}