"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function SectionError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard/section] error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 p-8 text-center">
      <div className="p-4 bg-amber-50 rounded-full">
        <AlertTriangle className="w-8 h-8 text-amber-500" />
      </div>
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-1">Failed to load</h2>
        <p className="text-sm text-slate-500 max-w-sm">
          Something went wrong. Please try refreshing or go back.
        </p>
      </div>
      <div className="flex gap-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </Link>
        <button
          onClick={reset}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    </div>
  );
}
