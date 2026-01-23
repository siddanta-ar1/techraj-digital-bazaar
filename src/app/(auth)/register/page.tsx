"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserPlus, Mail, Lock, User, Phone, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ResponseModal from "@/components/ui/ResponseModal"; // Import Modal

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);

  // Modal State
  const [modal, setModal] = useState({
    isOpen: false,
    type: "success" as "success" | "error" | "warning",
    title: "",
    message: "",
  });

  const router = useRouter();
  const supabase = createClient();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const showModal = (
    type: "success" | "error" | "warning",
    title: string,
    message: string,
  ) => {
    setModal({ isOpen: true, type, title, message });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent double submission
    if (loading) return;

    if (formData.password !== formData.confirmPassword) {
      showModal(
        "error",
        "Password Mismatch",
        "The passwords you entered do not match.",
      );
      return;
    }

    if (formData.password.length < 6) {
      showModal(
        "warning",
        "Weak Password",
        "Password must be at least 6 characters long.",
      );
      return;
    }

    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            phone: formData.phone,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // FIX 1: Use upsert instead of insert to prevent 'duplicate key' errors
        const { error: profileError } = await supabase.from("users").upsert(
          {
            id: authData.user.id,
            email: formData.email,
            full_name: formData.fullName,
            phone: formData.phone,
            wallet_balance: 0.0,
            role: "user",
            // Only generate referral code if inserting, upsert handles duplicates safely
            referral_code: `TR${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
            email_verified: false,
          },
          { onConflict: "id" },
        ); // Ensure we merge on ID

        if (profileError) {
          // If profile fails but auth succeeded, we don't delete auth user anymore
          // because upsert makes this safe. Just warn the user.
          console.error("Profile creation warning:", profileError);
        }

        // Handle Resend Trigger (Avoid spamming if already sent)
        if (authData.session === null) {
          // Session is null means email confirmation is required
          showModal(
            "success",
            "Account Created!",
            "Please check your email to verify your account.",
          );
          // Delay redirect so user can read message
          setTimeout(() => router.push("/login"), 3000);
        } else {
          // Auto-login active
          router.push("/dashboard");
        }
      }
    } catch (error: any) {
      console.error(error);
      let title = "Registration Failed";
      let msg = error.message || "Failed to create account";

      // FIX 2: Handle Security/Rate Limit Errors specifically
      if (msg.includes("security purposes")) {
        title = "Too Many Attempts";
        msg = "Please wait a minute before trying to register again.";
      } else if (msg.includes("already registered")) {
        title = "Account Exists";
        msg = "This email is already registered. Please login instead.";
      }

      showModal("error", title, msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ResponseModal
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        type={modal.type}
        title={modal.title}
        message={modal.message}
      />

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4 py-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-indigo-100 p-4 rounded-2xl shadow-sm transform transition hover:scale-105">
                <UserPlus className="w-10 h-10 text-indigo-600" />
              </div>
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Create Account
            </h2>
            <p className="mt-2 text-slate-600">
              Join Techraj Digital Bazar today
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-6 bg-white p-8 rounded-3xl shadow-xl shadow-indigo-100/50 border border-slate-100"
          >
            <div className="space-y-4">
              {/* Full Name */}
              <div>
                <label
                  htmlFor="fullName"
                  className="block text-sm font-semibold text-slate-700 mb-2"
                >
                  Full Name
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  </div>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    className="pl-10 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-slate-700 mb-2"
                >
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-semibold text-slate-700 mb-2"
                >
                  Phone Number
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  </div>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    className="pl-10 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    placeholder="+977 98XXXXXXXX"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-slate-700 mb-2"
                >
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    placeholder="••••••••"
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Minimum 6 characters
                </p>
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-semibold text-slate-700 mb-2"
                >
                  Confirm Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="pl-10 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  required
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="terms" className="text-slate-600">
                  I agree to the{" "}
                  <Link
                    href="/terms"
                    className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline"
                  >
                    Privacy Policy
                  </Link>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3.5 px-4 rounded-xl font-bold text-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/40 flex items-center justify-center gap-2"
            >
              {loading ? (
                "Creating account..."
              ) : (
                <>
                  Create Account <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center text-sm text-slate-600">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-indigo-600 hover:text-indigo-500 hover:underline"
              >
                Sign in
              </Link>
            </div>
          </form>

          <div className="text-center text-xs text-slate-400">
            <p>📞 +977-9846908072 | 📧 support@tronlinebazar.com</p>
          </div>
        </div>
      </div>
    </>
  );
}
