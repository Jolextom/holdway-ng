import { ChatMessage } from './src/types/database';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables for the Groq API Key programmatically
const envFiles = ['.env', '.env.local'];
for (const file of envFiles) {
  try {
    const envPath = path.resolve(process.cwd(), file);
    if (fs.existsSync(envPath)) {
      const envConfig = fs.readFileSync(envPath, 'utf-8');
      for (const line of envConfig.split('\n')) {
        const match = line.trim().match(/^([\w.-]+)\s*=\s*(.*)$/);
        if (match) {
          const key = match[1];
          let value = match[2] || '';
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
          } else if (value.startsWith("'") && value.endsWith("'")) {
            value = value.slice(1, -1);
          }
          process.env[key] = value.trim();
        }
      }
    }
  } catch (e: any) {
    console.warn(`Failed to parse ${file} file`, e.message);
  }
}

interface TestCase {
  name: string;
  status: string;
  savedAddress: string | null;
  history: ChatMessage[];
  expectedAction: 'UPDATE_QUANTITY' | 'UPDATE_ADDRESS' | 'NONE';
  validateData?: (data: any) => boolean;
}

const testCases: TestCase[] = [
  // --- AWAITING_QUANTITY: HAPPY PATHS ---
  {
    name: 'Q1: Integer Quantity',
    status: 'AWAITING_QUANTITY',
    savedAddress: null,
    history: [{ role: 'user', content: 'I need 3 pieces of this', timestamp: '' }],
    expectedAction: 'UPDATE_QUANTITY',
    validateData: (data) => data === 3,
  },
  {
    name: 'Q2: Word-based Quantity Extraction',
    status: 'AWAITING_QUANTITY',
    savedAddress: null,
    history: [{ role: 'user', content: 'Please send me two pairs', timestamp: '' }],
    expectedAction: 'UPDATE_QUANTITY',
    validateData: (data) => data === 2, // Testing if LLM converts "two" to 2
  },

  // --- AWAITING_QUANTITY: EDGE CASES & DEFENSE ---
  {
    name: 'Q3: Anti-Haggling Defense',
    status: 'AWAITING_QUANTITY',
    savedAddress: null,
    history: [{ role: 'user', content: 'Ah 15k is too much, can I pay 10k last price?', timestamp: '' }],
    expectedAction: 'NONE', 
  },
  {
    name: 'Q4: Premature Address Block',
    status: 'AWAITING_QUANTITY',
    savedAddress: null,
    history: [{ role: 'user', content: 'Deliver to 12 Herbert Macaulay, Yaba, Lagos', timestamp: '' }],
    expectedAction: 'NONE', 
  },
  {
    name: 'Q5: Chitchat / Gibberish Ignored',
    status: 'AWAITING_QUANTITY',
    savedAddress: null,
    history: [{ role: 'user', content: 'Hello is anybody there?', timestamp: '' }],
    expectedAction: 'NONE',
  },

  // --- AWAITING_ADDRESS: HAPPY PATHS ---
  {
    name: 'A1: Perfect Full Address',
    status: 'AWAITING_ADDRESS',
    savedAddress: null,
    history: [{ role: 'user', content: 'Send it to 45 Allen Avenue, Ikeja, Lagos state', timestamp: '' }],
    expectedAction: 'UPDATE_ADDRESS',
    validateData: (data) => data?.state?.toLowerCase().includes('lagos') && data?.lga?.toLowerCase().includes('ikeja'),
  },

  // --- AWAITING_ADDRESS: EDGE CASES & DEFENSE ---
  {
    name: 'A2: Incomplete Address Handling (Missing Street)',
    status: 'AWAITING_ADDRESS',
    savedAddress: null,
    history: [{ role: 'user', content: 'I am in Port Harcourt, Rivers State', timestamp: '' }],
    expectedAction: 'NONE', // Should ask for full street details
  },
  {
    name: 'A3: Incomplete Address Handling (Missing State)',
    status: 'AWAITING_ADDRESS',
    savedAddress: null,
    history: [{ role: 'user', content: 'Deliver to Wuse Zone 4', timestamp: '' }],
    expectedAction: 'NONE', 
  },
  {
    name: 'A4: Anti-Haggling in Address State',
    status: 'AWAITING_ADDRESS',
    savedAddress: null,
    history: [{ role: 'user', content: 'Can you offer free shipping?', timestamp: '' }],
    expectedAction: 'NONE', 
  },
  {
    name: 'A5: Conversational Filler',
    status: 'AWAITING_ADDRESS',
    savedAddress: null,
    history: [{ role: 'user', content: 'Okay thanks I am ready', timestamp: '' }],
    expectedAction: 'NONE',
  },

  // --- REVERSAL PROTOCOL (TIME TRAVEL) ---
  {
    name: 'R1: Changing Quantity from Address State',
    status: 'AWAITING_ADDRESS',
    savedAddress: null,
    history: [{ role: 'user', content: 'Wait I made a mistake, change my order to 5 pieces instead', timestamp: '' }],
    expectedAction: 'UPDATE_QUANTITY', 
    validateData: (data) => data === 5,
  },
  {
    name: 'R2: Vague Reversal Attempt',
    status: 'AWAITING_ADDRESS',
    savedAddress: null,
    history: [{ role: 'user', content: 'Actually I changed my mind about the quantity.', timestamp: '' }],
    expectedAction: 'NONE', // Should ask them "How many do you want instead?" without updating DB yet
  }
];

async function runEvaluations() {
  const { parseIntent } = await import('./src/lib/groq');
  console.log('🧪 Starting Groq Intent Parser Evaluation...\n');
  let passed = 0;

  for (const t of testCases) {
    process.stdout.write(`Running: ${t.name}... `);
    try {
      const result = await parseIntent(t.history, 'Nike Air Max', 15000, t.status, t.savedAddress);
      
      const actionMatch = result.db_action === t.expectedAction;
      const dataMatch = t.validateData ? t.validateData(result.extracted_data) : true;

      if (actionMatch && dataMatch) {
        console.log('✅ PASS');
        passed++;
      } else {
        console.log('❌ FAIL');
        console.log(`   Expected Action: ${t.expectedAction}, Got: ${result.db_action}`);
        if (!dataMatch) console.log(`   Data Validation Failed. Got:`, result.extracted_data);
        console.log(`   AI Reply: "${result.whatsapp_reply}"\n`);
      }
    } catch (error) {
      console.log('❌ ERROR');
      console.error(error);
    }
  }

  console.log(`\n🏁 Evaluation Complete: ${passed} / ${testCases.length} passed.`);
  if (passed === testCases.length) {
    console.log('🎉 100% PASS RATE! The AI is bulletproof.');
  } else {
    console.log('⚠️ Some tests failed. Review the prompt parameters.');
  }
}

runEvaluations();
