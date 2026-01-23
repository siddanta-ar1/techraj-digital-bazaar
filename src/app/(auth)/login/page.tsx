"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, Mail, Lock, AlertCircle, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent double submission
    if (loading) return;

    setError("");
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      console.log("✅ Login successful, redirecting...");
      router.push("/dashboard");
    } catch (error: any) {
      setError(error.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    // Prevent multiple OAuth attempts
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      setError(error.message || "Failed to sign in with Google");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-indigo-100 p-4 rounded-2xl shadow-sm">
              <LogIn className="w-10 h-10 text-indigo-600" />
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900">
            Welcome Back
          </h2>
          <p className="mt-2 text-slate-600">
            Sign in to{" "}
            <span className="font-semibold text-indigo-600">Techraj</span>
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-700 px-4 py-3 rounded flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 space-y-6"
        >
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-semibold text-slate-700 mb-2"
            >
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            {/* FIX: Added Flex container to align Label and Forgot Password Link */}
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-slate-700"
              >
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-70 transition-all shadow-lg flex items-center justify-center gap-2"
          >
            {loading ? (
              "Signing in..."
            ) : (
              <>
                Sign in <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-slate-500">
                Or continue with
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 bg-white border border-[#dadce0] py-3 rounded-xl font-medium text-[15px] text-[#3c4043]
                       hover:bg-[#f7f8f8] active:bg-[#f1f3f4]
                       transition-all shadow-sm"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 48 48"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill="#EA4335"
                d="M24 9.5c3.14 0 5.94 1.08 8.15 2.85l6.1-6.1C34.55 2.48 29.6 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.1 5.51C11.57 13.03 17.33 9.5 24 9.5z"
              />
              <path
                fill="#4285F4"
                d="M46.5 24c0-1.64-.15-3.21-.42-4.73H24v9.05h12.7c-.55 2.96-2.23 5.47-4.75 7.15l7.26 5.64C43.79 36.85 46.5 30.97 46.5 24z"
              />
              <path
                fill="#FBBC05"
                d="M9.66 28.73c-.5-1.48-.79-3.06-.79-4.73s.29-3.25.79-4.73l-7.1-5.51C.92 16.95 0 20.37 0 24s.92 7.05 2.56 10.24l7.1-5.51z"
              />
              <path
                fill="#34A853"
                d="M24 48c5.6 0 10.55-1.84 14.06-4.99l-7.26-5.64c-2.01 1.35-4.6 2.15-6.8 2.15-6.67 0-12.43-3.53-14.34-9.23l-7.1 5.51C6.51 42.62 14.62 48 24 48z"
              />
            </svg>

            <span>Continue with Google</span>
          </button>

          <div className="text-center text-sm text-slate-600">
            Don't have an account?{" "}
            <Link
              href="/register"
              className="font-semibold text-indigo-600 hover:underline"
            >
              Create account
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
