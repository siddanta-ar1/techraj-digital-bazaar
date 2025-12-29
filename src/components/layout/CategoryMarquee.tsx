"use client"; // Needs to be client to use pathname

import { usePathname } from "next/navigation";
import { CategoryMarqueeClient } from "./CategoryMarqueeClient";
import { createClient } from "@/lib/supabase/client"; // Use client for client component
import { useEffect, useState } from "react";
// ... icons import ...
import {
  Gamepad2,
  Gift,
  CreditCard,
  MessageCircle,
  Film,
  Globe,
  Play,
  Monitor,
  Layers,
} from "lucide-react";

// Move getCategoryStyle function inside or keep here
const getCategoryStyle = (name: string) => {
  const normalized = name.toLowerCase();
  if (normalized.includes("software") || normalized.includes("tool"))
    return {
      icon: <Monitor className="w-5 h-5" />,
      color: "text-blue-600 bg-blue-50",
    };
  if (normalized.includes("gift card"))
    return {
      icon: <Gift className="w-5 h-5" />,
      color: "text-purple-600 bg-purple-50",
    };
  if (normalized.includes("visa") || normalized.includes("card"))
    return {
      icon: <CreditCard className="w-5 h-5" />,
      color: "text-cyan-600 bg-cyan-50",
    };
  if (normalized.includes("discord"))
    return {
      icon: <MessageCircle className="w-5 h-5" />,
      color: "text-indigo-600 bg-indigo-50",
    };
  if (normalized.includes("game") || normalized.includes("topup"))
    return {
      icon: <Gamepad2 className="w-5 h-5" />,
      color: "text-rose-600 bg-rose-50",
    };
  if (normalized.includes("ott") || normalized.includes("subscription"))
    return {
      icon: <Film className="w-5 h-5" />,
      color: "text-orange-600 bg-orange-50",
    };
  if (normalized.includes("payoneer"))
    return {
      icon: <Globe className="w-5 h-5" />,
      color: "text-emerald-600 bg-emerald-50",
    };
  if (normalized.includes("play point"))
    return {
      icon: <Play className="w-5 h-5" />,
      color: "text-amber-600 bg-amber-50",
    };
  return {
    icon: <Layers className="w-5 h-5" />,
    color: "text-slate-600 bg-slate-50",
  };
};

export function CategoryMarquee() {
  const pathname = usePathname();
  const [categories, setCategories] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function fetchCategories() {
      const { data } = await supabase
        .from("categories")
        .select("id, name, slug")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (data) {
        const processed = data.map((cat) => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          ...getCategoryStyle(cat.name),
        }));
        setCategories(processed);
      }
    }
    fetchCategories();
  }, []);

  // FIX: Hide on Dashboard/Admin
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) {
    return null;
  }

  return <CategoryMarqueeClient categories={categories} />;
}
