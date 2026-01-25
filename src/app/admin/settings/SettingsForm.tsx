"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Save,
  Loader2,
  Globe,
  Megaphone,
  AlertTriangle,
  Phone,
  Mail,
  Type,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Modal from "@/components/ui/Modal";
import { useModal } from "@/hooks/useModal";
import { PaymentSettings } from "@/components/admin/settings/PaymentSettings";

export function SettingsForm({
  initialSettings,
}: {
  initialSettings: Record<string, any>;
}) {
  const [settings, setSettings] = useState(initialSettings);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "payment" | "danger">(
    "general",
  );
  const supabase = createClient();
  const router = useRouter();

  // Modal Hooks
  const { modalState, closeModal, showSuccess, showError, showConfirm } =
    useModal();

  const handleSave = async (key: string, value: any) => {
    setLoading(true);
    const { error } = await supabase.from("site_settings").upsert({
      key,
      value,
      updated_at: new Date().toISOString(),
    });

    setLoading(false);
    if (error) {
      showError("Save Failed", "Could not update settings. Please try again.");
    } else {
      showSuccess(
        "Settings Saved",
        "The configuration has been updated successfully.",
      );
      router.refresh();
      // Update local state to reflect changes immediately
      setSettings((prev: any) => ({ ...prev, [key]: value }));
    }
  };

  const updateNestedState = (category: string, field: string, value: any) => {
    setSettings((prev: any) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value,
      },
    }));
  };

  const handleMaintenanceToggle = () => {
    const newState = !settings.maintenance?.active;
    const action = newState ? "Enable" : "Disable";

    showConfirm(
      `${action} Maintenance Mode?`,
      newState
        ? "This will disable the public storefront. Only admins will be able to access the site."
        : "Your store will be visible to the public again.",
      async () => {
        updateNestedState("maintenance", "active", newState);
        await handleSave("maintenance", {
          ...settings.maintenance,
          active: newState,
        });
      },
    );
  };

  return (
    <>
      {/* Tabs Navigation */}
      <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200 mb-8 max-w-2xl">
        <button
          onClick={() => setActiveTab("general")}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${activeTab === "general"
            ? "bg-indigo-50 text-indigo-600 shadow-sm"
            : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
        >
          General & Announcements
        </button>
        <button
          onClick={() => setActiveTab("payment")}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${activeTab === "payment"
            ? "bg-indigo-50 text-indigo-600 shadow-sm"
            : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
        >
          Payment Methods
        </button>
        <button
          onClick={() => setActiveTab("danger")}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${activeTab === "danger"
            ? "bg-red-50 text-red-600 shadow-sm"
            : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
        >
          Danger Zone
        </button>
      </div>

      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {/* TAB: GENERAL */}
        {activeTab === "general" && (
          <div className="grid gap-8 lg:grid-cols-2">
            {/* General Information */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-white border-b border-blue-100 flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Globe className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-slate-800">
                  General Information
                </h3>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <Type className="h-4 w-4 text-slate-400" /> Site Name
                  </label>
                  <input
                    type="text"
                    value={settings.site_info?.name || ""}
                    onChange={(e) =>
                      updateNestedState("site_info", "name", e.target.value)
                    }
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
                    placeholder="e.g. My Awesome Shop"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                      <Phone className="h-4 w-4 text-slate-400" /> Support Phone
                    </label>
                    <input
                      type="text"
                      value={settings.site_info?.contact_phone || ""}
                      onChange={(e) =>
                        updateNestedState(
                          "site_info",
                          "contact_phone",
                          e.target.value,
                        )
                      }
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
                      placeholder="+1 234 567 890"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                      <Mail className="h-4 w-4 text-slate-400" /> Support Email
                    </label>
                    <input
                      type="text"
                      value={settings.site_info?.contact_email || ""}
                      onChange={(e) =>
                        updateNestedState(
                          "site_info",
                          "contact_email",
                          e.target.value,
                        )
                      }
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
                      placeholder="support@example.com"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <SaveButton
                    onClick={() => handleSave("site_info", settings.site_info)}
                    loading={loading}
                  />
                </div>
              </div>
            </div>

            {/* Announcement Banner */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-amber-50 to-white border-b border-amber-100 flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Megaphone className="h-5 w-5 text-amber-600" />
                </div>
                <h3 className="font-semibold text-slate-800">
                  Announcement Bar
                </h3>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between bg-amber-50/50 p-4 rounded-xl border border-amber-100">
                  <span className="text-sm font-medium text-slate-700">
                    Enable Banner
                  </span>
                  <button
                    onClick={() =>
                      updateNestedState(
                        "announcement",
                        "active",
                        !settings.announcement?.active,
                      )
                    }
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${settings.announcement?.active
                      ? "bg-indigo-600"
                      : "bg-slate-300"
                      }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${settings.announcement?.active
                        ? "translate-x-6"
                        : "translate-x-1"
                        }`}
                    />
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Banner Text
                  </label>
                  <input
                    type="text"
                    value={settings.announcement?.text || ""}
                    onChange={(e) =>
                      updateNestedState("announcement", "text", e.target.value)
                    }
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
                    placeholder="e.g. Big Sale! 50% Off Everything"
                  />
                </div>
                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <SaveButton
                    onClick={() =>
                      handleSave("announcement", settings.announcement)
                    }
                    loading={loading}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: PAYMENT */}
        {activeTab === "payment" && (
          <div className="max-w-4xl">
            {/* Import dynamically to avoid circular deps if any, though standard import is fine */}
            <PaymentSettings
              initialSettings={settings.payment_methods}
              onSave={handleSave}
            />
          </div>
        )}

        {/* TAB: DANGER */}
        {activeTab === "danger" && (
          <div className="max-w-2xl">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-red-50 to-white border-b border-red-100 flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <h3 className="font-semibold text-slate-800">Danger Zone</h3>
              </div>

              <div className="p-6">
                <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-100">
                  <div>
                    <p className="font-bold text-red-800">Maintenance Mode</p>
                    <p className="text-xs text-red-600 mt-1">
                      Disables the public storefront. Admin area remains
                      accessible.
                    </p>
                  </div>
                  <button
                    onClick={handleMaintenanceToggle}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${settings.maintenance?.active
                      ? "bg-red-600"
                      : "bg-slate-300"
                      }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${settings.maintenance?.active
                        ? "translate-x-6"
                        : "translate-x-1"
                        }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Global Modal Component */}
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

function SaveButton({
  onClick,
  loading,
}: {
  onClick: () => void;
  loading: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all shadow-md hover:shadow-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Save className="h-4 w-4" />
      )}
      Save Changes
    </button>
  );
}
