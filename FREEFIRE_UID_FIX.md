# 🔍 FreeFire UI ID Not Showing - Root Cause & Solution

## Problem Description

When users try to buy FreeFire Diamonds, the UI ID input field is **not visible** on the product page, even though the PPOM (Product Page Option Modifiers) system is designed to support custom user inputs like UI IDs.

---

## Root Cause Analysis

### The Issue

The PPOM system requires a **two-step setup process**:

1. **Step 1**: Create a **global option group** (e.g., "FreeFire UI ID")
2. **Step 2**: Assign that option group to the **FreeFire Diamond product**

**The problem**: The FreeFire Diamond product likely doesn't have the UI ID option group **assigned to it**, so the input field doesn't appear on the product page.

### How PPOM Works (Simplified)

```
Product Page → Check if ppom_enabled = true
    ↓
Query product_option_groups table for this product
    ↓
Find linked option_groups
    ↓
Load the actual options from option_groups table
    ↓
Display inputs (text_input, number_input, select, etc.)
    ↓
If NO option groups assigned → No inputs shown
```

---

## How to Fix This

### Step 1: Create Global Option Group for UI ID

1. Go to **Admin Panel** → **Product Options**
2. Click **Add New Option Group**
3. Fill in:
   - **Name**: `FreeFire UID` (or `User ID`)
   - **Description**: `Enter your FreeFire User ID`
   - **Display Type**: `text_input` (allows user to type their UID)
   - **Is Global**: ✅ Yes
   - **Is Active**: ✅ Yes

4. Click **Create**

### Step 2: Assign to FreeFire Diamond Product

1. Go to **Admin Panel** → **Products**
2. Find and click **FreeFire Diamonds** product
3. Scroll to **Product Options (PPOM)** section
4. Toggle **Enable Product Options** → ✅ ON
5. Scroll down to **Option Groups** section
6. Click **Add Option Group**
7. Select **FreeFire UID** from dropdown
8. Click **Add**

---

## Result

After completing these steps:

✅ When users visit the FreeFire Diamond product page:
- They'll see the "Customize Your Order" section
- The UI ID input field will appear
- They can enter their FreeFire User ID
- The order will be saved with their customization

---

## Code Reference

### Where PPOM Inputs Are Configured

**File**: `src/components/products/PPOMSelector.tsx`

```typescript
// This shows text_input for UI ID
if (group.display_type === "text_input") {
  <input
    type="text"
    value={(selections[group.id] as string) || ""}
    placeholder={group.description || `Enter ${group.name}...`}
  />
}
```

### How Product Fetches Option Groups

**File**: `src/app/(shop)/products/[slug]/page.tsx`

```typescript
if (product.ppom_enabled) {
  // Fetch option groups assigned to this product
  const { data: pogData } = await supabase
    .from("product_option_groups")  // ← Looks here
    .select(`*,option_group:option_groups(...)`)
    .eq("product_id", product.id)
}
```

**If `product_option_groups` is empty** → No UI ID field shown!

---

## Admin Panel Steps (Screenshots Guide)

### Step 1: Create Option Group
```
Admin → Product Options (or Admin → Options)
  ↓
Click "Add New Option Group"
  ↓
Name: FreeFire UID
Description: Enter your FreeFire User ID
Display Type: Text Input
Is Global: YES
Is Active: YES
  ↓
Save
```

### Step 2: Assign to Product
```
Admin → Products
  ↓
Click FreeFire Diamond product
  ↓
Scroll to "Product Options (PPOM)"
  ↓
Toggle "Enable Product Options" → ON
  ↓
Scroll to "Option Groups"
  ↓
Click "Add Option Group"
  ↓
Select "FreeFire UID"
  ↓
Save
```

---

## Verification

After setup, test by:

1. Visit: `/products/freefire-diamonds` (or search for FreeFire product)
2. You should see:
   - **"Customize Your Order"** section
   - **Text input** with placeholder "Enter FreeFire UID..."
3. Enter test UID (e.g., "123456789")
4. Click "Buy Now"
5. Go to checkout and verify UID is saved

---

## Troubleshooting

### Problem: Option group still not showing

**Check:**
1. Is `ppom_enabled = true` for FreeFire Diamond product?
   - Admin → Products → Edit FreeFire → Check "Enable Product Options"

2. Is the option group "globally active"?
   - Admin → Product Options → Check "Is Active" ✅

3. Is it assigned to the product?
   - Admin → Products → Edit FreeFire → Option Groups → Should list it

### Problem: Input appears but not saving

**Check:**
1. Run `npm run migrate:ppom` to ensure database columns exist
2. Verify `option_selections` column exists in `order_items` table

---

## Related Features

This PPOM system also supports:

- **Selection options** (dropdown with multiple choices)
- **Number inputs** (quantity selector)
- **Price modifiers** (dynamic pricing based on selection)
- **Required fields** validation
- **Auto-generated combinations** for inventory tracking

---

## Database Tables Involved

```sql
-- Global template for option groups
option_groups
  - id (uuid)
  - name (text) - "FreeFire UID"
  - description (text)
  - display_type (text) - "text_input", "number_input", "select"
  - is_global (bool) - true
  - is_active (bool) - true

-- Links option group to product
product_option_groups
  - id (uuid)
  - product_id (uuid) - FreeFire Diamonds product
  - group_id (uuid) - FreeFire UID option group
  - sort_order (int)

-- Stores the actual UID entered by user
order_items
  - option_selections (jsonb)
    Example: {"group_id": "123...": "987654321"}
```

---

## Summary

**Why UI ID isn't showing:**
- Option group not created OR not assigned to product

**How to fix:**
1. Create "FreeFire UID" option group in Admin Panel
2. Assign it to FreeFire Diamond product
3. Test

**Time to implement**: ~5 minutes

---

This is a **configuration issue**, not a bug. The PPOM system works perfectly once properly set up! 🚀
