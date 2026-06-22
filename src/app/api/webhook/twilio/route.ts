import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { parseIntent } from '@/lib/groq';
import { ChatMessage, Order, Product } from '@/types/database';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const rawFrom = formData.get('From') as string || '';
    const messageBody = formData.get('Body') as string || '';

    // Strip the "whatsapp:" prefix if present
    const buyerPhone = rawFrom.replace(/^whatsapp:/, '');

    if (!buyerPhone || !messageBody) {
      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?>
        <Response>
          <Message>Error: Missing phone number or message body.</Message>
        </Response>`,
        { headers: { 'Content-Type': 'application/xml' } }
      );
    }

    // Cast supabaseAdmin to any to avoid generic SDK typing mismatches
    const db = supabaseAdmin as any;

    // 1. Resolve the active order
    let order: (Order & { products: Product | null }) | null = null;

    // Check if the message contains an Order ID (UUID format) for handoff mapping
    const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
    const match = messageBody.match(uuidRegex);
    const orderIdInMessage = match ? match[0] : null;

    if (orderIdInMessage) {
      // Find the specific order mentioned in the message
      const { data: orderById } = await db
        .from('orders')
        .select('*, products:product_id(*)')
        .eq('id', orderIdInMessage)
        .single();

      if (orderById) {
        const o = orderById as any;
        // Associate the phone number with this order if not already set
        if (!o.buyer_phone) {
          await db
            .from('orders')
            .update({ buyer_phone: buyerPhone })
            .eq('id', o.id);
          o.buyer_phone = buyerPhone;
        }
        order = o;
      }
    }

    // If no order ID was in the message, search for the most recent active order by phone number
    if (!order) {
      const { data: activeOrder } = await db
        .from('orders')
        .select('*, products:product_id(*)')
        .eq('buyer_phone', buyerPhone)
        .in('status', [
          'AWAITING_QUANTITY',
          'AWAITING_ADDRESS',
          'AWAITING_PAYMENT',
          'PAID_IN_ESCROW',
          'AWAITING_CONFIRMATION',
        ])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (activeOrder) {
        order = activeOrder as any;
      }
    }

    // If no active order exists, respond politely
    if (!order || !order.products) {
      const fallbackReply = "Welcome to Holdway! It looks like you don't have an active order right now. Please visit one of our storefront single links to choose a product and start checkout.";
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Message>${fallbackReply}</Message>
      </Response>`;
      return new Response(twiml, { headers: { 'Content-Type': 'application/xml' } });
    }

    const product = order.products;

    // 2. Append incoming message to chat history
    const userMsg: ChatMessage = {
      role: 'user',
      content: messageBody,
      timestamp: new Date().toISOString(),
    };
    const updatedChatHistory = [...(order.chat_history || []), userMsg];

    // 3. Call the Groq AI parser utility
    const intent = await parseIntent(updatedChatHistory, product.name, product.price, order.status);

    let nextStatus = order.status;
    let nextQuantity = order.quantity;
    let nextTotalAmount = order.total_amount;
    let nextPaymentRef = order.payment_ref;
    let nextAutoReleaseAt = order.auto_release_at;

    // 4. State Machine Action Router
    switch (intent.db_action) {
      case 'UPDATE_QUANTITY': {
        const qty = Number(intent.extracted_data);
        if (!isNaN(qty) && qty > 0) {
          nextQuantity = qty;
          nextTotalAmount = qty * product.price;
          nextStatus = 'AWAITING_ADDRESS';
        }
        break;
      }
      case 'UPDATE_ADDRESS': {
        const addr = intent.extracted_data as { address_line_1: string; state: string; lga: string };
        if (addr && addr.address_line_1 && addr.state && addr.lga) {
          // Save delivery address to profiles table
          await db.from('profiles').upsert({
            phone_number: buyerPhone,
            address_line_1: addr.address_line_1,
            state: addr.state,
            lga: addr.lga,
            updated_at: new Date().toISOString(),
          });

          // Mock payment virtual account generation (strictly bypass real/sandbox payment rails)
          nextPaymentRef = `mock_ref_${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
          nextStatus = 'AWAITING_PAYMENT';
          nextAutoReleaseAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours auto-release
        }
        break;
      }
      case 'NONE':
      default:
        // No DB state action needed, just chat updates
        break;
    }

    // 5. Append assistant reply to chat history and persist final state
    const assistantMsg: ChatMessage = {
      role: 'assistant',
      content: intent.whatsapp_reply,
      timestamp: new Date().toISOString(),
    };
    const finalChatHistory = [...updatedChatHistory, assistantMsg];

    // Save final status and fields in one atomic update
    await db
      .from('orders')
      .update({
        status: nextStatus,
        quantity: nextQuantity,
        total_amount: nextTotalAmount,
        payment_ref: nextPaymentRef,
        auto_release_at: nextAutoReleaseAt,
        chat_history: finalChatHistory,
      })
      .eq('id', order.id);

    // 6. Return TwiML XML
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
    <Response>
      <Message>${intent.whatsapp_reply}</Message>
    </Response>`;

    return new Response(twiml, {
      headers: {
        'Content-Type': 'application/xml',
      },
    });
  } catch (error) {
    console.error('Error handling Twilio webhook:', error);
    const errorReply = "We encountered a temporary system issue. Please send your message again in a moment.";
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
    <Response>
      <Message>${errorReply}</Message>
    </Response>`;
    return new Response(errorTwiml, {
      headers: {
        'Content-Type': 'application/xml',
      },
    });
  }
}
