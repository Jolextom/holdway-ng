# COMMIT MAP & EXECUTION SEQUENCE

#

# INSTRUCTION FOR AI AGENTS:

# You must read this file before running `git commit`.

# Your commit messages must EXACTLY match the sequence and format below.

# Do not combine multiple steps into a single commit.

## THE SEQUENCE

### Step 1: Database & Infrastructure

**Commit:** `feat(db): initialize merchants, products, profiles, and orders schemas with RLS`
**Scope:** Supabase SQL migrations and strictly typed TypeScript interfaces (`types/database.ts`).

### Step 2: AI Parsing Engine

**Commit:** `feat(ai): integrate groq json intent parser for quantity and address routing`
**Scope:** Groq API utility enforcing strict JSON outputs (`whatsapp_reply`, `db_action`, `extracted_data`).

### Step 3: Core State Machine (WhatsApp)

**Commit:** `feat(webhook): implement twilio state machine and db action router`
**Scope:** Twilio webhook receiver handling `UPDATE_QUANTITY`, `UPDATE_ADDRESS`, and TwiML responses.

### Step 4: The Escrow Engine

**Commit:** `feat(payments): implement payment virtual account pooling and webhook ledger`
**Scope:**payment API authentication, virtual account checkout logic, and incoming payment webhook verification.

### Step 5: Web Handoff

**Commit:** `feat(checkout): build passwordless web storefront and whatsapp deep link handoff`
**Scope:** Frontend catalog view pulling from `products` table, local storage state, and `wa.me` redirect logic.

### Step 6: Address Micro-App

**Commit:** `feat(ui): build 50kb address collection page with google places server action`
**Scope:** Minimalist, static-rendered mobile form updating the `profiles` table and returning user to WhatsApp.

### Step 7: Merchant Command Center

**Commit:** `feat(dashboard): build real-time merchant escrow dashboard and transfer trigger`
**Scope:** `shadcn/ui` layout utilizing Supabase real-time listeners and Payment Transfer API for escrow release.

---

## UNPLANNED COMMITS (EDGE CASES)

If you are instructed to build something outside the core sequence above, you MUST use one of the following formats:

- **Copy Updates:** `content(copy): update [description] in copy.json`
- **Theme Updates:** `design(theme): update [description] in theme.ts`
- **Bug Fixes:** `fix(scope): resolve [description of bug]`
- **Refactoring:** `refactor(scope): optimize [description of logic]`
- **Chore:** `chore(deps): update [dependency name]`
