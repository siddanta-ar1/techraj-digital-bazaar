import { createClient } from "@/lib/supabase/server";
import { Megaphone, X } from "lucide-react";

export async function InboxBanner() {
  const supabase = await createClient();

  // Fetch settings
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "announcement")
    .single();

  const bannerSettings = data?.value || { active: false, text: "" };

  if (!bannerSettings.active || !bannerSettings.text) {
    return null;
  }

  return (
    <div className="bg-slate-900 text-white relative z-50">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-center text-xs md:text-sm font-medium gap-2 text-center">
          <Megaphone className="w-4 h-4 text-amber-400 hidden md:block" />
          <p>{bannerSettings.text}</p>
        </div>
      </div>
    </div>
  );
}
