// PPOM Utility Functions
// Price calculation, validation, and combination matching

import {
    OptionGroup,
    Option,
    OptionCombination,
    OptionSelections,
    PriceCalculation,
    ParsedCombination,
} from '@/types/ppom';

/**
 * Calculate the total price based on base price and selected options
 */
export function calculatePrice(
    basePrice: number,
    optionGroups: OptionGroup[],
    selections: OptionSelections
): PriceCalculation {
    const modifiers: PriceCalculation['modifiers'] = [];
    let totalPrice = basePrice;

    for (const group of optionGroups) {
        const selectedValue = selections[group.id];
        if (!selectedValue || !group.options) continue;

        // Handle single or multiple selections
        const selectedIds = Array.isArray(selectedValue) ? selectedValue : [selectedValue];

        for (const optionId of selectedIds) {
            const option = group.options.find(opt => opt.id === optionId);
            if (!option) continue;

            let modifierAmount = 0;
            if (option.price_modifier_type === 'fixed') {
                modifierAmount = option.price_modifier;
            } else if (option.price_modifier_type === 'percentage') {
                modifierAmount = (basePrice * option.price_modifier) / 100;
            }

            if (modifierAmount !== 0) {
                modifiers.push({
                    groupId: group.id,
                    groupName: group.name,
                    optionId: option.id,
                    optionName: option.name,
                    amount: modifierAmount,
                });
                totalPrice += modifierAmount;
            }
        }
    }

    return {
        basePrice,
        modifiers,
        totalPrice: Math.max(0, totalPrice), // Ensure non-negative
    };
}

/**
 * Validate that all required options are selected
 */
export function validateSelections(
    optionGroups: OptionGroup[],
    selections: OptionSelections,
    requiredOverrides?: Record<string, boolean>
): { valid: boolean; missingGroups: OptionGroup[] } {
    const missingGroups: OptionGroup[] = [];

    for (const group of optionGroups) {
        const isRequired = requiredOverrides?.[group.id] ?? group.is_required;
        if (!isRequired) continue;

        const selectedValue = selections[group.id];
        const hasSelection = selectedValue &&
            (Array.isArray(selectedValue) ? selectedValue.length > 0 : true);

        if (!hasSelection) {
            missingGroups.push(group);
        }
    }

    return {
        valid: missingGroups.length === 0,
        missingGroups,
    };
}

/**
 * Find a matching pre-defined combination for the given selections
 */
export function findMatchingCombination(
    combinations: OptionCombination[],
    selections: OptionSelections
): OptionCombination | null {
    // Normalize selections to a comparable format
    const normalizedSelections = normalizeSelections(selections);

    for (const combination of combinations) {
        if (!combination.is_active || !combination.is_available) continue;

        try {
            const comboParsed: ParsedCombination = JSON.parse(combination.combination);
            const normalizedCombo = normalizeSelections(comboParsed);

            if (areSelectionsEqual(normalizedSelections, normalizedCombo)) {
                return combination;
            }
        } catch {
            // Invalid JSON in combination, skip
            continue;
        }
    }

    return null;
}

/**
 * Normalize selections to a consistent format for comparison
 */
function normalizeSelections(
    selections: OptionSelections | ParsedCombination
): Record<string, string[]> {
    const normalized: Record<string, string[]> = {};

    for (const [key, value] of Object.entries(selections)) {
        if (Array.isArray(value)) {
            normalized[key] = [...value].sort();
        } else if (value) {
            normalized[key] = [value];
        }
    }

    return normalized;
}

/**
 * Check if two normalized selections are equal
 */
function areSelectionsEqual(
    a: Record<string, string[]>,
    b: Record<string, string[]>
): boolean {
    const keysA = Object.keys(a).sort();
    const keysB = Object.keys(b).sort();

    if (keysA.length !== keysB.length) return false;
    if (!keysA.every((key, i) => key === keysB[i])) return false;

    for (const key of keysA) {
        const valuesA = a[key];
        const valuesB = b[key];
        if (valuesA.length !== valuesB.length) return false;
        if (!valuesA.every((v, i) => v === valuesB[i])) return false;
    }

    return true;
}

/**
 * Check if an option is available based on stock
 */
export function isOptionAvailable(option: Option): boolean {
    if (!option.is_active) return false;
    if (option.stock_type === 'unlimited' || option.stock_type === 'inherit') return true;
    return option.stock_quantity > 0;
}

/**
 * Check if a combination is available based on stock
 */
export function isCombinationAvailable(combination: OptionCombination): boolean {
    if (!combination.is_active || !combination.is_available) return false;
    if (combination.stock_type === 'unlimited' || combination.stock_type === 'inherit') return true;
    return (combination.stock_quantity - combination.reserved_quantity) > 0;
}

/**
 * Get the effective price for a product with PPOM
 * Returns the combination price if found, otherwise calculated price
 */
export function getEffectivePrice(
    basePrice: number,
    optionGroups: OptionGroup[],
    selections: OptionSelections,
    combinations: OptionCombination[]
): PriceCalculation {
    // First try to find a matching combination
    const matchedCombination = findMatchingCombination(combinations, selections);

    if (matchedCombination) {
        return {
            basePrice: matchedCombination.base_price,
            modifiers: [],
            totalPrice: matchedCombination.calculated_price,
            matchedCombination,
        };
    }

    // Fall back to calculated price
    return calculatePrice(basePrice, optionGroups, selections);
}

/**
 * Generate all possible combinations from option groups
 */
export function generateCombinations(
    optionGroups: OptionGroup[]
): ParsedCombination[] {
    if (optionGroups.length === 0) return [];

    const groupsWithOptions = optionGroups.filter(
        g => g.options && g.options.length > 0 && g.selection_type === 'single'
    );

    if (groupsWithOptions.length === 0) return [];

    // Generate cartesian product of all single-select options
    let result: ParsedCombination[] = [{}];

    for (const group of groupsWithOptions) {
        const newResult: ParsedCombination[] = [];
        for (const existing of result) {
            for (const option of group.options || []) {
                if (!option.is_active) continue;
                newResult.push({
                    ...existing,
                    [group.id]: option.id,
                });
            }
        }
        result = newResult;
    }

    return result;
}

/**
 * Format price for display
 */
export function formatPrice(price: number): string {
    return `Rs. ${price.toLocaleString('en-IN')}`;
}

/**
 * Format price modifier for display (with + or - sign)
 */
export function formatPriceModifier(amount: number): string {
    if (amount === 0) return '';
    const sign = amount > 0 ? '+' : '';
    return `${sign}Rs. ${Math.abs(amount).toLocaleString('en-IN')}`;
}
