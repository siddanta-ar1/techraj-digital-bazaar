"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Save, Loader2, Globe, Megaphone, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";

export function SettingsForm({
  initialSettings,
}: {
  initialSettings: Record<string, any>;
}) {
  const [settings, setSettings] = useState(initialSettings);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const handleSave = async (key: string, value: any) => {
    setLoading(true);
    const { error } = await supabase.from("site_settings").upsert({
      key,
      value,
      updated_at: new Date().toISOString(),
    });

    setLoading(false);
    if (error) {
      alert("Failed to save settings");
    } else {
      router.refresh();
    }
  };

  const updateNestedState = (category: string, field: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value,
      },
    }));
  };

  return (
    <div className="space-y-6">
      {/* General Information */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Globe className="h-5 w-5 text-blue-600" />
          </div>
          <h3 className="font-semibold text-slate-900">General Information</h3>
        </div>

        <div className="grid gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Site Name
            </label>
            <input
              type="text"
              value={settings.site_info?.name || ""}
              onChange={(e) =>
                updateNestedState("site_info", "name", e.target.value)
              }
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Support Phone
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
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Support Email
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
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end mt-2">
            <SaveButton
              onClick={() => handleSave("site_info", settings.site_info)}
              loading={loading}
            />
          </div>
        </div>
      </div>

      {/* Announcement Banner */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-amber-50 rounded-lg">
            <Megaphone className="h-5 w-5 text-amber-600" />
          </div>
          <h3 className="font-semibold text-slate-900">Announcement Bar</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Enable Banner</span>
            <button
              onClick={() =>
                updateNestedState(
                  "announcement",
                  "active",
                  !settings.announcement?.active,
                )
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.announcement?.active ? "bg-indigo-600" : "bg-slate-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  settings.announcement?.active
                    ? "translate-x-6"
                    : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Banner Text
            </label>
            <input
              type="text"
              value={settings.announcement?.text || ""}
              onChange={(e) =>
                updateNestedState("announcement", "text", e.target.value)
              }
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div className="flex justify-end mt-2">
            <SaveButton
              onClick={() => handleSave("announcement", settings.announcement)}
              loading={loading}
            />
          </div>
        </div>
      </div>

      {/* Maintenance Mode */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 opacity-75">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-red-50 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <h3 className="font-semibold text-slate-900">Danger Zone</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-100">
            <div>
              <p className="font-medium text-red-800">Maintenance Mode</p>
              <p className="text-xs text-red-600">
                Disables the public storefront.
              </p>
            </div>
            <button
              onClick={() => {
                const newState = !settings.maintenance?.active;
                updateNestedState("maintenance", "active", newState);
                handleSave("maintenance", {
                  ...settings.maintenance,
                  active: newState,
                });
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.maintenance?.active ? "bg-red-600" : "bg-slate-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  settings.maintenance?.active
                    ? "translate-x-6"
                    : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
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
      className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-sm font-medium disabled:opacity-50"
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
