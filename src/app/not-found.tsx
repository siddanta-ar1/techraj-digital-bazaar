"use client";

import Link from "next/link";
import { Construction, ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="bg-slate-50 min-h-[70vh] flex items-center justify-center px-4">
      <div className="bg-white border border-slate-200 rounded-2xl p-10 max-w-lg w-full text-center">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-indigo-50">
          <Construction className="h-10 w-10 text-indigo-600" />
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
          Coming Soon
        </h1>

        {/* Description */}
        <p className="text-slate-600 text-base md:text-lg mb-8">
          This feature is currently under development or the page you are trying
          to access doesn’t exist. We’re actively working to make it available.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => window.history.back()}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>

          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
