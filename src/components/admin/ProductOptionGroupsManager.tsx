"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Plus,
    Trash2,
    Loader2,
    GripVertical,
    Sliders,
    CheckCircle,
    ExternalLink,
} from "lucide-react";
import Link from "next/link";
import type { OptionGroup, ProductOptionGroup } from "@/types/ppom";

interface ProductOptionGroupsManagerProps {
    productId: string;
}

export function ProductOptionGroupsManager({
    productId,
}: ProductOptionGroupsManagerProps) {
    const [assignedGroups, setAssignedGroups] = useState<(ProductOptionGroup & { option_group: OptionGroup })[]>([]);
    const [availableGroups, setAvailableGroups] = useState<OptionGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [toggling, setToggling] = useState<Set<string>>(new Set());
    const [selectedGroupId, setSelectedGroupId] = useState("");
    const router = useRouter();

    useEffect(() => {
        fetchData();
    }, [productId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/products/option-groups?productId=${productId}`);
            const data = await res.json();
            setAssignedGroups(data.assigned || []);
            setAvailableGroups(data.available || []);
        } catch (err) {
            console.error("Error fetching option groups:", err);
        }
        setLoading(false);
    };

    const handleAdd = async () => {
        if (!selectedGroupId) return;
        setAdding(true);
        const res = await fetch("/api/admin/products/option-groups", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                product_id: productId,
                group_id: selectedGroupId,
                is_required: true,
                sort_order: assignedGroups.length,
            }),
        });
        if (!res.ok) {
            const json = await res.json();
            alert(json.error || "Failed to add option group");
        } else {
            setSelectedGroupId("");
            fetchData();
            router.refresh();
        }
        setAdding(false);
    };

    const handleRemove = async (id: string) => {
        if (!confirm("Remove this option group from the product?")) return;
        const res = await fetch(`/api/admin/products/option-groups?id=${id}`, { method: "DELETE" });
        if (!res.ok) {
            const json = await res.json();
            alert(json.error || "Failed to remove option group");
        } else {
            fetchData();
            router.refresh();
        }
    };

    const handleToggleRequired = async (id: string, currentValue: boolean) => {
        if (toggling.has(id)) return;
        setToggling(prev => new Set(prev).add(id));

        const res = await fetch("/api/admin/products/option-groups", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, is_required: !currentValue }),
        });

        if (res.ok) {
            setAssignedGroups((prev) =>
                prev.map((g) => (g.id === id ? { ...g, is_required: !currentValue } : g))
            );
            router.refresh();
        }

        setToggling(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Add Group */}
            <div className="flex gap-3">
                <select
                    value={selectedGroupId}
                    onChange={(e) => setSelectedGroupId(e.target.value)}
                    className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    disabled={availableGroups.length === 0}
                >
                    <option value="">
                        {availableGroups.length === 0
                            ? "No available groups"
                            : "Select an option group to add..."}
                    </option>
                    {availableGroups.map((group) => (
                        <option key={group.id} value={group.id}>
                            {group.name}
                        </option>
                    ))}
                </select>
                <button
                    onClick={handleAdd}
                    disabled={!selectedGroupId || adding}
                    className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium transition-colors"
                >
                    {adding ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Plus className="w-4 h-4" />
                    )}
                    Add
                </button>
                <Link
                    href="/admin/options/new"
                    className="px-4 py-2.5 border border-slate-300 text-slate-600 rounded-xl hover:bg-slate-50 flex items-center gap-2 font-medium transition-colors"
                >
                    <ExternalLink className="w-4 h-4" />
                    Create New
                </Link>
            </div>

            {/* Assigned Groups */}
            {assignedGroups.length === 0 ? (
                <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    <Sliders className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                    <p className="font-medium">No option groups assigned</p>
                    <p className="text-sm">Add option groups to enable product customization</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {assignedGroups.map((pog, idx) => (
                        <div
                            key={pog.id}
                            className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200"
                        >
                            <div className="text-slate-400 cursor-grab">
                                <GripVertical className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <div className="font-medium text-slate-800">
                                    {pog.option_group?.name}
                                </div>
                                <div className="text-sm text-slate-500">
                                    {pog.option_group?.display_type} • {pog.option_group?.selection_type}
                                </div>
                            </div>
                            <button
                                onClick={() => handleToggleRequired(pog.id, pog.is_required)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${pog.is_required
                                    ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                    }`}
                            >
                                <CheckCircle className="w-4 h-4" />
                                {pog.is_required ? "Required" : "Optional"}
                            </button>
                            <button
                                onClick={() => handleRemove(pog.id)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
