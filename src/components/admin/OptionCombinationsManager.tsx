"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
    Loader2,
    RefreshCw,
    Save,
    Package,
    DollarSign,
    ToggleLeft,
    ToggleRight,
} from "lucide-react";
import type { OptionCombination, OptionGroup, ProductOptionGroup } from "@/types/ppom";

interface OptionCombinationsManagerProps {
    productId: string;
}

interface CombinationDisplay extends OptionCombination {
    optionNames: string[];
}

export function OptionCombinationsManager({
    productId,
}: OptionCombinationsManagerProps) {
    const [combinations, setCombinations] = useState<CombinationDisplay[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [saving, setSaving] = useState<string | null>(null);
    const [optionGroups, setOptionGroups] = useState<(ProductOptionGroup & { option_group: OptionGroup & { options: any[] } })[]>([]);
    const supabase = createClient();

    useEffect(() => {
        fetchData();
    }, [productId]);

    const fetchData = async () => {
        setLoading(true);

        // Fetch option groups with options
        const { data: groups } = await supabase
            .from("product_option_groups")
            .select(`
        *,
        option_group:option_groups(
          *,
          options:options(*)
        )
      `)
            .eq("product_id", productId)
            .order("sort_order");

        setOptionGroups(groups || []);

        // Fetch combinations
        const { data: combos } = await supabase
            .from("option_combinations")
            .select("*")
            .eq("product_id", productId)
            .order("created_at");

        // Parse combinations and add option names
        const allOptions = (groups || []).flatMap((g: any) => g.option_group?.options || []);
        const optionMap = new Map(allOptions.map((o: any) => [o.id, o.name]));

        const displayCombos: CombinationDisplay[] = (combos || []).map((c) => {
            let optionIds: string[] = [];
            try {
                const parsed = JSON.parse(c.combination);
                optionIds = Object.values(parsed) as string[];
            } catch { }

            return {
                ...c,
                optionNames: optionIds.map((id) => optionMap.get(id) || id),
            };
        });

        setCombinations(displayCombos);
        setLoading(false);
    };

    const generateCombinations = async () => {
        if (optionGroups.length === 0) {
            alert("Please assign option groups first");
            return;
        }

        if (!confirm("This will generate all possible combinations. Existing combinations will be kept. Continue?")) {
            return;
        }

        setGenerating(true);

        // Get all options from each single-select group
        const singleSelectGroups = optionGroups.filter(
            (g) => g.option_group?.selection_type === "single"
        );

        if (singleSelectGroups.length === 0) {
            alert("No single-select option groups to generate combinations from");
            setGenerating(false);
            return;
        }

        // Generate cartesian product
        let result: Record<string, string>[] = [{}];
        for (const group of singleSelectGroups) {
            const newResult: Record<string, string>[] = [];
            const options = group.option_group?.options?.filter((o: any) => o.is_active) || [];

            for (const existing of result) {
                for (const option of options) {
                    newResult.push({
                        ...existing,
                        [group.group_id]: option.id,
                    });
                }
            }
            result = newResult;
        }

        // Get existing combinations to avoid duplicates
        const existingCombos = new Set(combinations.map((c) => c.combination));

        // Insert new combinations
        const newCombos = result.filter(
            (combo) => !existingCombos.has(JSON.stringify(combo))
        );

        if (newCombos.length === 0) {
            alert("All combinations already exist");
            setGenerating(false);
            return;
        }

        const toInsert = newCombos.map((combo, idx) => ({
            product_id: productId,
            combination: JSON.stringify(combo),
            base_price: 0,
            calculated_price: 0,
            stock_type: "unlimited" as const,
            stock_quantity: 0,
            is_available: true,
            is_active: true,
        }));

        const { error } = await supabase.from("option_combinations").insert(toInsert);

        if (error) {
            console.error("Error generating combinations:", error);
            alert("Failed to generate combinations");
        } else {
            fetchData();
        }

        setGenerating(false);
    };

    const updateCombination = async (id: string, field: string, value: any) => {
        setSaving(id);

        const { error } = await supabase
            .from("option_combinations")
            .update({ [field]: value, updated_at: new Date().toISOString() })
            .eq("id", id);

        if (error) {
            console.error("Error updating:", error);
        } else {
            setCombinations((prev) =>
                prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
            );
        }

        setSaving(null);
    };

    const deleteCombination = async (id: string) => {
        if (!confirm("Delete this combination?")) return;

        const { error } = await supabase
            .from("option_combinations")
            .delete()
            .eq("id", id);

        if (error) {
            console.error("Error deleting:", error);
        } else {
            setCombinations((prev) => prev.filter((c) => c.id !== id));
        }
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
            {/* Actions */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">
                    {combinations.length} combination{combinations.length !== 1 ? "s" : ""}
                </p>
                <button
                    onClick={generateCombinations}
                    disabled={generating || optionGroups.length === 0}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                >
                    {generating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <RefreshCw className="w-4 h-4" />
                    )}
                    Generate Combinations
                </button>
            </div>

            {/* Combinations List */}
            {combinations.length === 0 ? (
                <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    <Package className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                    <p className="font-medium">No combinations yet</p>
                    <p className="text-sm">
                        {optionGroups.length === 0
                            ? "Assign option groups first, then generate combinations"
                            : "Click 'Generate Combinations' to create all possible options"}
                    </p>
                </div>
            ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                    Options
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                    Price
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                    Stock
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                    Active
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {combinations.map((combo) => (
                                <tr key={combo.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-1">
                                            {combo.optionNames.map((name, idx) => (
                                                <span
                                                    key={idx}
                                                    className="px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-full"
                                                >
                                                    {name}
                                                </span>
                                            ))}
                                        </div>
                                        {combo.sku && (
                                            <div className="text-xs text-slate-400 mt-1">
                                                SKU: {combo.sku}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1">
                                            <DollarSign className="w-4 h-4 text-slate-400" />
                                            <input
                                                type="number"
                                                value={combo.calculated_price}
                                                onChange={(e) =>
                                                    updateCombination(combo.id, "calculated_price", parseFloat(e.target.value) || 0)
                                                }
                                                className="w-24 px-2 py-1 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <select
                                            value={combo.stock_type}
                                            onChange={(e) => updateCombination(combo.id, "stock_type", e.target.value)}
                                            className="px-2 py-1 text-sm border border-slate-300 rounded-lg bg-white"
                                        >
                                            <option value="unlimited">Unlimited</option>
                                            <option value="tracked">Tracked</option>
                                            <option value="inherit">Inherit</option>
                                        </select>
                                        {combo.stock_type === "tracked" && (
                                            <input
                                                type="number"
                                                value={combo.stock_quantity}
                                                onChange={(e) =>
                                                    updateCombination(combo.id, "stock_quantity", parseInt(e.target.value) || 0)
                                                }
                                                className="w-16 ml-2 px-2 py-1 text-sm border border-slate-300 rounded-lg"
                                                placeholder="Qty"
                                            />
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <button
                                            onClick={() => updateCombination(combo.id, "is_active", !combo.is_active)}
                                            className={`p-1 rounded-lg transition-colors ${combo.is_active
                                                    ? "text-green-600 hover:bg-green-50"
                                                    : "text-slate-400 hover:bg-slate-100"
                                                }`}
                                        >
                                            {combo.is_active ? (
                                                <ToggleRight className="w-6 h-6" />
                                            ) : (
                                                <ToggleLeft className="w-6 h-6" />
                                            )}
                                        </button>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {saving === combo.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin text-indigo-600 mx-auto" />
                                        ) : (
                                            <button
                                                onClick={() => deleteCombination(combo.id)}
                                                className="text-slate-400 hover:text-red-600 transition-colors"
                                            >
                                                ×
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
