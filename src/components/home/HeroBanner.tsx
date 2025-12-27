'use client'
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const slides = [
  {
    id: 1,
    title: 'Level Up Your Game',
    subtitle: 'Get 20% OFF on FreeFire Diamonds',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1600&auto=format&fit=crop',
    cta: 'Top Up Now',
    link: '/products/games',
    gradient: 'from-indigo-900/90 to-purple-900/80'
  },
  {
    id: 2,
    title: 'Instant Gift Cards',
    subtitle: 'Netflix, Amazon, Spotify & More',
    image: 'https://images.unsplash.com/photo-1607604276583-eef5f50cc6c7?w=1600&auto=format&fit=crop',
    cta: 'Buy Gift Cards',
    link: '/products/gift-cards',
    gradient: 'from-slate-900/90 to-emerald-900/80'
  }
]

export function HeroBanner() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="relative h-[400px] md:h-[500px] w-full overflow-hidden bg-slate-900">
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            index === current ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          {/* Background Image */}
          <div 
             className="absolute inset-0 bg-cover bg-center transition-transform duration-[5000ms] ease-linear scale-105"
             style={{ backgroundImage: `url(${slide.image})` }} 
          />
          {/* Gradient Overlay */}
          <div className={`absolute inset-0 bg-gradient-to-r ${slide.gradient}`} />
          
          {/* Content */}
          <div className="absolute inset-0 flex items-center">
            <div className="container mx-auto px-4 md:px-8">
              <div className="max-w-xl space-y-6">
                <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-white/90 text-sm font-medium backdrop-blur-sm border border-white/20">
                  Exclusive Offer
                </span>
                <h2 className="text-4xl md:text-6xl font-black text-white leading-tight">
                  {slide.title}
                </h2>
                <p className="text-lg md:text-xl text-slate-200 font-medium">
                  {slide.subtitle}
                </p>
                <Link 
                  href={slide.link}
                  className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-8 py-3.5 rounded-xl font-bold transition-all transform hover:translate-x-1 shadow-lg shadow-amber-500/20"
                >
                  {slide.cta} <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all ${
              idx === current ? 'bg-white w-6 md:w-8' : 'bg-white/40'
            }`}
          />
        ))}
      </div>
    </div>
  )
}