import { createAdminClient } from "@/lib/supabase/server";
import type { MetadataRoute } from "next";

const BASE = "https://techrajshop.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Sitemap is generated without a user session (no JWT) so createClient()
  // would return empty data from RLS-protected tables. createAdminClient()
  // bypasses RLS and fetches the full catalog.
  const admin = createAdminClient();

  const [{ data: products }, { data: categories }] = await Promise.all([
    admin
      .from("products")
      .select("slug, updated_at")
      .eq("is_active", true)
      .order("updated_at", { ascending: false }),
    admin
      .from("categories")
      .select("slug, created_at")
      .eq("is_active", true),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE,                    lastModified: new Date(), changeFrequency: "daily",   priority: 1.0 },
    { url: `${BASE}/products`,      lastModified: new Date(), changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE}/privacy`,       lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE}/terms`,         lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE}/refund`,        lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
  ];

  const categoryPages: MetadataRoute.Sitemap = (categories ?? []).map((c) => ({
    url: `${BASE}/products?category=${c.slug}`,
    lastModified: c.created_at ? new Date(c.created_at) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const productPages: MetadataRoute.Sitemap = (products ?? []).map((p) => ({
    url: `${BASE}/products/${p.slug}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...staticPages, ...categoryPages, ...productPages];
}
