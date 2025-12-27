"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Upload, Loader2, Save, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface ProductFormProps {
  initialData?: any;
  categories: any[];
}

export function ProductForm({ initialData, categories }: ProductFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    slug: initialData?.slug || "",
    description: initialData?.description || "",
    category_id: initialData?.category_id || "",
    featured_image: initialData?.featured_image || "",
    is_active: initialData?.is_active ?? true,
    is_featured: initialData?.is_featured ?? false,
    requires_manual_delivery: initialData?.requires_manual_delivery ?? false,
    delivery_instructions: initialData?.delivery_instructions || "",
  });

  // NEW: Quick Variant State (Only for creation)
  const [basePrice, setBasePrice] = useState("");

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      if (
        name === "name" &&
        (!prev.slug || prev.slug === generateSlug(prev.name))
      ) {
        newData.slug = generateSlug(value);
      }
      return newData;
    });
  };

  // NEW: Image Upload Handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    setUploading(true);
    const file = e.target.files[0];
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `product-images/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from("products") // Make sure 'products' bucket exists
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("products").getPublicUrl(filePath);

      setFormData((prev) => ({ ...prev, featured_image: data.publicUrl }));
    } catch (error: any) {
      alert("Error uploading image: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let productId = initialData?.id;

      const dataToSave = {
        ...formData,
        updated_at: new Date().toISOString(),
      };

      if (initialData?.id) {
        // Update
        const { error } = await supabase
          .from("products")
          .update(dataToSave)
          .eq("id", initialData.id);
        if (error) throw error;
      } else {
        // Create
        const { data: newProduct, error } = await supabase
          .from("products")
          .insert([dataToSave])
          .select()
          .single();

        if (error) throw error;
        productId = newProduct.id;

        // NEW: Create default variant if price provided
        if (basePrice) {
          await supabase.from("product_variants").insert({
            product_id: productId,
            variant_name: "Standard",
            price: parseFloat(basePrice),
            stock_type: "unlimited",
            sort_order: 0,
            is_active: true,
          });
        }
      }

      router.push("/admin/products");
      router.refresh();
    } catch (error) {
      alert("Error saving product");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <Link
          href="/admin/products"
          className="flex items-center text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Link>
        <button
          type="submit"
          disabled={loading || uploading}
          className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {initialData ? "Update Product" : "Create Product"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
            <h3 className="font-semibold text-slate-900">Basic Information</h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Product Name
              </label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Slug
              </label>
              <input
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border rounded-lg bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={5}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
          </div>

          {/* NEW: Price Field for new products */}
          {!initialData && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-2">Pricing</h3>
              <p className="text-sm text-slate-500 mb-4">
                This will create a default "Standard" variant. You can add more
                variants after creating.
              </p>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Base Price (Rs)
              </label>
              <input
                type="number"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="0.00"
              />
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
            <h3 className="font-semibold text-slate-900">Organization</h3>
            <select
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
            <h3 className="font-semibold text-slate-900">Media</h3>

            {/* NEW: File Upload UI */}
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:bg-slate-50 transition-colors relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload className="h-6 w-6 text-slate-400 mx-auto mb-2" />
              <p className="text-xs text-slate-500">
                {uploading ? "Uploading..." : "Click to upload image"}
              </p>
            </div>

            <div className="flex gap-2 items-center">
              <span className="text-xs text-slate-400">OR</span>
              <input
                name="featured_image"
                value={formData.featured_image}
                onChange={handleChange}
                placeholder="Paste URL"
                className="flex-1 px-3 py-1.5 border rounded text-sm"
              />
            </div>

            {formData.featured_image && (
              <div className="relative h-40 w-full rounded-lg overflow-hidden border">
                <Image
                  src={formData.featured_image}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
