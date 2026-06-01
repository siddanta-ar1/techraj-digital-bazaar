'use client'
import { ChevronLeft, ChevronRight, ArrowRight, Pause, Play } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

const slides = [
  {
    id: 1,
    title: 'Level Up Your Game',
    subtitle: 'Get 20% OFF on FreeFire Diamonds',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1600&auto=format&fit=crop',
    cta: 'Top Up Now',
    link: '/products?category=game-top-ups',
    gradient: 'from-indigo-900/90 to-purple-900/80'
  },
  {
    id: 2,
    title: 'Instant Gift Cards',
    subtitle: 'Netflix, Amazon, Spotify & More',
    image: 'https://images.unsplash.com/photo-1607604276583-eef5f50cc6c7?w=1600&auto=format&fit=crop',
    cta: 'Buy Gift Cards',
    link: '/products?category=gift-cards',
    gradient: 'from-slate-900/90 to-emerald-900/80'
  }
]

export function HeroBanner() {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
  }

  useEffect(() => {
    // Respect prefers-reduced-motion — never auto-advance
    if (typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return
    }
    if (paused) return
    timerRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length)
    }, 5000)
    return clearTimer
  }, [paused])

  const prev = () => { clearTimer(); setCurrent((c) => (c - 1 + slides.length) % slides.length) }
  const next = () => { clearTimer(); setCurrent((c) => (c + 1) % slides.length) }

  return (
    <div className="relative h-[380px] md:h-[480px] w-full overflow-hidden bg-slate-900"
         role="region" aria-label="Promotional slideshow"
         aria-roledescription="carousel">
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          role="group"
          aria-roledescription="slide"
          aria-label={`Slide ${index + 1} of ${slides.length}: ${slide.title}`}
          aria-hidden={index !== current}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            index === current ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          {/* Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${slide.image})` }}
          />
          {/* Gradient Overlay */}
          <div className={`absolute inset-0 bg-linear-to-r ${slide.gradient}`} />

          {/* Content — left-aligned per F-pattern research */}
          <div className="absolute inset-0 flex items-center">
            <div className="container mx-auto px-6 md:px-8">
              <div className="max-w-xl space-y-5">
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
                  className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-900 px-8 py-3.5 rounded-xl font-bold transition-colors shadow-lg shadow-amber-500/30"
                >
                  {slide.cta} <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Prev / Next — 44×44px touch targets */}
      <button
        onClick={prev}
        aria-label="Previous slide"
        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-11 h-11 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center text-white backdrop-blur-sm transition-colors focus-visible:outline-white"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={next}
        aria-label="Next slide"
        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-11 h-11 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center text-white backdrop-blur-sm transition-colors focus-visible:outline-white"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Dots — 44×44px tap area wrapper, small visual indicator inside */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex" role="tablist" aria-label="Slides">
        {slides.map((_, idx) => (
          <button
            key={idx}
            role="tab"
            aria-selected={idx === current}
            aria-label={`Go to slide ${idx + 1}`}
            onClick={() => { clearTimer(); setCurrent(idx) }}
            className="w-11 h-11 flex items-center justify-center focus-visible:outline-white"
          >
            <span className={`block rounded-full transition-all duration-300 ${
              idx === current ? 'w-6 h-2.5 bg-white' : 'w-2.5 h-2.5 bg-white/40'
            }`} />
          </button>
        ))}
      </div>

      {/* Pause/Play — WCAG 2.1 SC 2.2.2 */}
      <button
        onClick={() => setPaused(p => !p)}
        aria-label={paused ? 'Play slideshow' : 'Pause slideshow'}
        className="absolute bottom-3 right-3 z-20 w-11 h-11 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center text-white backdrop-blur-sm transition-colors focus-visible:outline-white"
      >
        {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
      </button>
    </div>
  )
}
