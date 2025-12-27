import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "./SettingsForm";
import { Settings } from "lucide-react";

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
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Settings className="h-8 w-8 text-indigo-600" />
          Site Settings
        </h1>
        <p className="text-slate-500 mt-2">
          Configure global website parameters
        </p>
      </div>

      <SettingsForm initialSettings={settingsMap} />
    </div>
  );
}
