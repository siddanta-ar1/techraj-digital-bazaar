"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Upload,
  Loader2,
  Save,
  ArrowLeft,
  XCircle,
  Image as ImageIcon,
  Package,
  Settings,
  Info,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import Modal from "@/components/ui/Modal";
import { useModal } from "@/hooks/useModal";

interface ProductFormProps {
  initialData?: any;
  categories: any[];
}

export function ProductForm({ initialData, categories }: ProductFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { modalState, closeModal, showSuccess, showError, showWarning } =
    useModal();

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  };

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => {
      const newData = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };

      // Auto-generate slug from name
      if (name === "name" && !initialData) {
        newData.slug = generateSlug(value);
      }

      return newData;
    });

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Product name is required";
    }

    if (!formData.slug.trim()) {
      newErrors.slug = "Product slug is required";
    }

    if (!formData.category_id) {
      newErrors.category_id = "Please select a category";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Product description is required";
    }

    if (
      formData.requires_manual_delivery &&
      !formData.delivery_instructions.trim()
    ) {
      newErrors.delivery_instructions =
        "Delivery instructions are required for manual delivery";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      showError("File Too Large", "Please select an image smaller than 5MB.");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      showError("Invalid File Type", "Please select a valid image file.");
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

      const {
        data: { publicUrl },
      } = supabase.storage.from("products").getPublicUrl(filePath);

      setFormData((prev) => ({ ...prev, featured_image: publicUrl }));
      showSuccess(
        "Image Uploaded",
        "Product image has been uploaded successfully!",
      );
    } catch (error: any) {
      console.error("Upload error:", error);
      showError(
        "Upload Failed",
        error.message || "Failed to upload image. Please try again.",
      );
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showWarning(
        "Please Fix Errors",
        "Please correct the highlighted fields before submitting.",
      );
      return;
    }

    setLoading(true);

    try {
      // Check for duplicate slug
      const { data: existingProduct } = await supabase
        .from("products")
        .select("id")
        .eq("slug", formData.slug)
        .neq("id", initialData?.id || "");

      if (existingProduct && existingProduct.length > 0) {
        setErrors({ slug: "This slug is already taken" });
        showError(
          "Duplicate Slug",
          "A product with this slug already exists. Please choose a different one.",
        );
        setLoading(false);
        return;
      }

      if (initialData) {
        // Update existing product
        const { error } = await supabase
          .from("products")
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", initialData.id);

        if (error) throw error;

        showSuccess(
          "Product Updated!",
          "The product has been successfully updated.",
          true,
        );

        setTimeout(() => {
          router.push("/admin/products");
        }, 2000);
      } else {
        // Create new product
        const { data, error } = await supabase
          .from("products")
          .insert([formData])
          .select()
          .single();

        if (error) throw error;

        showSuccess(
          "Product Created!",
          "The product has been successfully created. You can now add variants and manage inventory.",
          false,
        );

        setTimeout(() => {
          router.push(`/admin/products/${data.id}`);
        }, 2000);
      }
    } catch (error: any) {
      console.error("Submit error:", error);
      showError(
        "Submission Failed",
        error.message ||
          "Failed to save product. Please check all fields and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const removeImage = () => {
    setFormData((prev) => ({ ...prev, featured_image: "" }));
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/admin/products"
              className="p-2 hover:bg-white rounded-lg transition-colors border border-slate-200"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                <Package className="h-8 w-8 text-indigo-600" />
                {initialData ? "Edit Product" : "Create New Product"}
              </h1>
              <p className="text-slate-500 mt-1">
                {initialData
                  ? "Update product information and settings"
                  : "Add a new product to your inventory"}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-slate-100">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Info className="w-5 h-5 text-indigo-600" />
                Basic Information
              </h2>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Product Name */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors ${
                      errors.name ? "border-red-300" : "border-slate-300"
                    }`}
                    placeholder="e.g. Premium Gaming Account"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                  )}
                </div>

                {/* Product Slug */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    URL Slug *
                  </label>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors ${
                      errors.slug ? "border-red-300" : "border-slate-300"
                    }`}
                    placeholder="premium-gaming-account"
                  />
                  {errors.slug && (
                    <p className="text-red-500 text-xs mt-1">{errors.slug}</p>
                  )}
                  <p className="text-xs text-slate-500 mt-1">
                    This will be used in the product URL
                  </p>
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Category *
                </label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors ${
                    errors.category_id ? "border-red-300" : "border-slate-300"
                  }`}
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.category_id && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.category_id}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Product Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className={`w-full px-4 py-3 border rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors resize-none ${
                    errors.description ? "border-red-300" : "border-slate-300"
                  }`}
                  placeholder="Describe your product in detail..."
                />
                {errors.description && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.description}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Product Image */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-slate-100">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-indigo-600" />
                Product Image
              </h2>
            </div>

            <div className="p-6">
              <div className="flex flex-col items-center">
                {formData.featured_image ? (
                  <div className="relative mb-4">
                    <Image
                      src={formData.featured_image}
                      alt="Product preview"
                      width={200}
                      height={200}
                      className="rounded-xl object-cover border border-slate-200 shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={handleImageClick}
                    className="w-48 h-48 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-all mb-4"
                  >
                    {uploading ? (
                      <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-2" />
                    ) : (
                      <Upload className="w-8 h-8 text-slate-400 mb-2" />
                    )}
                    <p className="text-sm text-slate-500 text-center">
                      {uploading ? "Uploading..." : "Click to upload image"}
                    </p>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file);
                  }}
                  className="hidden"
                />

                {!formData.featured_image && (
                  <button
                    type="button"
                    onClick={handleImageClick}
                    disabled={uploading}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 font-medium transition-colors flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Upload Image
                  </button>
                )}

                <p className="text-xs text-slate-500 mt-3 text-center">
                  Recommended: 800x600px, JPG or PNG, max 5MB
                </p>
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-slate-100">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-600" />
                Product Settings
              </h2>
            </div>

            <div className="p-6 space-y-6">
              {/* Status Toggles */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div>
                    <h3 className="font-medium text-slate-800">
                      Product Status
                    </h3>
                    <p className="text-sm text-slate-500">
                      Make this product visible to customers
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div>
                    <h3 className="font-medium text-slate-800">
                      Featured Product
                    </h3>
                    <p className="text-sm text-slate-500">
                      Show in featured products section
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_featured"
                      checked={formData.is_featured}
                      onChange={handleChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>

              {/* Manual Delivery */}
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-medium text-slate-800">
                      Manual Delivery
                    </h3>
                    <p className="text-sm text-slate-500">
                      Require manual processing for this product
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="requires_manual_delivery"
                      checked={formData.requires_manual_delivery}
                      onChange={handleChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                  </label>
                </div>

                {formData.requires_manual_delivery && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Delivery Instructions *
                    </label>
                    <textarea
                      name="delivery_instructions"
                      value={formData.delivery_instructions}
                      onChange={handleChange}
                      rows={3}
                      className={`w-full px-4 py-3 border rounded-xl bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors resize-none ${
                        errors.delivery_instructions
                          ? "border-red-300"
                          : "border-slate-300"
                      }`}
                      placeholder="Provide specific instructions for manual delivery..."
                    />
                    {errors.delivery_instructions && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.delivery_instructions}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-200">
            <Link
              href="/admin/products"
              className="px-6 py-3 text-slate-600 hover:text-slate-800 font-medium rounded-xl hover:bg-slate-100 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || uploading}
              className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {initialData ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {initialData ? "Update Product" : "Create Product"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Modal */}
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
        autoClose={modalState.autoClose}
        autoCloseDelay={modalState.autoCloseDelay}
      />
    </div>
  );
}
