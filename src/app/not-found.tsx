"use client";

import Link from "next/link";
import { ArrowLeft, Home, SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="bg-slate-50 min-h-[80vh] flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center animate-fade-up">
        {/* Large 404 number */}
        <div className="mb-6 select-none">
          <span
            className="text-[120px] md:text-[160px] font-black leading-none"
            style={{
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            404
          </span>
        </div>

        {/* Icon */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 animate-fade-up stagger-2">
          <SearchX className="h-8 w-8 text-indigo-600" />
        </div>

        {/* Copy */}
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3 animate-fade-up stagger-2">
          Page not found
        </h1>
        <p className="text-slate-500 text-base mb-10 max-w-sm mx-auto animate-fade-up stagger-3">
          The page you're looking for doesn't exist or has been moved. Let's
          get you back on track.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center animate-fade-up stagger-4">
          <button
            onClick={() => window.history.back()}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-100"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>

          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 shadow-lg shadow-indigo-200"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
