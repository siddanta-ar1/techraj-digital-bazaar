"use client";

import { useState, useEffect, useMemo } from "react";
import { Check, AlertCircle } from "lucide-react";
import type {
    OptionGroup,
    Option,
    OptionCombination,
    OptionSelections,
    ProductOptionGroup,
} from "@/types/ppom";
import {
    getEffectivePrice,
    validateSelections,
    formatPriceModifier,
    isCombinationAvailable,
} from "@/lib/ppom-utils";

interface PPOMSelectorProps {
    optionGroups: (ProductOptionGroup & { option_group: OptionGroup & { options: Option[] } })[];
    combinations: OptionCombination[];
    basePrice: number;
    onSelectionChange: (selections: OptionSelections, price: number, combinationId?: string) => void;
}

export function PPOMSelector({
    optionGroups,
    combinations,
    basePrice,
    onSelectionChange,
}: PPOMSelectorProps) {
    // Initialize with default selections
    const getDefaultSelections = (): OptionSelections => {
        const defaults: OptionSelections = {};
        for (const pog of optionGroups) {
            const group = pog.option_group;
            if (!group?.options) continue;

            const defaultOption = group.options.find((o) => o.is_default && o.is_active);
            if (defaultOption) {
                defaults[group.id] = defaultOption.id;
            } else if (group.options.length > 0 && group.is_required) {
                const firstActive = group.options.find((o) => o.is_active);
                if (firstActive) {
                    defaults[group.id] = firstActive.id;
                }
            }
        }
        return defaults;
    };

    const [selections, setSelections] = useState<OptionSelections>(getDefaultSelections);
    const [validationErrors, setValidationErrors] = useState<OptionGroup[]>([]);

    // Calculate effective price based on selections
    const priceResult = useMemo(() => {
        const groups = optionGroups.map((pog) => pog.option_group).filter(Boolean) as OptionGroup[];
        return getEffectivePrice(basePrice, groups, selections, combinations);
    }, [optionGroups, selections, combinations, basePrice]);

    // Notify parent of selection changes
    useEffect(() => {
        onSelectionChange(
            selections,
            priceResult.totalPrice,
            priceResult.matchedCombination?.id
        );
    }, [selections, priceResult, onSelectionChange]);

    const handleSelect = (groupId: string, optionId: string, selectionType: "single" | "multiple") => {
        setSelections((prev) => {
            if (selectionType === "single") {
                return { ...prev, [groupId]: optionId };
            } else {
                // Multiple selection (checkbox)
                const current = (prev[groupId] as string[]) || [];
                const updated = current.includes(optionId)
                    ? current.filter((id) => id !== optionId)
                    : [...current, optionId];
                return { ...prev, [groupId]: updated };
            }
        });

        // Clear validation errors
        setValidationErrors([]);
    };

    const validate = (): boolean => {
        const groups = optionGroups.map((pog) => pog.option_group).filter(Boolean) as OptionGroup[];
        const requiredOverrides = Object.fromEntries(
            optionGroups.map((pog) => [pog.group_id, pog.is_required])
        );
        const result = validateSelections(groups, selections, requiredOverrides);
        setValidationErrors(result.missingGroups);
        return result.valid;
    };

    const isOptionSelected = (groupId: string, optionId: string): boolean => {
        const value = selections[groupId];
        if (Array.isArray(value)) {
            return value.includes(optionId);
        }
        return value === optionId;
    };

    const renderOptionGroup = (pog: ProductOptionGroup & { option_group: OptionGroup & { options: Option[] } }) => {
        const group = pog.option_group;
        if (!group || !group.options) return null;

        const activeOptions = group.options.filter((o) => o.is_active);
        const hasError = validationErrors.some((g) => g.id === group.id);

        return (
            <div key={group.id} className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                    <label className="text-sm font-semibold text-slate-700">
                        {group.name}
                    </label>
                    {pog.is_required && (
                        <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                            Required
                        </span>
                    )}
                    {hasError && (
                        <span className="text-xs font-medium text-red-600 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Please select
                        </span>
                    )}
                </div>

                {group.display_type === "radio" || group.display_type === "dropdown" ? (
                    <div className="space-y-2">
                        {activeOptions.map((option) => (
                            <button
                                key={option.id}
                                type="button"
                                onClick={() => handleSelect(group.id, option.id, "single")}
                                className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left ${isOptionSelected(group.id, option.id)
                                    ? "border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600"
                                    : "border-slate-100 hover:border-slate-300 bg-slate-50/30"
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    {group.display_type === "radio" && (
                                        <div
                                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isOptionSelected(group.id, option.id)
                                                ? "border-indigo-600 bg-indigo-600"
                                                : "border-slate-300"
                                                }`}
                                        >
                                            {isOptionSelected(group.id, option.id) && (
                                                <div className="w-2 h-2 rounded-full bg-white" />
                                            )}
                                        </div>
                                    )}
                                    <div>
                                        <span className="font-medium text-slate-900">
                                            {option.name}
                                        </span>
                                        {option.description && (
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                {option.description}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {option.price_modifier !== 0 && (
                                        <span className={`text-sm font-semibold ${option.price_modifier > 0 ? "text-green-600" : "text-red-600"
                                            }`}>
                                            {formatPriceModifier(
                                                option.price_modifier_type === "percentage"
                                                    ? (basePrice * option.price_modifier) / 100
                                                    : option.price_modifier
                                            )}
                                        </span>
                                    )}
                                    {isOptionSelected(group.id, option.id) && (
                                        <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                                            <Check className="w-4 h-4 text-white" />
                                        </div>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                ) : group.display_type === "color_picker" ? (
                    <div className="flex flex-wrap gap-3">
                        {activeOptions.map((option) => (
                            <button
                                key={option.id}
                                type="button"
                                onClick={() => handleSelect(group.id, option.id, "single")}
                                className={`relative w-10 h-10 rounded-full border-2 transition-all ${isOptionSelected(group.id, option.id)
                                    ? "border-indigo-600 ring-2 ring-indigo-300 scale-110"
                                    : "border-slate-200 hover:scale-105"
                                    }`}
                                style={{ backgroundColor: option.color_code || "#ccc" }}
                                title={option.name}
                            >
                                {isOptionSelected(group.id, option.id) && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Check className="w-5 h-5 text-white drop-shadow-lg" />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                ) : group.display_type === "checkbox" ? (
                    <div className="space-y-2">
                        {activeOptions.map((option) => (
                            <button
                                key={option.id}
                                type="button"
                                onClick={() => handleSelect(group.id, option.id, "multiple")}
                                className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left ${isOptionSelected(group.id, option.id)
                                    ? "border-indigo-600 bg-indigo-50/50"
                                    : "border-slate-100 hover:border-slate-300 bg-slate-50/30"
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`w-5 h-5 rounded border-2 flex items-center justify-center ${isOptionSelected(group.id, option.id)
                                            ? "border-indigo-600 bg-indigo-600"
                                            : "border-slate-300"
                                            }`}
                                    >
                                        {isOptionSelected(group.id, option.id) && (
                                            <Check className="w-3 h-3 text-white" />
                                        )}
                                    </div>
                                    <span className="font-medium text-slate-900">{option.name}</span>
                                </div>
                                {option.price_modifier !== 0 && (
                                    <span className={`text-sm font-semibold ${option.price_modifier > 0 ? "text-green-600" : "text-red-600"
                                        }`}>
                                        {formatPriceModifier(
                                            option.price_modifier_type === "percentage"
                                                ? (basePrice * option.price_modifier) / 100
                                                : option.price_modifier
                                        )}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                ) : group.display_type === "text_input" ? (
                    // Text input for user data like FreeFire UID
                    <input
                        type="text"
                        value={(selections[group.id] as string) || ""}
                        onChange={(e) => {
                            setSelections((prev) => ({
                                ...prev,
                                [group.id]: e.target.value,
                            }));
                            setValidationErrors([]);
                        }}
                        className={`w-full px-4 py-3 border rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 outline-none ${hasError ? "border-red-300" : "border-slate-300"
                            }`}
                        placeholder={group.description || `Enter ${group.name}...`}
                    />
                ) : group.display_type === "number_input" ? (
                    // Number input
                    <input
                        type="number"
                        value={(selections[group.id] as string) || ""}
                        onChange={(e) => {
                            setSelections((prev) => ({
                                ...prev,
                                [group.id]: e.target.value,
                            }));
                            setValidationErrors([]);
                        }}
                        className={`w-full px-4 py-3 border rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 outline-none ${hasError ? "border-red-300" : "border-slate-300"
                            }`}
                        placeholder={group.description || `Enter ${group.name}...`}
                    />
                ) : (
                    // Default: dropdown
                    <select
                        value={(selections[group.id] as string) || ""}
                        onChange={(e) => handleSelect(group.id, e.target.value, "single")}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                        <option value="">Select {group.name}...</option>
                        {activeOptions.map((option) => (
                            <option key={option.id} value={option.id}>
                                {option.name}
                                {option.price_modifier !== 0 &&
                                    ` (${formatPriceModifier(
                                        option.price_modifier_type === "percentage"
                                            ? (basePrice * option.price_modifier) / 100
                                            : option.price_modifier
                                    )})`}
                            </option>
                        ))}
                    </select>
                )}
            </div>
        );
    };

    return (
        <div>
            {optionGroups
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((pog) => renderOptionGroup(pog))}

            {/* Price breakdown */}
            {priceResult.modifiers.length > 0 && (
                <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="text-sm text-slate-500 space-y-1">
                        <div className="flex justify-between">
                            <span>Base price</span>
                            <span>Rs. {basePrice.toLocaleString("en-IN")}</span>
                        </div>
                        {priceResult.modifiers.map((mod, idx) => (
                            <div key={idx} className="flex justify-between text-indigo-600">
                                <span>{mod.optionName}</span>
                                <span>{formatPriceModifier(mod.amount)}</span>
                            </div>
                        ))}
                        <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-200">
                            <span>Total</span>
                            <span>Rs. {priceResult.totalPrice.toLocaleString("en-IN")}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Combination availability warning */}
            {priceResult.matchedCombination && !isCombinationAvailable(priceResult.matchedCombination) && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-medium">This combination is currently out of stock</span>
                </div>
            )}
        </div>
    );
}
