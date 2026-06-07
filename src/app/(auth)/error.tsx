"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[auth] page error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-8 text-center bg-slate-50">
      <div className="p-4 bg-amber-50 rounded-full">
        <AlertTriangle className="w-8 h-8 text-amber-500" />
      </div>
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-1">Page failed to load</h2>
        <p className="text-sm text-slate-500 max-w-sm">
          Something went wrong. Please try again.
        </p>
      </div>
      <button
        onClick={reset}
        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        Try Again
      </button>
    </div>
  );
}
