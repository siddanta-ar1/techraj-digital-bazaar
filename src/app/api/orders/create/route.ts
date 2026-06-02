import { createClient, createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { sendOrderEmail } from "@/lib/resend";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { calculatePromoDiscount } from "@/lib/promoUtils";

const ALLOWED_PAYMENT_METHODS = new Set(["wallet", "esewa", "khalti", "bank_transfer"]);
const MAX_ITEMS_PER_ORDER = 20;
const MAX_QTY_PER_ITEM = 99;

// ---------------------------------------------------------------------------
// Rollback helper — undoes every committed side effect in reverse order.
// Safe to call at any stage: operations on rows that don't exist yet are
// no-ops (DELETE / UPDATE with 0 matches returns successfully).
// ---------------------------------------------------------------------------
type AdminClient = ReturnType<typeof createAdminClient>;

interface RollbackCtx {
  admin: AdminClient;
  userId: string;
  orderId: string;
  serverFinalAmount: number;
  paymentMethod: string;
  isFullDiscount: boolean;
  usedProductCodeId?: string | null;
  promoId: string | null;
}

async function rollbackOrderSideEffects(
  ctx: RollbackCtx,
  deleteOrder = false,
): Promise<void> {
  // Wrapped in a top-level try/catch so that a network-level throw from any
  // Supabase call can never escape to the outer catch in POST, which would
  // trigger a second decrement_promo_usage on an already-rolled-back promo.
  try {
    if (deleteOrder) {
      const { error } = await ctx.admin.from("orders").delete().eq("id", ctx.orderId);
      if (error) console.error("[rollback] order delete failed — MANUAL RECOVERY NEEDED orderId:", ctx.orderId, error.message);
    }
    if (ctx.paymentMethod === "wallet" && !ctx.isFullDiscount) {
      const { error: rbW } = await ctx.admin.rpc("increment_wallet", {
        p_user_id: ctx.userId,
        p_amount: ctx.serverFinalAmount,
      });
      if (rbW) console.error("[rollback] increment_wallet failed — MANUAL RECOVERY NEEDED orderId:", ctx.orderId, rbW.message);
      // Safe even when the wallet_transactions insert never succeeded — DELETE on 0 rows is a no-op.
      const { error: rbT } = await ctx.admin
        .from("wallet_transactions")
        .delete()
        .eq("reference_id", ctx.orderId)
        .eq("transaction_type", "purchase");
      if (rbT) console.error("[rollback] wallet_transactions delete failed — MANUAL RECOVERY NEEDED orderId:", ctx.orderId, rbT.message);
    }
    if (ctx.usedProductCodeId) {
      const { error } = await ctx.admin
        .from("product_codes")
        .update({ is_used: false, order_id: null, used_at: null })
        .eq("id", ctx.usedProductCodeId);
      if (error) console.error("[rollback] gift card unmark failed:", error.message);
    }
    // Safe at any stage — returns 0 rows if code claiming hasn't run yet.
    // used_at: null keeps codes fully clean for inventory queries filtering on used_at IS NULL.
    const { error: rbC } = await ctx.admin
      .from("product_codes")
      .update({ is_used: false, order_id: null, used_at: null })
      .eq("order_id", ctx.orderId);
    if (rbC) console.error("[rollback] product_codes unmark failed:", rbC.message);
    if (ctx.promoId) {
      const { error } = await ctx.admin.rpc("decrement_promo_usage", { promo_id: ctx.promoId });
      if (error) console.error("[rollback] decrement_promo_usage failed:", error.message);
    }
  } catch (err: any) {
    console.error("[rollback] unexpected throw in rollbackOrderSideEffects — orderId:", ctx.orderId, err?.message);
  }
}

export async function POST(request: Request) {
  // Rate limit: 5 orders per minute per IP — prevents spam/double-submit
  const ip = getClientIp(request);
  const rl = checkRateLimit(`order:${ip}`, 5, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before placing another order." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetInMs / 1000)) } },
    );
  }

  // Declared before try so the outer catch can access them for promo rollback (P16).
  // createAdminClient() is a synchronous constructor with no I/O — safe to call here.
  const admin = createAdminClient();
  let promoId: string | null = null;

  try {
    const supabase = await createClient();

    // 1. AUTHENTICATE USER
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. PARSE REQUEST — amounts are NOT accepted from the client; computed server-side below
    const orderData = await request.json();
    const {
      items,
      paymentMethod,
      deliveryDetails,
      paymentScreenshotUrl,
      paymentMeta,
      promoCode,
    } = orderData;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Order must contain items" }, { status: 400 });
    }
    if (items.length > MAX_ITEMS_PER_ORDER) {
      return NextResponse.json({ error: `Order cannot exceed ${MAX_ITEMS_PER_ORDER} items` }, { status: 400 });
    }

    if (!paymentMethod || !ALLOWED_PAYMENT_METHODS.has(paymentMethod)) {
      return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });
    }

    // Validate per-item quantity
    for (const item of items) {
      if (item.quantity > MAX_QTY_PER_ITEM) {
        return NextResponse.json({ error: `Quantity cannot exceed ${MAX_QTY_PER_ITEM} per item` }, { status: 400 });
      }
    }

    // Sanitize promoCode — strip to 50 chars, uppercase, alphanumeric + dash/underscore only
    const sanitizedPromoCode = typeof promoCode === "string"
      ? promoCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 50) || null
      : null;

    // 3. FETCH AUTHORITATIVE PRICES FROM DB (never trust client-supplied price)
    const variantIds: string[] = [...new Set(
      items.map((i: any) => i.variantId).filter(Boolean),
    )];
    const combinationIds: string[] = [...new Set(
      items.map((i: any) => i.combinationId).filter(Boolean),
    )];

    const [variantResult, combinationResult] = await Promise.all([
      variantIds.length > 0
        ? admin
            .from("product_variants")
            .select("id, price, is_active, product_id")
            .in("id", variantIds)
        : Promise.resolve({ data: [] as any[], error: null }),
      combinationIds.length > 0
        ? admin
            .from("option_combinations")
            .select("id, calculated_price, is_active, product_id")
            .in("id", combinationIds)
        : Promise.resolve({ data: [] as any[], error: null }),
    ]);

    if (variantResult.error) {
      return NextResponse.json({ error: "Failed to verify product prices" }, { status: 500 });
    }

    const variantPriceMap = new Map(
      (variantResult.data ?? []).map((v: any) => [v.id, v]),
    );
    const combinationPriceMap = new Map(
      (combinationResult.data ?? []).map((c: any) => [c.id, c]),
    );

    // Resolve server-authoritative unit price for each item
    type ResolvedItem = {
      variantId: string;
      combinationId: string | null;
      quantity: number;
      unitPrice: number;
      productName: string;
      variantName: string;
      optionSelections: Record<string, string | string[]> | null;
    };

    const MAX_OPTION_SELECTIONS_BYTES = 2048;

    const resolvedItems: ResolvedItem[] = [];
    for (const item of items) {
      if (!item.variantId || !Number.isInteger(item.quantity) || item.quantity < 1) {
        return NextResponse.json(
          { error: "Invalid item: missing variantId or quantity" },
          { status: 400 },
        );
      }

      const variant = variantPriceMap.get(item.variantId) as any;
      if (!variant || !variant.is_active) {
        return NextResponse.json(
          { error: "One or more products are unavailable" },
          { status: 400 },
        );
      }

      let combination = null;
      if (item.combinationId) {
        combination = combinationPriceMap.get(item.combinationId) as any;
        if (!combination) {
          return NextResponse.json(
            { error: "Invalid product configuration" },
            { status: 400 },
          );
        }
        // Verify the combination belongs to the same product as the variant.
        // Without this, a user could pass a cheap combination from a different product.
        if (combination.product_id !== variant.product_id) {
          return NextResponse.json(
            { error: "Invalid product configuration" },
            { status: 400 },
          );
        }
        if (!combination.is_active) {
          return NextResponse.json(
            { error: "One or more products are unavailable" },
            { status: 400 },
          );
        }
      }

      // Validate optionSelections: must be a plain object, capped at 2 KB
      let safeOptionSelections: Record<string, string | string[]> | null = null;
      if (item.optionSelections != null) {
        if (
          typeof item.optionSelections !== "object" ||
          Array.isArray(item.optionSelections)
        ) {
          return NextResponse.json({ error: "Invalid option selections" }, { status: 400 });
        }
        const serialized = JSON.stringify(item.optionSelections);
        if (serialized.length > MAX_OPTION_SELECTIONS_BYTES) {
          return NextResponse.json({ error: "Option selections too large" }, { status: 400 });
        }
        safeOptionSelections = item.optionSelections as Record<string, string | string[]>;
      }

      // combination price takes precedence; falls back to variant base price
      const unitPrice = combination?.calculated_price ?? variant.price;

      resolvedItems.push({
        variantId: item.variantId,
        combinationId: item.combinationId || null,
        quantity: item.quantity,
        unitPrice,
        productName: typeof item.productName === "string" ? item.productName.slice(0, 200) : "Product",
        variantName: typeof item.variantName === "string" ? item.variantName.slice(0, 200) : "Standard",
        optionSelections: safeOptionSelections,
      });
    }

    // Compute server-side total
    const serverTotalAmount = resolvedItems.reduce(
      (sum, i) => sum + i.unitPrice * i.quantity,
      0,
    );

    // ---------------------------------------------------------
    // 4. PROMO CODE — validate AND recompute discount server-side
    // ---------------------------------------------------------
    let serverDiscountAmount = 0;

    if (sanitizedPromoCode) {
      const { data: promo, error: promoError } = await admin
        .from("promo_codes")
        .select(
          "id, discount_type, discount_value, min_order_amount, max_discount_amount, usage_limit, usage_count, expires_at, is_active",
        )
        .eq("code", sanitizedPromoCode)
        .eq("is_active", true)
        .maybeSingle();

      if (promoError || !promo) {
        return NextResponse.json({ error: "Invalid or expired promo code" }, { status: 400 });
      }
      if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
        return NextResponse.json({ error: "Promo code has expired" }, { status: 400 });
      }
      if (serverTotalAmount < (promo.min_order_amount || 0)) {
        return NextResponse.json(
          { error: `Minimum order of Rs. ${promo.min_order_amount} required` },
          { status: 400 },
        );
      }
      if (promo.usage_limit && promo.usage_count >= promo.usage_limit) {
        return NextResponse.json({ error: "Promo code usage limit reached" }, { status: 400 });
      }

      // Recompute discount server-side — shared utility keeps in sync with /api/promo/validate
      serverDiscountAmount = calculatePromoDiscount(serverTotalAmount, promo);

      promoId = promo.id;

      // Increment usage before order creation to reduce race conditions
      const { error: incrementError } = await admin.rpc("increment_promo_usage", {
        promo_id: promoId,
      });
      if (incrementError) {
        return NextResponse.json({ error: "Failed to apply promo code" }, { status: 400 });
      }
    }

    const serverFinalAmount = Math.max(0, serverTotalAmount - serverDiscountAmount);

    // 5. DERIVE PAYMENT STATE
    // P14: Never override the user's paymentMethod to "wallet" for fully-discounted orders.
    // Storing the wrong payment_method corrupts the audit trail and breaks refund routing
    // for esewa/khalti orders where the 100% promo means nothing was actually charged.
    const isFullDiscount = serverFinalAmount === 0;
    const isInstantPayment = isFullDiscount || paymentMethod === "wallet";

    // 6. GENERATE ORDER ID
    const orderNumber = `TR-${crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;
    const orderId = crypto.randomUUID();

    // Shared rollback context — passed to rollbackOrderSideEffects at every error site
    const rbCtx: RollbackCtx = {
      admin,
      userId: user.id,
      orderId,
      serverFinalAmount,
      paymentMethod,
      isFullDiscount,
      usedProductCodeId: paymentMeta?.usedProductCodeId,
      promoId,
    };

    // 7. HANDLE INVENTORY CODE USAGE (gift card applied as payment)
    if (paymentMeta?.usedProductCodeId) {
      const { data: markedRows, error: markUsedError } = await admin
        .from("product_codes")
        .update({
          is_used: true,
          order_id: orderId,
          used_at: new Date().toISOString(),
        })
        .eq("id", paymentMeta.usedProductCodeId)
        .eq("is_used", false)
        .select("id");

      // 0 rows matched means the code was already claimed by a concurrent request.
      if (markUsedError || !markedRows || markedRows.length === 0) {
        if (markUsedError) console.error("[gift card] mark-used error:", markUsedError.message);
        if (promoId) {
          const { error: rbPromo } = await admin.rpc("decrement_promo_usage", { promo_id: promoId });
          if (rbPromo) console.error("[rollback] decrement_promo_usage failed:", rbPromo.message);
        }
        return NextResponse.json({ error: "Gift card has already been used" }, { status: 400 });
      }
    }

    // 8. WALLET PAYMENT DEDUCTION
    if (paymentMethod === "wallet" && !isFullDiscount) {
      const { data: balanceAfterDeduction, error: deductionError } = await admin.rpc("deduct_wallet_balance", {
        user_id: user.id,
        amount: serverFinalAmount,
      });

      if (deductionError) {
        if (paymentMeta?.usedProductCodeId) {
          const { error: rbGift } = await admin
            .from("product_codes")
            .update({ is_used: false, order_id: null, used_at: null })
            .eq("id", paymentMeta.usedProductCodeId);
          if (rbGift) console.error("[rollback] gift card unmark failed:", rbGift.message);
        }
        if (promoId) {
          const { error: rbPromo } = await admin.rpc("decrement_promo_usage", { promo_id: promoId });
          if (rbPromo) console.error("[rollback] decrement_promo_usage failed:", rbPromo.message);
        }
        return NextResponse.json(
          { error: "Insufficient balance or payment failed" },
          { status: 400 },
        );
      }

      // P4: Check the error — a silent failure leaves the wallet debited with no ledger record
      const { error: txnInsertError } = await admin.from("wallet_transactions").insert({
        user_id: user.id,
        amount: serverFinalAmount,
        type: "debit",
        transaction_type: "purchase",
        reference_id: orderId,
        description: `Order #${orderNumber}`,
        status: "completed",
        balance_after: balanceAfterDeduction ?? 0,
      });

      if (txnInsertError) {
        console.error("[wallet_transactions] debit insert failed:", txnInsertError.message, "orderId:", orderId);
        await rollbackOrderSideEffects(rbCtx);
        return NextResponse.json({ error: "Failed to record payment transaction" }, { status: 500 });
      }
    }

    // ---------------------------------------------------------
    // 9. ATOMIC DIGITAL DELIVERY
    // ---------------------------------------------------------
    // P8: Aggregate total quantity per unique variantId before calling claim_product_codes_atomic.
    // Submitting two cart items with the same variantId caused two concurrent RPCs on the same
    // code pool — with SKIP LOCKED the second could claim 0 codes without error, orphaning
    // codes already marked is_used=true by the first call.
    const variantQtyMap = new Map<string, number>();
    for (const item of resolvedItems) {
      variantQtyMap.set(item.variantId, (variantQtyMap.get(item.variantId) ?? 0) + item.quantity);
    }

    const claimedCodesMap = new Map<string, string[]>();
    if (isInstantPayment) {
      await Promise.all(
        [...variantQtyMap.entries()].map(async ([variantId, totalQty]) => {
          try {
            const { data: claimedCodes, error: claimError } = await admin.rpc(
              "claim_product_codes_atomic",
              {
                p_variant_id: variantId,
                p_quantity: totalQty,
                p_order_id: orderId,
              },
            );
            if (!claimError && claimedCodes && claimedCodes.length === totalQty) {
              claimedCodesMap.set(variantId, claimedCodes);
            }
          } catch {
            // Non-fatal: item proceeds with pending delivery
          }
        }),
      );
    }

    // Distribute claimed codes back to individual cart items in their original order
    const codeCursors = new Map<string, number>();
    const processedItems: any[] = [];
    const emailItems: any[] = [];

    for (const item of resolvedItems) {
      const codes = claimedCodesMap.get(item.variantId);
      const cursor = codeCursors.get(item.variantId) ?? 0;
      let assignedCode: string | null = null;
      let itemStatus = "pending";

      if (codes && cursor + item.quantity <= codes.length) {
        assignedCode = codes.slice(cursor, cursor + item.quantity).join(", ");
        itemStatus = "completed";
        codeCursors.set(item.variantId, cursor + item.quantity);
      }

      processedItems.push({
        order_id: orderId,
        variant_id: item.variantId,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.unitPrice * item.quantity,
        status: itemStatus,
        delivered_code: assignedCode,
        combination_id: item.combinationId,
        option_selections: item.optionSelections,
      });

      emailItems.push({
        productName: item.productName,
        variantName: item.variantName,
        quantity: item.quantity,
        delivered_code: assignedCode,
        optionSelections: item.optionSelections,
      });
    }

    const allDelivered = processedItems.every((i) => i.status === "completed");
    const orderStatus = isInstantPayment && allDelivered ? "completed" : "pending";

    // 10. CREATE ORDER
    // P14: store paymentMethod (user's original choice), not an "effective" override
    const { data: createdOrder, error: orderError } = await admin
      .from("orders")
      .insert([
        {
          id: orderId,
          order_number: orderNumber,
          user_id: user.id,
          total_amount: serverTotalAmount,
          discount_amount: serverDiscountAmount,
          final_amount: serverFinalAmount,
          promo_code: sanitizedPromoCode,
          status: orderStatus,
          payment_method: paymentMethod,
          payment_status: isInstantPayment ? "paid" : "pending",
          payment_screenshot_url: paymentScreenshotUrl,
          delivery_details: {
            ...deliveryDetails,
            transaction_id: paymentMeta?.transactionId,
            amount_paid: paymentMeta?.amountPaid,
          },
        },
      ])
      .select("order_number")
      .single();

    if (orderError) {
      console.error("[order] insert failed:", orderError.message, "orderId:", orderId);
      await rollbackOrderSideEffects(rbCtx);
      // Return directly — do NOT throw. Throwing would re-enter the outer catch which
      // would attempt a second decrement_promo_usage on an already-rolled-back promo.
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }

    // 11. INSERT ORDER ITEMS
    // P1: Full rollback on order_items failure — without this the user was charged and
    // codes were consumed but no usable order existed.
    const { error: itemsError } = await admin
      .from("order_items")
      .insert(processedItems);

    if (itemsError) {
      console.error("[order_items] insert failed:", itemsError.message, "orderId:", orderId);
      await rollbackOrderSideEffects(rbCtx, true /* deleteOrder */);
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }

    const finalOrderNumber = createdOrder?.order_number || orderNumber;

    // 12. SEND EMAIL
    if (user.email) {
      await sendOrderEmail(user.email, finalOrderNumber, serverFinalAmount, emailItems);
    }

    return NextResponse.json({
      success: true,
      orderId,
      orderNumber: finalOrderNumber,
      finalAmount: serverFinalAmount,
      discountAmount: serverDiscountAmount,
      paymentStatus: isInstantPayment ? "paid" : "pending",
      orderStatus,
    });
  } catch (error: any) {
    console.error("Order creation error:", error);
    // P16: Safety net for unexpected throws that bypassed all explicit error paths.
    // All known failure paths (gift card, wallet, txn insert, order insert, order_items insert)
    // return directly and handle their own rollbacks — they never reach here.
    // This catch exists for truly unexpected exceptions (e.g. RPC throws synchronously).
    if (promoId) {
      const { error: rbPromo } = await admin.rpc("decrement_promo_usage", { promo_id: promoId });
      if (rbPromo) console.error("[rollback] outer-catch decrement_promo_usage failed:", rbPromo.message);
    }
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
