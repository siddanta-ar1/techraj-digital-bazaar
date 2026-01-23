"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Mail,
  ArrowRight,
  CheckCircle,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");
  const supabase = createClient();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent double submission
    if (status === "loading") return;

    setStatus("loading");
    setMessage("");

    // This triggers the password reset email from Supabase
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      // Redirects user to the update password page after they click the email link
      redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
    });

    if (error) {
      setMessage(error.message);
      setStatus("error");
    } else {
      setStatus("success");
    }
  };

  if (status === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Check your inbox
          </h2>
          <p className="text-slate-600 mb-6">
            We have sent a password reset link to <strong>{email}</strong>.
            <br />
            Please check your email to continue.
          </p>
          <Link
            href="/login"
            className="text-indigo-600 font-bold hover:underline"
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
        <Link
          href="/login"
          className="inline-flex items-center text-sm text-slate-500 hover:text-slate-800 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Login
        </Link>

        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Reset Password
        </h2>
        <p className="text-slate-600 mb-6">
          Enter your registered email to receive reset instructions.
        </p>

        {status === "error" && (
          <div className="p-3 bg-rose-50 text-rose-600 text-sm rounded-lg mb-4 flex items-center gap-2">
            <span className="font-bold">Error:</span> {message}
          </div>
        )}

        <form onSubmit={handleReset} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Email Address
            </label>
            <div className="relative group">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:border-indigo-500 outline-none transition-all"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-70 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
          >
            {status === "loading" ? (
              <>
                <Loader2 className="animate-spin h-5 w-5" /> Sending...
              </>
            ) : (
              <>
                Send Reset Link <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
