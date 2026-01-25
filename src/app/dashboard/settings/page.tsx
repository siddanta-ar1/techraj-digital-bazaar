"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  Loader2,
  Save,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  MessageSquare,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import { useModal } from "@/hooks/useModal";

export default function SettingsPage() {
  const { user, isLoading } = useAuth();
  const supabase = createClient();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // New State for Password Reset
  const [resetStatus, setResetStatus] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");

  // Modal Hooks
  const { modalState, closeModal, showSuccess, showError, showConfirm } =
    useModal();

  // Load initial user data
  useEffect(() => {
    if (user) {
      setFullName(user.full_name || "");
      setPhone(user.phone || "");
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsUpdating(true);

    try {
      const { error } = await supabase
        .from("users")
        .update({
          full_name: fullName,
          phone: phone,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      showSuccess(
        "Profile Updated",
        "Your information has been saved successfully.",
      );
    } catch (error: any) {
      console.error("Update error:", error);
      showError("Update Failed", error.message || "Failed to update profile.");
    } finally {
      setIsUpdating(false);
    }
  };

  // --- Password Reset Handler ---
  const handlePasswordReset = async () => {
    if (!user?.email) return;

    showConfirm(
      "Reset Password?",
      `We will send a password reset link to ${user.email}. Are you sure?`,
      async () => {
        setResetStatus("sending");

        // This sends a password reset link to the user's email
        const { error } = await supabase.auth.resetPasswordForEmail(
          user.email,
          {
            redirectTo: `${window.location.origin}/auth/update-password`,
          },
        );

        if (error) {
          setResetStatus("error");
          showError("Error", "Error sending reset email: " + error.message);
        } else {
          setResetStatus("sent");
          showSuccess(
            "Email Sent",
            "Password reset link has been sent to your email.",
          );
        }
      },
    );
  };

  // Show loading state while user is being loaded
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  // Show error state if user is not available after loading
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500">
        <AlertCircle className="h-8 w-8 mb-2" />
        <p>Please log in to view settings</p>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 -mt-8 pt-8 pb-8 px-4 sm:px-8 shadow-sm mb-8">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold text-slate-900">
              Account Settings
            </h1>
            <p className="text-slate-500 mt-2">
              Manage your personal information and security preferences
            </p>
          </div>
        </div>

        <div className="px-4 sm:px-8 grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
          {/* Profile Card */}
          <div className="lg:col-span-2 space-y-6">
            <form
              onSubmit={handleUpdateProfile}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <User className="h-5 w-5 text-indigo-600" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">
                  Personal Information
                </h2>
              </div>

              <div className="p-6 space-y-6">
                {/* Full Name */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Full Name
                  </label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>

                {/* Email (Read-only) */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="w-full pl-12 pr-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
                    />
                  </div>
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Email cannot be changed for security reasons.
                  </p>
                </div>

                {/* Phone Number */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">
                    Phone / WhatsApp
                  </label>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                      placeholder="+977 98..."
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end">
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Save className="h-5 w-5" />
                  )}
                  Save Changes
                </button>
              </div>
            </form>
          </div>

          {/* Security & Support Info */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                </div>
                Security
              </h3>
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                Secure your account by updating your password regularly. We use
                industry-standard encryption to keep your data safe.
              </p>
              {/* UPDATED RESET BUTTON */}
              <button
                onClick={handlePasswordReset}
                disabled={resetStatus === "sending" || resetStatus === "sent"}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-xl transition-all group border border-slate-200 hover:border-indigo-200"
              >
                <span className="font-medium flex items-center gap-3">
                  <KeyRound className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                  {resetStatus === "sent"
                    ? "Reset Link Sent"
                    : "Reset Password"}
                </span>
                {resetStatus === "sending" && (
                  <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                )}
              </button>
            </div>

            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-2xl shadow-lg text-white relative overflow-hidden">
              {/* Background Pattern */}
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>

              <h3 className="font-bold mb-2 flex items-center gap-2 relative z-10">
                <MessageSquare className="w-5 h-5" /> Need help?
              </h3>
              <p className="text-sm text-indigo-100 mb-6 relative z-10 leading-relaxed">
                If you need to change your registered email or have any other
                issues, contact our support team directly via WhatsApp.
              </p>
              <a
                href={`https://wa.me/${process.env.NEXT_PUBLIC_CONTACT_PHONE?.replace("+", "") || "9779846908072"}`}
                target="_blank"
                className="block text-center bg-white text-indigo-600 py-3 rounded-xl font-bold hover:bg-indigo-50 transition-colors shadow-md relative z-10"
              >
                Contact Support
              </a>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        onConfirm={modalState.onConfirm}
        showConfirmButton={modalState.showConfirmButton}
      />
    </>
  );
}
