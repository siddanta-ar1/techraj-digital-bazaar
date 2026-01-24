"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
    ArrowLeft,
    Save,
    Loader2,
    Sliders,
    Plus,
    Trash2,
    GripVertical,
    Palette,
    Image as ImageIcon,
} from "lucide-react";
import Link from "next/link";
import type { OptionGroup, Option, DisplayType, SelectionType, PriceModifierType, StockType } from "@/types/ppom";

const displayTypes: { value: DisplayType; label: string; description: string }[] = [
    { value: "dropdown", label: "Dropdown", description: "Select from a dropdown list" },
    { value: "radio", label: "Radio Buttons", description: "Single selection radio buttons" },
    { value: "checkbox", label: "Checkboxes", description: "Multiple selection checkboxes" },
    { value: "color_picker", label: "Color Picker", description: "Visual color selection" },
    { value: "image_picker", label: "Image Picker", description: "Select from images" },
    { value: "text_input", label: "Text Input", description: "Free text entry" },
    { value: "number_input", label: "Number Input", description: "Numeric value entry" },
];

interface OptionFormData {
    id?: string;
    name: string;
    slug: string;
    description: string;
    display_value: string;
    color_code: string;
    image_url: string;
    price_modifier: number;
    price_modifier_type: PriceModifierType;
    stock_type: StockType;
    stock_quantity: number;
    is_default: boolean;
    is_active: boolean;
    sort_order: number;
}

const defaultOption: OptionFormData = {
    name: "",
    slug: "",
    description: "",
    display_value: "",
    color_code: "",
    image_url: "",
    price_modifier: 0,
    price_modifier_type: "fixed",
    stock_type: "inherit",
    stock_quantity: 0,
    is_default: false,
    is_active: true,
    sort_order: 0,
};

interface OptionGroupFormProps {
    groupId?: string;
}

export function OptionGroupForm({ groupId }: OptionGroupFormProps) {
    const router = useRouter();
    const supabase = createClient();
    const isEditing = !!groupId;

    const [loading, setLoading] = useState(isEditing);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        description: "",
        display_type: "dropdown" as DisplayType,
        selection_type: "single" as SelectionType,
        is_required: true,
        is_global: true,
        is_active: true,
        sort_order: 0,
    });

    const [options, setOptions] = useState<OptionFormData[]>([]);
    const [deletedOptionIds, setDeletedOptionIds] = useState<string[]>([]);

    useEffect(() => {
        if (isEditing) {
            fetchOptionGroup();
        }
    }, [groupId]);

    const fetchOptionGroup = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("option_groups")
            .select(`*, options:options(*)`)
            .eq("id", groupId)
            .single();

        if (error || !data) {
            console.error("Error fetching option group:", error);
            router.push("/admin/options");
            return;
        }

        setFormData({
            name: data.name,
            slug: data.slug,
            description: data.description || "",
            display_type: data.display_type,
            selection_type: data.selection_type,
            is_required: data.is_required,
            is_global: data.is_global,
            is_active: data.is_active,
            sort_order: data.sort_order,
        });

        if (data.options) {
            setOptions(
                data.options.sort((a: Option, b: Option) => a.sort_order - b.sort_order).map((opt: Option) => ({
                    id: opt.id,
                    name: opt.name,
                    slug: opt.slug,
                    description: opt.description || "",
                    display_value: opt.display_value || "",
                    color_code: opt.color_code || "",
                    image_url: opt.image_url || "",
                    price_modifier: opt.price_modifier,
                    price_modifier_type: opt.price_modifier_type,
                    stock_type: opt.stock_type,
                    stock_quantity: opt.stock_quantity,
                    is_default: opt.is_default,
                    is_active: opt.is_active,
                    sort_order: opt.sort_order,
                }))
            );
        }

        setLoading(false);
    };

    const generateSlug = (name: string) => {
        return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        setFormData((prev) => {
            const newData = {
                ...prev,
                [name]: type === "checkbox" ? checked : value,
            };

            if (name === "name" && !isEditing) {
                newData.slug = generateSlug(value);
            }

            return newData;
        });

        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: "" }));
        }
    };

    const addOption = () => {
        setOptions((prev) => [
            ...prev,
            { ...defaultOption, sort_order: prev.length },
        ]);
    };

    const updateOption = (index: number, field: keyof OptionFormData, value: any) => {
        setOptions((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };

            if (field === "name" && !updated[index].id) {
                updated[index].slug = generateSlug(value as string);
            }

            return updated;
        });
    };

    const removeOption = (index: number) => {
        const option = options[index];
        if (option.id) {
            setDeletedOptionIds((prev) => [...prev, option.id!]);
        }
        setOptions((prev) => prev.filter((_, i) => i !== index));
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) newErrors.name = "Name is required";
        if (!formData.slug.trim()) newErrors.slug = "Slug is required";

        // Validate options
        options.forEach((opt, idx) => {
            if (!opt.name.trim()) {
                newErrors[`option_${idx}_name`] = "Option name is required";
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setSaving(true);

        try {
            let groupIdToUse = groupId;

            if (isEditing) {
                // Update group
                const { error } = await supabase
                    .from("option_groups")
                    .update({
                        ...formData,
                        updated_at: new Date().toISOString(),
                    })
                    .eq("id", groupId);

                if (error) throw error;
            } else {
                // Create group
                const { data, error } = await supabase
                    .from("option_groups")
                    .insert([formData])
                    .select()
                    .single();

                if (error) throw error;
                groupIdToUse = data.id;
            }

            // Delete removed options
            if (deletedOptionIds.length > 0) {
                await supabase.from("options").delete().in("id", deletedOptionIds);
            }

            // Upsert options
            for (let i = 0; i < options.length; i++) {
                const opt = options[i];
                const optionData = {
                    group_id: groupIdToUse,
                    name: opt.name,
                    slug: opt.slug || generateSlug(opt.name),
                    description: opt.description || null,
                    display_value: opt.display_value || null,
                    color_code: opt.color_code || null,
                    image_url: opt.image_url || null,
                    price_modifier: opt.price_modifier,
                    price_modifier_type: opt.price_modifier_type,
                    stock_type: opt.stock_type,
                    stock_quantity: opt.stock_quantity,
                    is_default: opt.is_default,
                    is_active: opt.is_active,
                    sort_order: i,
                };

                if (opt.id) {
                    await supabase
                        .from("options")
                        .update({ ...optionData, updated_at: new Date().toISOString() })
                        .eq("id", opt.id);
                } else {
                    await supabase.from("options").insert([optionData]);
                }
            }

            router.push("/admin/options");
        } catch (error: any) {
            console.error("Error saving:", error);
            setErrors({ submit: error.message || "Failed to save. Please try again." });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link
                        href="/admin/options"
                        className="p-2 hover:bg-white rounded-lg transition-colors border border-slate-200"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-600" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                            <Sliders className="h-8 w-8 text-indigo-600" />
                            {isEditing ? "Edit Option Group" : "Create Option Group"}
                        </h1>
                        <p className="text-slate-500 mt-1">
                            {isEditing ? "Update option group and its values" : "Create a new option group with values"}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-slate-100">
                            <h2 className="text-lg font-semibold text-slate-800">Basic Information</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Group Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none ${errors.name ? "border-red-300" : "border-slate-300"
                                            }`}
                                        placeholder="e.g., Subscription Duration"
                                    />
                                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Slug *</label>
                                    <input
                                        type="text"
                                        name="slug"
                                        value={formData.slug}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none ${errors.slug ? "border-red-300" : "border-slate-300"
                                            }`}
                                        placeholder="subscription-duration"
                                    />
                                    {errors.slug && <p className="text-red-500 text-xs mt-1">{errors.slug}</p>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Description
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={2}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                    placeholder="Optional description for this option group"
                                />
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Display Type
                                    </label>
                                    <select
                                        name="display_type"
                                        value={formData.display_type}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                    >
                                        {displayTypes.map((dt) => (
                                            <option key={dt.value} value={dt.value}>
                                                {dt.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Selection Type
                                    </label>
                                    <select
                                        name="selection_type"
                                        value={formData.selection_type}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                    >
                                        <option value="single">Single Selection</option>
                                        <option value="multiple">Multiple Selection</option>
                                    </select>
                                </div>
                            </div>

                            {/* Toggles */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                                {[
                                    { name: "is_required", label: "Required" },
                                    { name: "is_global", label: "Global" },
                                    { name: "is_active", label: "Active" },
                                ].map((toggle) => (
                                    <div key={toggle.name} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                name={toggle.name}
                                                checked={(formData as any)[toggle.name]}
                                                onChange={handleChange}
                                                className="sr-only peer"
                                            />
                                            <div className="w-10 h-5 bg-slate-200 peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                                        </label>
                                        <span className="text-sm font-medium text-slate-700">{toggle.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Options */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-slate-100 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-slate-800">Options ({options.length})</h2>
                            <button
                                type="button"
                                onClick={addOption}
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Add Option
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            {options.length === 0 ? (
                                <div className="text-center py-8 text-slate-500">
                                    <p className="mb-4">No options yet. Add your first option.</p>
                                    <button
                                        type="button"
                                        onClick={addOption}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add Option
                                    </button>
                                </div>
                            ) : (
                                options.map((opt, idx) => (
                                    <div
                                        key={idx}
                                        className="border border-slate-200 rounded-xl p-4 bg-slate-50/50"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="pt-3 text-slate-400 cursor-grab">
                                                <GripVertical className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 space-y-4">
                                                <div className="grid md:grid-cols-3 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-medium text-slate-600 mb-1">
                                                            Name *
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={opt.name}
                                                            onChange={(e) => updateOption(idx, "name", e.target.value)}
                                                            className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ${errors[`option_${idx}_name`] ? "border-red-300" : "border-slate-300"
                                                                }`}
                                                            placeholder="Option name"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-slate-600 mb-1">
                                                            Price Modifier
                                                        </label>
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="number"
                                                                value={opt.price_modifier}
                                                                onChange={(e) => updateOption(idx, "price_modifier", parseFloat(e.target.value) || 0)}
                                                                className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                                                placeholder="0"
                                                            />
                                                            <select
                                                                value={opt.price_modifier_type}
                                                                onChange={(e) => updateOption(idx, "price_modifier_type", e.target.value)}
                                                                className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                                                            >
                                                                <option value="fixed">Rs.</option>
                                                                <option value="percentage">%</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-slate-600 mb-1">
                                                            Stock Type
                                                        </label>
                                                        <select
                                                            value={opt.stock_type}
                                                            onChange={(e) => updateOption(idx, "stock_type", e.target.value)}
                                                            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                                                        >
                                                            <option value="inherit">Inherit</option>
                                                            <option value="unlimited">Unlimited</option>
                                                            <option value="tracked">Tracked</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                {/* Conditional fields based on display type */}
                                                {formData.display_type === "color_picker" && (
                                                    <div className="flex items-center gap-4">
                                                        <Palette className="w-4 h-4 text-slate-400" />
                                                        <input
                                                            type="color"
                                                            value={opt.color_code || "#000000"}
                                                            onChange={(e) => updateOption(idx, "color_code", e.target.value)}
                                                            className="w-10 h-10 rounded border border-slate-300 cursor-pointer"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={opt.color_code}
                                                            onChange={(e) => updateOption(idx, "color_code", e.target.value)}
                                                            className="px-3 py-2 text-sm border border-slate-300 rounded-lg w-28"
                                                            placeholder="#FF0000"
                                                        />
                                                    </div>
                                                )}

                                                {formData.display_type === "image_picker" && (
                                                    <div className="flex items-center gap-4">
                                                        <ImageIcon className="w-4 h-4 text-slate-400" />
                                                        <input
                                                            type="text"
                                                            value={opt.image_url}
                                                            onChange={(e) => updateOption(idx, "image_url", e.target.value)}
                                                            className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg"
                                                            placeholder="Image URL"
                                                        />
                                                    </div>
                                                )}

                                                <div className="flex items-center gap-4">
                                                    <label className="flex items-center gap-2 text-sm">
                                                        <input
                                                            type="checkbox"
                                                            checked={opt.is_default}
                                                            onChange={(e) => updateOption(idx, "is_default", e.target.checked)}
                                                            className="rounded border-slate-300"
                                                        />
                                                        Default
                                                    </label>
                                                    <label className="flex items-center gap-2 text-sm">
                                                        <input
                                                            type="checkbox"
                                                            checked={opt.is_active}
                                                            onChange={(e) => updateOption(idx, "is_active", e.target.checked)}
                                                            className="rounded border-slate-300"
                                                        />
                                                        Active
                                                    </label>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeOption(idx)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Error */}
                    {errors.submit && (
                        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">
                            {errors.submit}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-4">
                        <Link
                            href="/admin/options"
                            className="px-6 py-3 text-slate-600 hover:text-slate-800 font-medium rounded-xl hover:bg-slate-100 transition-colors"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg flex items-center gap-2"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    {isEditing ? "Update" : "Create"} Option Group
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
