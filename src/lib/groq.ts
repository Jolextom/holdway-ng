import Groq from 'groq-sdk';
import { ChatMessage } from '@/types/database';

const apiKey = process.env.GROQ_API_KEY;

export const groq = new Groq({
  apiKey: apiKey || 'mock_key_for_build', // Fallback to avoid build errors if env var is missing during build time
});

export interface IntentResponse {
  whatsapp_reply: string;
  db_action: 'UPDATE_QUANTITY' | 'UPDATE_ADDRESS' | 'NONE';
  extracted_data: number | { address_line_1: string; state: string; lga: string } | null;
}

export async function parseIntent(
  chatHistory: ChatMessage[],
  productName: string,
  productPrice: number
): Promise<IntentResponse> {
  if (!apiKey) {
    console.warn('GROQ_API_KEY is not defined. Returning fallback NONE response.');
    return {
      whatsapp_reply: `Welcome! You're interested in ${productName} (NGN ${productPrice}). How many would you like to buy?`,
      db_action: 'NONE',
      extracted_data: null,
    };
  }

  const systemPrompt = `You are the Holdway Conversational Commerce Assistant. Your job is to facilitate checkout of a product on WhatsApp.
Product Details:
Name: ${productName}
Price: NGN ${productPrice}

You receive the chat history between the buyer and the assistant.
Analyze the latest user message and determine:
1. What the assistant should say in response to progress the sale (always keep it concise, polite, and helpful).
2. What database action is triggered based on the user's intent.
3. Any extracted data needed for that database action.

Possible database actions:
- "UPDATE_QUANTITY": Choose this if the user has specified how many items they want to buy (either a number or a phrase like "I want two", "send me 3 pieces").
  - extracted_data must be a number (integer representing the quantity).
  - whatsapp_reply should acknowledge the quantity, state the total price (Quantity * ${productPrice} NGN), and ask for their delivery address (Format: Street Address, State, LGA).
- "UPDATE_ADDRESS": Choose this if the user has provided their delivery address.
  - The user must provide the address. Extract:
    - address_line_1: Street name/number.
    - lga: Local Government Area in Nigeria.
    - state: State in Nigeria.
  - extracted_data must be a JSON object: { "address_line_1": "...", "state": "...", "lga": "..." }.
  - whatsapp_reply should acknowledge the address and tell them we are generating a secure payment link/virtual account for their payment.
- "NONE": Choose this if the user's message is a greeting, general inquiry, or if it does not fit the above stages yet.
  - extracted_data must be null.
  - whatsapp_reply should respond to their message and guide them back to the current step (e.g. if we don't have quantity, ask how many they want to buy; if we have quantity but no address, ask for address).

Respond ONLY in a JSON object with this exact structure:
{
  "whatsapp_reply": "string",
  "db_action": "UPDATE_QUANTITY" | "UPDATE_ADDRESS" | "NONE",
  "extracted_data": number | { "address_line_1": string, "state": string, "lga": string } | null
}`;

  try {
    // Mapping our ChatMessage interface to Groq's ChatCompletionMessageParam format
    const formattedMessages = [
      { role: 'system', content: systemPrompt },
      ...chatHistory.map((msg) => ({
        role: msg.role === 'assistant' ? ('assistant' as const) : ('user' as const),
        content: msg.content,
      })),
    ];

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: formattedMessages as any,
      response_format: { type: 'json_object' },
      temperature: 0.1, // low temperature for deterministic classifications
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Groq returned an empty response');
    }

    return JSON.parse(content) as IntentResponse;
  } catch (error) {
    console.error('Error parsing intent with Groq:', error);
    return {
      whatsapp_reply: "I'm sorry, I had trouble parsing your request. Could you please state how many items you'd like or provide your address clearly?",
      db_action: 'NONE',
      extracted_data: null,
    };
  }
}
