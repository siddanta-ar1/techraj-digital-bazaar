// PPOM (Personalized Product Option Manager) Types
// These types match the database schema for the options system

export type DisplayType =
    | 'dropdown'
    | 'radio'
    | 'checkbox'
    | 'color_picker'
    | 'image_picker'
    | 'text_input'
    | 'number_input';

export type SelectionType = 'single' | 'multiple';

export type StockType = 'tracked' | 'unlimited' | 'inherit';

export type PriceModifierType = 'fixed' | 'percentage';

/**
 * Option Group - A category of options (e.g., "Subscription Duration", "Account Type")
 */
export interface OptionGroup {
    id: string;
    name: string;
    slug: string;
    description?: string;
    display_type: DisplayType;
    selection_type: SelectionType;
    is_required: boolean;
    is_active: boolean;
    is_global: boolean;
    sort_order: number;
    created_at: string;
    updated_at: string;
    // Relations
    options?: Option[];
}

/**
 * Option - An individual option value within a group
 */
export interface Option {
    id: string;
    group_id: string;
    name: string;
    slug: string;
    description?: string;
    display_value?: string;
    color_code?: string;
    image_url?: string;
    icon?: string;
    price_modifier: number;
    price_modifier_type: PriceModifierType;
    stock_type: StockType;
    stock_quantity: number;
    low_stock_threshold: number;
    min_value?: number;
    max_value?: number;
    validation_regex?: string;
    is_default: boolean;
    is_active: boolean;
    sort_order: number;
    created_at: string;
    updated_at: string;
}

/**
 * Product Option Group - Links a product to an option group
 */
export interface ProductOptionGroup {
    id: string;
    product_id: string;
    group_id: string;
    is_required: boolean;
    sort_order: number;
    created_at: string;
    // Relations
    option_group?: OptionGroup;
}

/**
 * Option Combination - Pre-defined combination of options with specific SKU/price/stock
 */
export interface OptionCombination {
    id: string;
    product_id: string;
    combination: string; // JSON string of selected option IDs
    sku?: string;
    variant_name?: string;
    base_price: number;
    calculated_price: number;
    stock_type: StockType;
    stock_quantity: number;
    reserved_quantity: number;
    is_available: boolean;
    availability_date?: string;
    meta_title?: string;
    meta_description?: string;
    featured_image?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

/**
 * Parsed combination - The combination field parsed from JSON
 */
export interface ParsedCombination {
    [groupId: string]: string; // groupId -> optionId
}

/**
 * Option Rule - Conditional logic for options (display, pricing, validation)
 */
export interface OptionRule {
    id: string;
    product_id: string;
    name: string;
    description?: string;
    conditions: string; // JSON array of conditions
    actions: string; // JSON array of actions
    rule_type: 'conditional_display' | 'conditional_pricing' | 'validation' | 'stock_control';
    priority: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

/**
 * User Option Selection - Saved user selections for a product
 */
export interface UserOptionSelection {
    id: string;
    user_id: string;
    product_id: string;
    selections: string; // JSON object of selections
    session_id?: string;
    is_saved: boolean;
    is_wishlist: boolean;
    calculated_price?: number;
    price_calculated_at?: string;
    created_at: string;
    updated_at: string;
}

/**
 * Extended Product type with PPOM fields
 */
export interface PPOMProduct {
    id: string;
    name: string;
    slug: string;
    description?: string;
    category_id?: string;
    featured_image?: string;
    gallery_images: string[];
    is_featured: boolean;
    is_active: boolean;
    has_variants: boolean;
    requires_manual_delivery: boolean;
    delivery_instructions?: string;
    created_at: string;
    updated_at: string;
    // PPOM-specific fields
    ppom_enabled: boolean;
    legacy_variants_enabled: boolean;
    auto_generate_combinations: boolean;
    min_price?: number;
    max_price?: number;
    // Relations
    category?: {
        id: string;
        name: string;
        slug: string;
    };
    product_option_groups?: ProductOptionGroup[];
    option_combinations?: OptionCombination[];
}

/**
 * User's current option selections (for UI state)
 */
export interface OptionSelections {
    [groupId: string]: string | string[]; // single selection = string, multiple = string[]
}

/**
 * Calculated pricing result
 */
export interface PriceCalculation {
    basePrice: number;
    modifiers: {
        groupId: string;
        groupName: string;
        optionId: string;
        optionName: string;
        amount: number;
    }[];
    totalPrice: number;
    matchedCombination?: OptionCombination;
}
