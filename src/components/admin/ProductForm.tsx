"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Upload, Loader2, Save, ArrowLeft, XCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface ProductFormProps {
  initialData?: any;
  categories: any[];
}

export function ProductForm({ initialData, categories }: ProductFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Numeric input state (string-based for better UX)
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
      if (name === "name" && !initialData) {
        newData.slug = generateSlug(value);
      }
      return newData;
    });
  };

  // FIX: Non-blocking Image Upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    if (file.size > 2 * 1024 * 1024) {
      alert("File size must be less than 2MB");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    try {
      setUploading(true);

      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `product-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("products")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("products").getPublicUrl(filePath);
      const newImageUrl = `${data.publicUrl}?t=${Date.now()}`;
      const oldImageUrl = formData.featured_image;

      setFormData((prev) => ({ ...prev, featured_image: newImageUrl }));

      // Background Cleanup
      if (oldImageUrl && oldImageUrl.includes("/products/")) {
        const oldPath = oldImageUrl.split("/products/").pop()?.split("?")[0];
        if (oldPath) {
          supabase.storage
            .from("products")
            .remove([oldPath])
            .then(({ error }) => {
              if (error)
                console.warn("Failed to clean up old image:", error.message);
            });
        }
      }
    } catch (error: any) {
      console.error("Upload Error:", error);
      alert("Failed to upload image: " + (error.message || "Unknown error"));
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // FIX: Strict Validation for UUID fields
      if (!formData.category_id) {
        alert("Please select a category.");
        setLoading(false);
        return;
      }

      let productId = initialData?.id;
      const cleanImageUrl = formData.featured_image?.split("?")[0] || "";

      // FIX: Sanitize Payload (Convert empty strings to null for UUID/Foreign Keys)
      const dataToSave = {
        ...formData,
        category_id: formData.category_id || null, // Safety net
        featured_image: cleanImageUrl,
        updated_at: new Date().toISOString(),
      };

      if (initialData?.id) {
        const { error } = await supabase
          .from("products")
          .update(dataToSave)
          .eq("id", initialData.id);
        if (error) throw error;
      } else {
        const { data: newProduct, error } = await supabase
          .from("products")
          .insert([dataToSave])
          .select()
          .single();

        if (error) throw error;
        productId = newProduct.id;

        // Create Default Variant
        const priceValue = parseFloat(basePrice);
        if (basePrice && !isNaN(priceValue)) {
          await supabase.from("product_variants").insert({
            product_id: productId,
            variant_name: "Standard",
            price: priceValue,
            stock_type: "unlimited",
            sort_order: 0,
            is_active: true,
          });
        }
      }

      router.push("/admin/products");
      router.refresh();
    } catch (error: any) {
      console.error("Save Error:", error);
      alert("Error saving product: " + error.message);
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

          {!initialData && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-2">Pricing</h3>
              <p className="text-sm text-slate-500 mb-4">
                This will create a default "Standard" variant.
              </p>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Base Price (Rs)
              </label>
              <input
                type="number"
                step="0.01"
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

            <div
              className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors relative ${
                uploading
                  ? "bg-slate-50 border-slate-300"
                  : "hover:bg-slate-50 border-slate-300"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
              <div className="flex flex-col items-center justify-center">
                {uploading ? (
                  <>
                    <Loader2 className="h-6 w-6 text-indigo-600 animate-spin mb-2" />
                    <p className="text-xs text-indigo-600 font-medium">
                      Uploading...
                    </p>
                  </>
                ) : (
                  <>
                    <Upload className="h-6 w-6 text-slate-400 mb-2" />
                    <p className="text-xs text-slate-500">
                      {formData.featured_image
                        ? "Click to Replace"
                        : "Click to Upload"}
                    </p>
                  </>
                )}
              </div>
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
              <div className="relative h-40 w-full rounded-lg overflow-hidden border bg-slate-100 group">
                <Image
                  src={formData.featured_image}
                  alt="Preview"
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" // FIX: Added sizes prop
                  className={`object-cover transition-opacity ${uploading ? "opacity-50" : "opacity-100"}`}
                />

                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
                    <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
                  </div>
                )}

                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, featured_image: "" }))
                  }
                  className="absolute top-2 right-2 bg-white/80 p-1 rounded-full text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-600 z-20"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
