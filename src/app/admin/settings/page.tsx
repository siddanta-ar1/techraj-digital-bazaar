import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "./SettingsForm";
import { Settings as SettingsIcon } from "lucide-react";

export const metadata = {
  title: "Site Settings - Admin Panel",
};

export default async function AdminSettingsPage() {
  const supabase = await createClient();

  // Fetch all settings as a map
  const { data } = await supabase.from("site_settings").select("*");

  // Transform array to object for easier use
  const settingsMap: Record<string, any> = {};
  data?.forEach((item) => {
    settingsMap[item.key] = item.value;
  });

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <SettingsIcon className="h-8 w-8 text-indigo-600" />
            </div>
            Site Settings
          </h1>
          <p className="text-slate-500 mt-2">
            Configure global website parameters, announcements, and maintenance
            mode.
          </p>
        </div>

        <SettingsForm initialSettings={settingsMap} />
      </div>
    </div>
  );
}
