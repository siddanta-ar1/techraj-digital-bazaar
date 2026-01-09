"use client";

import Link from "next/link";
import { Construction, ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
      <div className="bg-indigo-50 p-6 rounded-full mb-6 animate-pulse">
        <Construction className="w-16 h-16 text-indigo-600" />
      </div>

      <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
        Coming Soon
      </h1>

      <p className="text-slate-600 max-w-md mx-auto mb-8 text-lg">
        This feature is currently under development or the page you are looking
        for doesn't exist. We are working hard to bring this to you!
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => window.history.back()}
          className="flex items-center justify-center gap-2 px-6 py-3 border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </button>

        <Link
          href="/"
          className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
        >
          <Home className="w-4 h-4" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
