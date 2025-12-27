'use client'
import { X, Zap } from 'lucide-react'
import { useState, useEffect } from 'react'

export function InboxBanner() {
  const [isVisible, setIsVisible] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const hidden = sessionStorage.getItem('inbox-banner-hidden')
    if (hidden) setIsVisible(false)
  }, [])

  const handleClose = () => {
    setIsVisible(false)
    sessionStorage.setItem('inbox-banner-hidden', 'true')
  }

  // Prevent hydration mismatch by not rendering anything different until mounted
  if (!mounted) return <div className="h-0" /> 
  if (!isVisible) return null

  return (
    <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white relative z-[60]">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between text-xs md:text-sm">
          <div className="flex items-center gap-2 mx-auto md:mx-0">
            <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
              NEW
            </span>
            <span className="font-medium">Get 20% Extra Diamonds on FreeFire Top-ups this week!</span>
          </div>
          <button 
            onClick={handleClose}
            className="hidden md:block p-1 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}