/**
 * Single source of truth for promo discount calculation.
 * Used by both /api/promo/validate and /api/orders/create so the
 * preview amount shown to the user always matches what is charged.
 */
export function calculatePromoDiscount(
  totalAmount: number,
  promo: {
    discount_type: "percentage" | "fixed";
    discount_value: number;
    max_discount_amount?: number | null;
  },
): number {
  let discount = 0;
  if (promo.discount_type === "percentage") {
    discount = (totalAmount * promo.discount_value) / 100;
    if (promo.max_discount_amount) {
      discount = Math.min(discount, promo.max_discount_amount);
    }
  } else {
    discount = promo.discount_value;
  }
  return Math.min(discount, totalAmount);
}
