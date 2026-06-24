import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productId, merchantId, price } = body;

    if (!productId || !merchantId || typeof price !== "number") {
      return NextResponse.json(
        { error: "Missing or invalid required fields" },
        { status: 400 }
      );
    }

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
      console.error("Error creating pending order via API:", error);
      return NextResponse.json(
        { error: error?.message || "Failed to initialize order" },
        { status: 500 }
      );
    }

    return NextResponse.json({ orderId: data.id });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Internal Server Error";
    console.error("API orders route error:", err);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
