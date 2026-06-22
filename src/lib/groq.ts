import Groq from 'groq-sdk';
import { ChatMessage } from '@/types/database';

const apiKey = process.env.GROQ_API_KEY;
export const groq = new Groq({
  apiKey: apiKey || 'mock_key_for_build',
});

export interface IntentResponse {
  whatsapp_reply: string;
  db_action: 'UPDATE_QUANTITY' | 'UPDATE_ADDRESS' | 'NONE';
  extracted_data: number | { address_line_1: string; state: string; lga: string } | null;
}

export async function parseIntent(
  chatHistory: ChatMessage[],
  productName: string,
  productPrice: number,
  currentStatus: string // Crucial: The current state of the order from Supabase
): Promise<IntentResponse> {
  if (!apiKey) {
    console.warn('GROQ_API_KEY is not defined. Returning fallback.');
    return {
      whatsapp_reply: `Welcome! You're interested in ${productName} (NGN ${productPrice}). How many would you like to buy?`,
      db_action: 'NONE',
      extracted_data: null,
    };
  }

  const systemPrompt = `You are the core routing engine for Holdway NG, an automated WhatsApp conversational commerce platform.
Your objective is to progress the checkout flow for the product: "${productName}" priced at NGN ${productPrice}.

CURRENT SYSTEM STATE: The database order status for this user is currently: "${currentStatus}"

STRICT EVALUATION PROTOCOL:
1. If CURRENT SYSTEM STATE is "AWAITING_QUANTITY", your ONLY valid db_actions are "UPDATE_QUANTITY" or "NONE". You MUST NOT trigger "UPDATE_ADDRESS" even if the user types an address.
2. If CURRENT SYSTEM STATE is "AWAITING_ADDRESS", your ONLY valid db_actions are "UPDATE_ADDRESS" or "NONE".
3. Return raw numbers for quantity data. Ensure extracted address schemas strictly match the requested JSON keys.

ACTION GUIDELINES:
- "UPDATE_QUANTITY": User specifies a quantity (e.g., "send 2", "I need 5 pieces"). Return integer. Acknowledge the total cost (Quantity * ${productPrice}) in the reply, then ask for their delivery address formatted as: Street, LGA, State.
- "UPDATE_ADDRESS": User provides shipping info. Extract address_line_1, lga, and state. In the reply, politely confirm the details and inform them you are spinning up their secure payment confirmation.
- "NONE": General greetings, clarifying questions, or ambiguous statements. Guide them back to fulfilling the current missing state requirement.

FEW-SHOT EVALUATION EXAMPLES:

Example 1:
Current State: AWAITING_QUANTITY
User Message: "Hello, I want to get this item please"
Output: {
  "whatsapp_reply": "Awesome! I can help you secure your order for ${productName}. How many units do you want to purchase?",
  "db_action": "NONE",
  "extracted_data": null
}

Example 2:
Current State: AWAITING_QUANTITY
User Message: "Please send 3 of them to my office"
Output: {
  "whatsapp_reply": "Perfect, that's 3 units of ${productName}. Your subtotal comes to NGN ${productPrice * 3}. Could you please provide your full delivery address (Street, LGA, and State) so we can calculate shipping?",
  "db_action": "UPDATE_QUANTITY",
  "extracted_data": 3
}

Example 3:
Current State: AWAITING_ADDRESS
User Message: "I am at 12 Herbert Macaulay Way, Yaba, Lagos"
Output: {
  "whatsapp_reply": "Received! Delivering to 12 Herbert Macaulay Way, Yaba, LGA, Lagos State. Please give me a brief moment while I generate your secure payment setup.",
  "db_action": "UPDATE_ADDRESS",
  "extracted_data": { "address_line_1": "12 Herbert Macaulay Way", "lga": "Yaba", "state": "Lagos" }
}

Respond ONLY with a valid JSON object matching this schema structure:
{
  "whatsapp_reply": "string",
  "db_action": "UPDATE_QUANTITY" | "UPDATE_ADDRESS" | "NONE",
  "extracted_data": number | { "address_line_1": string, "state": string, "lga": string } | null
}`;

  try {
    const formattedMessages = [
      { role: 'system', content: systemPrompt },
      ...chatHistory.slice(-4).map((msg) => ({ // sliding window of last 4 messages keeps context lean and fast
        role: msg.role === 'assistant' ? ('assistant' as const) : ('user' as const),
        content: msg.content,
      })),
    ];

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: formattedMessages as any,
      response_format: { type: 'json_object' },
      temperature: 0.1, // Near-zero temperature minimizes variance or creative failure
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('Empty payload returned from Groq');
    
    return JSON.parse(content) as IntentResponse;
  } catch (error) {
    console.error('Groq Engine Evaluation Error:', error);
    return {
      whatsapp_reply: "I had a slight issue confirming that step. Could you please state your quantity or address clearly again?",
      db_action: 'NONE',
      extracted_data: null,
    };
  }
}
