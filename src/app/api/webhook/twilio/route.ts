import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { parseIntent } from "@/lib/groq";
import { ChatMessage, Order, Product } from "@/types/database";

function sendTypingIndicator(messageSid: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  
  if (!accountSid || !authToken) {
    console.warn("Missing Twilio credentials for typing indicator");
    return;
  }

  const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');

  fetch('https://messaging.twilio.com/v2/Indicators/Typing.json', {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      messageId: messageSid,
      channel: 'whatsapp'
    })
  }).catch(err => console.error('Failed to trigger typing indicator:', err));
}

async function sendTwilioTemplateMessage(
  to: string,
  from: string,
  contentSid: string,
  contentVariables: Record<string, string>
): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    console.warn("Missing Twilio credentials for sending template message");
    return;
  }

  const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');
  const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        From: from,
        To: to,
        ContentSid: contentSid,
        ContentVariables: JSON.stringify(contentVariables)
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Twilio Template Send HTTP error! status: ${response.status}, details: ${errorText}`);
    } else {
      console.log(`Twilio Template message sent successfully to ${to}`);
    }
  } catch (err) {
    console.error('Failed to send Twilio template message:', err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const rawFrom = (formData.get("From") as string) || "";
    const rawTo = (formData.get("To") as string) || "";
    const messageBody = (formData.get("Body") as string) || "";
    const messageSid = (formData.get("MessageSid") as string) || "";

    if (messageSid) {
      sendTypingIndicator(messageSid);
    }

    // Strip the "whatsapp:" prefix if present
    const buyerPhone = rawFrom.replace(/^whatsapp:/, "");

    if (!buyerPhone || !messageBody) {
      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?>
        <Response>
          <Message>Error: Missing phone number or message body.</Message>
        </Response>`,
        { headers: { "Content-Type": "application/xml" } },
      );
    }

    const db = supabaseAdmin as any;

    // 1. Resolve the active order
    let order: (Order & { products: Product | null }) | null = null;

    const uuidRegex =
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
    const match = messageBody.match(uuidRegex);
    const orderIdInMessage = match ? match[0] : null;

    if (orderIdInMessage) {
      const { data: orderById } = await db
        .from("orders")
        .select("*, products:product_id(*)")
        .eq("id", orderIdInMessage)
        .single();

      if (orderById) {
        const o = orderById as any;
        if (!o.buyer_phone) {
          // 🔥 1. CREATE A PLACEHOLDER PROFILE FIRST TO SATISFY THE FOREIGN KEY RULE
          const { error: profileError } = await db
            .from("profiles")
            .upsert(
              { 
                phone_number: buyerPhone,
                address_line_1: "",
                state: "",
                lga: ""
              }, 
              { onConflict: "phone_number" } // If they already exist somehow, just do nothing
            );

          if (profileError) {
            console.error("FAILED TO CREATE PROFILE:", profileError);
          }

          // 2. NOW LINK THE PHONE NUMBER TO THE ORDER
          const { error: updateError } = await db
            .from("orders")
            .update({ buyer_phone: buyerPhone })
            .eq("id", o.id);

          if (updateError) {
            console.error("SUPABASE UPDATE FAILED:", updateError);
          } else {
            console.log("SUCCESSFULLY LINKED PHONE NUMBER:", buyerPhone);
          }

          o.buyer_phone = buyerPhone;
        }
        order = o;
      }
    }

    if (!order) {
      const { data: activeOrder } = await db
        .from("orders")
        .select("*, products:product_id(*)")
        .eq("buyer_phone", buyerPhone)
        .in("status", [
          "AWAITING_QUANTITY",
          "AWAITING_ADDRESS",
          "AWAITING_PAYMENT",
          "PAID_IN_ESCROW",
          "AWAITING_CONFIRMATION",
        ])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (activeOrder) {
        order = activeOrder as any;
      }
    }

    if (!order || !order.products) {
      const fallbackReply =
        "Welcome to Holdway! It looks like you don't have an active order right now. Please visit one of our storefront single links to choose a product and start checkout.";
      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${fallbackReply}</Message></Response>`,
        { headers: { "Content-Type": "application/xml" } },
      );
    }

    const product = order.products;

    // 2. Append incoming message to chat history
    const userMsg: ChatMessage = {
      role: "user",
      content: messageBody,
      timestamp: new Date().toISOString(),
    };
    const updatedChatHistory = [...(order.chat_history || []), userMsg];

    // Fetch the buyer's profile to see if they have a saved address
    const { data: profile } = await db
      .from("profiles")
      .select("address_line_1, state, lga")
      .eq("phone_number", buyerPhone)
      .maybeSingle();

    // --- INTERCEPT POINT A: FAST-PASS LANE (RETURNING USERS) ---
    if (
      order.status === "AWAITING_ADDRESS" &&
      profile?.address_line_1 &&
      profile?.state &&
      profile?.lga
    ) {
      if (
        /^(yes|use old|use saved|correct|same|forward|confirm|use saved address)$/i.test(
          messageBody.trim(),
        )
      ) {
        const deliveryState = profile.state.toLowerCase().trim();
        const shippingFee = deliveryState.includes("lagos") ? 1500 : 3500;
        const subtotal = order.quantity * product.price;
        const finalTotal = subtotal + shippingFee;

        const confirmationReply = `Awesome! We'll deliver to your saved address: ${profile.address_line_1}, ${profile.lga}, ${profile.state}.\n\n*Order Summary:*\n* ${order.quantity} × ${product.name}: ₦${subtotal.toLocaleString()}\n* Shipping (${deliveryState.includes("lagos") ? "Lagos" : "Nationwide"}): ₦${shippingFee.toLocaleString()}\n* *Total: ₦${finalTotal.toLocaleString()}*\n\n🏦 *Escrow Payment Account:*\n* Bank: Holdway Sandbox Bank\n* Account Number: 9920183741\n* Account Name: Holdway Escrow / Merchant\n\nPlease complete the transfer within 24 hours to secure your order.`;

        const confirmAssistantMsg: ChatMessage = {
          role: "assistant",
          content: confirmationReply,
          timestamp: new Date().toISOString(),
        };
        const finalHistory = [...updatedChatHistory, confirmAssistantMsg];

        await db
          .from("orders")
          .update({
            status: "AWAITING_PAYMENT",
            total_amount: finalTotal,
            payment_ref: `mock_ref_${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
            auto_release_at: new Date(
              Date.now() + 24 * 60 * 60 * 1000,
            ).toISOString(),
            chat_history: finalHistory,
          })
          .eq("id", order.id);

        return new Response(
          `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${confirmationReply}</Message></Response>`,
          { headers: { "Content-Type": "application/xml" } },
        );
      }
    }

    const savedAddressStr = profile?.address_line_1
      ? `${profile.address_line_1}, ${profile.lga}, ${profile.state}`
      : null;

    // 3. Call the Groq AI parser utility
    const intent = await parseIntent(
      updatedChatHistory,
      product.name,
      product.price,
      order.status,
      savedAddressStr,
    );

    let nextStatus = order.status;
    let nextQuantity = order.quantity;
    let nextTotalAmount = order.total_amount;
    let nextPaymentRef = order.payment_ref;
    let nextAutoReleaseAt = order.auto_release_at;

    // 4. State Machine Action Router
    switch (intent.db_action) {
      case "UPDATE_QUANTITY": {
        const qty = Number(intent.extracted_data);
        if (!isNaN(qty) && qty > 0) {
          nextQuantity = qty;
          nextTotalAmount = qty * product.price;
          nextStatus = "AWAITING_ADDRESS";
        }
        break;
      }
      case "UPDATE_ADDRESS": {
        const addr = intent.extracted_data as {
          address_line_1: string;
          state: string;
          lga: string;
        };
        if (addr && addr.address_line_1 && addr.state && addr.lga) {
          // Save delivery address to profiles table
          await db.from("profiles").upsert({
            phone_number: buyerPhone,
            address_line_1: addr.address_line_1,
            state: addr.state,
            lga: addr.lga,
            updated_at: new Date().toISOString(),
          });

          // --- INTERCEPT POINT B: DYNAMIC SHIPPING CALCULATION ---
          const deliveryState = addr.state.toLowerCase().trim();
          const shippingFee = deliveryState.includes("lagos") ? 1500 : 3500;
          const subtotal = nextQuantity * product.price;

          nextTotalAmount = subtotal + shippingFee;
          nextPaymentRef = `mock_ref_${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
          nextStatus = "AWAITING_PAYMENT";
          nextAutoReleaseAt = new Date(
            Date.now() + 24 * 60 * 60 * 1000,
          ).toISOString();

          // Programmatically override AI text response to insert clean system invoice layout
          intent.whatsapp_reply = `Got it! Delivery address confirmed.\n\n*Order Summary:*\n* ${nextQuantity} × ${product.name}: ₦${subtotal.toLocaleString()}\n* Shipping (${deliveryState.includes("lagos") ? "Lagos" : "Nationwide"}): ₦${shippingFee.toLocaleString()}\n* *Total: ₦${nextTotalAmount.toLocaleString()}*\n\n🏦 *Escrow Payment Account:*\n* Bank: Holdway Sandbox Bank\n* Account Number: 9920183741\n* Account Name: Holdway Escrow / Merchant\n\nPlease complete the transfer within 24 hours to secure your order.`;
        }
        break;
      }
      case "NONE":
      default:
        break;
    }

    // 5. Append assistant reply to chat history and persist final state
    const assistantMsg: ChatMessage = {
      role: "assistant",
      content: intent.whatsapp_reply,
      timestamp: new Date().toISOString(),
    };
    const finalChatHistory = [...updatedChatHistory, assistantMsg];

    await db
      .from("orders")
      .update({
        status: nextStatus,
        quantity: nextQuantity,
        total_amount: nextTotalAmount,
        payment_ref: nextPaymentRef,
        auto_release_at: nextAutoReleaseAt,
        chat_history: finalChatHistory,
      })
      .eq("id", order.id);

    // 6. Return TwiML XML
    if (intent.db_action === "UPDATE_QUANTITY" && savedAddressStr) {
      await sendTwilioTemplateMessage(
        rawFrom,
        rawTo,
        "HXdc82566c5c5a904a832d26029f0b2aa1",
        { "1": intent.whatsapp_reply }
      );
      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
        { headers: { "Content-Type": "application/xml" } },
      );
    }

    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${intent.whatsapp_reply}</Message></Response>`,
      { headers: { "Content-Type": "application/xml" } },
    );
  } catch (error) {
    console.error("Error handling Twilio webhook:", error);
    const errorReply =
      "We encountered a temporary system issue. Please send your message again in a moment.";
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${errorReply}</Message></Response>`,
      { headers: { "Content-Type": "application/xml" } },
    );
  }
}
