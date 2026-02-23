import { createClient } from "@/lib/supabase/server";
import OptionsClient from "./OptionsClient";

export const dynamic = "force-dynamic";

export default async function OptionGroupsPage() {
    const supabase = await createClient();

    const { data: optionGroups } = await supabase
        .from("option_groups")
        .select(`
      *,
      options:options(id)
    `)
        .order("sort_order", { ascending: true });

    return <OptionsClient initialData={optionGroups || []} />;
}
