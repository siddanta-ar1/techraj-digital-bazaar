"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
    Sliders,
    Plus,
    Edit2,
    Trash2,
    Loader2,
    List,
    Radio,
    CheckSquare,
    Palette,
    Image,
    Type,
    Hash,
    ChevronRight,
    Search,
    Filter,
    Globe,
    Package,
} from "lucide-react";
import type { OptionGroup, DisplayType } from "@/types/ppom";

const displayTypeIcons: Record<DisplayType, React.ElementType> = {
    dropdown: List,
    radio: Radio,
    checkbox: CheckSquare,
    color_picker: Palette,
    image_picker: Image,
    text_input: Type,
    number_input: Hash,
};

const displayTypeLabels: Record<DisplayType, string> = {
    dropdown: "Dropdown",
    radio: "Radio Buttons",
    checkbox: "Checkboxes",
    color_picker: "Color Picker",
    image_picker: "Image Picker",
    text_input: "Text Input",
    number_input: "Number Input",
};

interface Props {
    initialData: OptionGroup[];
}

export default function OptionsClient({ initialData }: Props) {
    const [optionGroups, setOptionGroups] = useState<OptionGroup[]>(initialData);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterGlobal, setFilterGlobal] = useState<"all" | "global" | "product">("all");
    const [deleting, setDeleting] = useState<string | null>(null);
    const supabase = createClient();

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this option group? This will also delete all options within it.")) {
            return;
        }

        setDeleting(id);
        const { error } = await supabase.from("option_groups").delete().eq("id", id);

        if (error) {
            console.error("Error deleting option group:", error);
            alert("Failed to delete option group. It may be in use by products.");
        } else {
            setOptionGroups((prev) => prev.filter((g) => g.id !== id));
        }
        setDeleting(null);
    };

    const filteredGroups = optionGroups.filter((group) => {
        const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            group.slug.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilter = filterGlobal === "all" ||
            (filterGlobal === "global" && group.is_global) ||
            (filterGlobal === "product" && !group.is_global);

        return matchesSearch && matchesFilter;
    });

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                            <Sliders className="h-8 w-8 text-indigo-600" />
                            Product Options
                        </h1>
                        <p className="text-slate-500 mt-1">
                            Manage option groups and their values for product customization
                        </p>
                    </div>
                    <Link
                        href="/admin/options/new"
                        className="inline-flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl"
                    >
                        <Plus className="w-5 h-5" />
                        New Option Group
                    </Link>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search option groups..."
                                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            />
                        </div>

                        {/* Filter */}
                        <div className="flex items-center gap-2">
                            <Filter className="w-5 h-5 text-slate-400" />
                            <select
                                value={filterGlobal}
                                onChange={(e) => setFilterGlobal(e.target.value as "all" | "global" | "product")}
                                className="px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                            >
                                <option value="all">All Groups</option>
                                <option value="global">Global Only</option>
                                <option value="product">Product-Specific</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Option Groups List */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    {filteredGroups.length === 0 ? (
                        <div className="p-12 text-center">
                            <Sliders className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-slate-700 mb-2">No option groups found</h3>
                            <p className="text-slate-500 mb-6">
                                {searchTerm || filterGlobal !== "all"
                                    ? "Try adjusting your search or filter"
                                    : "Create your first option group to get started"}
                            </p>
                            {!searchTerm && filterGlobal === "all" && (
                                <Link
                                    href="/admin/options/new"
                                    className="inline-flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors"
                                >
                                    <Plus className="w-5 h-5" />
                                    Create Option Group
                                </Link>
                            )}
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {filteredGroups.map((group) => {
                                const Icon = displayTypeIcons[group.display_type as DisplayType] || List;
                                const optionCount = (group as any).options?.length || 0;

                                return (
                                    <div
                                        key={group.id}
                                        className="p-5 hover:bg-slate-50 transition-colors"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-3 rounded-xl ${group.is_global ? 'bg-emerald-100' : 'bg-indigo-100'}`}>
                                                    <Icon className={`w-5 h-5 ${group.is_global ? 'text-emerald-600' : 'text-indigo-600'}`} />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-semibold text-slate-900">{group.name}</h3>
                                                        {group.is_global ? (
                                                            <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">
                                                                <Globe className="w-3 h-3" />
                                                                Global
                                                            </span>
                                                        ) : (
                                                            <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 rounded-full">
                                                                <Package className="w-3 h-3" />
                                                                Product
                                                            </span>
                                                        )}
                                                        {group.is_required && (
                                                            <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                                                                Required
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                                                        <span>{displayTypeLabels[group.display_type as DisplayType]}</span>
                                                        <span>•</span>
                                                        <span>{optionCount} option{optionCount !== 1 ? 's' : ''}</span>
                                                        <span>•</span>
                                                        <span className="text-slate-400">{group.slug}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Link
                                                    href={`/admin/options/${group.id}`}
                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                >
                                                    <Edit2 className="w-5 h-5" />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(group.id)}
                                                    disabled={deleting === group.id}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                >
                                                    {deleting === group.id ? (
                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="w-5 h-5" />
                                                    )}
                                                </button>
                                                <Link
                                                    href={`/admin/options/${group.id}`}
                                                    className="p-2 text-slate-400 hover:text-indigo-600"
                                                >
                                                    <ChevronRight className="w-5 h-5" />
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                        <div className="text-2xl font-bold text-slate-900">{optionGroups.length}</div>
                        <div className="text-sm text-slate-500">Total Option Groups</div>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                        <div className="text-2xl font-bold text-emerald-600">
                            {optionGroups.filter(g => g.is_global).length}
                        </div>
                        <div className="text-sm text-slate-500">Global Groups</div>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                        <div className="text-2xl font-bold text-indigo-600">
                            {optionGroups.reduce((acc, g) => acc + ((g as any).options?.length || 0), 0)}
                        </div>
                        <div className="text-sm text-slate-500">Total Options</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
