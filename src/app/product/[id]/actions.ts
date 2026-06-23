"use server";

import { supabaseAdmin } from "@/lib/supabase";

export async function createPendingOrder(
  productId: string,
  merchantId: string,
  price: number
): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from("orders")
    .insert({
      product_id: productId,
      merchant_id: merchantId,
      quantity: 1,
      total_amount: price,
      status: "AWAITING_QUANTITY",
      chat_history: [],
      buyer_phone: null,
      payment_ref: null,
      auto_release_at: null,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("Error creating pending order:", error);
    throw new Error(error?.message || "Failed to initialize order");
  }

  return data.id;
}
