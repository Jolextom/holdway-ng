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
  currentStatus: string,
  savedAddress: string | null
): Promise<IntentResponse> {
  if (!apiKey) {
    console.warn('GROQ_API_KEY is not defined. Returning fallback.');
    return {
      whatsapp_reply: `Welcome! You're interested in ${productName} (NGN ${productPrice}). How many would you like to buy?`,
      db_action: 'NONE',
      extracted_data: null,
    };
  }

  const savedAddressContext = savedAddress
    ? `The buyer has a saved address on file: "${savedAddress}".
       If the conversation is in the "AWAITING_ADDRESS" state, and they have not confirmed their address yet, your whatsapp_reply should explicitly offer this option: "Would you like us to deliver to your saved address: ${savedAddress}? Reply YES to confirm, or type a new delivery address."`
    : `The buyer has no saved address. Ask them to provide their delivery address formatted as: Street Address, LGA, State.`;

  const systemPrompt = `You are the core routing engine for Holdway NG, an automated WhatsApp conversational commerce platform.
Your objective is to progress the checkout flow for the product: "${productName}" priced at NGN ${productPrice}.

CURRENT SYSTEM STATE: The database order status for this user is currently: "${currentStatus}"

SAVED ADDRESS CONTEXT:
${savedAddressContext}

STRICT EVALUATION PROTOCOL:
1. If CURRENT SYSTEM STATE is "AWAITING_QUANTITY", your ONLY valid db_actions are "UPDATE_QUANTITY" or "NONE". You MUST NOT trigger "UPDATE_ADDRESS" even if the user types an address.
2. If CURRENT SYSTEM STATE is "AWAITING_ADDRESS", your ONLY valid db_actions are "UPDATE_ADDRESS" or "NONE".
3. Return raw integer numbers for quantity data. Ensure extracted address schemas strictly match the requested JSON keys.
4. REVERSAL PROTOCOL: If the user explicitly states they made a mistake, changed their mind, or want to modify a previous choice (e.g., 'change quantity to 5', 'I want more pieces instead'), you are authorized to bypass the CURRENT SYSTEM STATE rules. Trigger the appropriate db_action (e.g., UPDATE_QUANTITY) to overwrite the previous data and correct the order state. However, you MUST only trigger the action if the user provides the new value (e.g., a specific quantity number or new address). If they express a desire to change their mind but do not specify the new value (e.g., "Actually I changed my mind about the quantity."), you MUST set db_action to "NONE" and ask them to specify the new quantity or address.
5. ANTI-HAGGLING PROTOCOL: You are an automated checkout assistant, not a negotiator. You have zero authorization to alter prices, offer discounts, or accept lower offers. If a user attempts to negotiate the price, complain it is too high, or ask for a discount: Set db_action to "NONE". Your whatsapp_reply must politely but firmly state that the price is fixed by the merchant, and ask if they still wish to proceed with the current step.
6. COMPLETE ADDRESS REQUIREMENT: To trigger "UPDATE_ADDRESS", the user's message MUST contain a complete address with a recognizable street/location (address_line_1), Local Government Area (lga), and State (state). If any of these three components are missing or ambiguous (e.g., providing only a street/zone name without a state, or only a state/city without a street address), you MUST set db_action to "NONE" and ask them to provide the missing components.

ACTION GUIDELINES:
- "UPDATE_QUANTITY": User specifies a quantity (e.g., "send 2", "I need 5 pieces"). Return integer. Acknowledge the subtotal cost (Quantity * ${productPrice}) in the reply, then ask for their delivery address.
- "UPDATE_ADDRESS": User provides shipping info. Extract address_line_1, lga, and state. In the reply, simply state you are confirming the location and compiling their order manifest.
- "NONE": General greetings, clarifying questions, haggling, or ambiguous statements. Guide them back to fulfilling the current missing state requirement.

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
  "whatsapp_reply": "Perfect, that's 3 units of ${productName}. Your subtotal comes to NGN ${productPrice * 3}. Could you please provide your full delivery address (Street, LGA, and State) so we can update your order?",
  "db_action": "UPDATE_QUANTITY",
  "extracted_data": 3
}

Example 3:
Current State: AWAITING_ADDRESS
User Message: "I am at 12 Herbert Macaulay Way, Yaba, Lagos"
Output: {
  "whatsapp_reply": "Thank you! Processing your address details and preparing your escrow transaction summary...",
  "db_action": "UPDATE_ADDRESS",
  "extracted_data": { "address_line_1": "12 Herbert Macaulay Way", "lga": "Yaba", "state": "Lagos" }
}

Example 4:
Current State: AWAITING_ADDRESS
User Message: "Deliver to Wuse Zone 4"
Output: {
  "whatsapp_reply": "I've noted Wuse Zone 4, but could you please specify the State and LGA (Local Government Area) for delivery so I can calculate your shipping correctly?",
  "db_action": "NONE",
  "extracted_data": null
}

Example 5:
Current State: AWAITING_ADDRESS
User Message: "I am in Port Harcourt, Rivers State"
Output: {
  "whatsapp_reply": "Got it, Rivers State. Could you please provide your specific street address in Port Harcourt?",
  "db_action": "NONE",
  "extracted_data": null
}

Example 6:
Current State: AWAITING_ADDRESS
User Message: "Actually I changed my mind about the quantity."
Output: {
  "whatsapp_reply": "No problem! How many pieces of ${productName} would you like to order instead?",
  "db_action": "NONE",
  "extracted_data": null
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
      ...chatHistory.slice(-4).map((msg) => ({
        role: msg.role === 'assistant' ? ('assistant' as const) : ('user' as const),
        content: msg.content,
      })),
    ];

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: formattedMessages as any,
      response_format: { type: 'json_object' },
      temperature: 0.1,
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
