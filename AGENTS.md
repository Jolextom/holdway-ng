# TEAM GOVERNANCE & AI INSTRUCTIONS

# Project: Holdway NG (DevCareer Hackathon)

# Lead Engineer: Joseph (jolextom)

#

# SETUP: Copy this file → cp agent.md.template AGENTS.md

# Set YOUR role below

## ACTIVE ROLE — CHANGE THIS TO MATCH YOU

# Options: "LEAD_DEV" | "PM" | "DESIGNER"

SET_ACTIVE_ROLE = "LEAD_DEV"

---

## CRITICAL HACKATHON RULE: SANDBOX ONLY

1. Do NOT write code that touches live payment rails or real-money transfers.
2. ALL payment interactions MUST be restricted strictly to the Sandbox API.
3. ALL environment variables must default to test keys (`sk_test_...`).

---

## THE ATOMIC COMMIT RULE

1. BEFORE generating any commit message or running `git commit`, you MUST read `COMMIT_MAP.md` in the root directory.
2. Align your commit message exactly with the scope and sequence mapped in that file.
3. Commit messages MUST follow Conventional Commits (type(scope): description).
4. Never `git add .` when multiple logical units are changed. Stage precisely.

---

## ROLE ENFORCEMENT & RULES

IF SET_ACTIVE_ROLE IS "LEAD_DEV":

- Allowed: ALL FILES. Full ownership of Next.js API, webhooks, Supabase, and Groq.
- Enforce strict TypeScript types. No `any` without explicit justification.

IF SET_ACTIVE_ROLE IS "PM":

- Allowed: `src/lib/content/copy.json` ONLY.
- You own the text. You may ONLY change string values inside existing keys.

IF SET_ACTIVE_ROLE IS "DESIGNER":

- Allowed: `src/lib/theme.ts`, `src/app/globals.css`, `tailwind.config.ts`, and `public/assets/` ONLY.
- You own the visual language and aesthetic.

## STRICT UI COMPONENT RULES (FOR ALL ROLES & AI)

1. NEVER use direct Tailwind color classes (e.g., `text-blue-500`). You MUST use the CSS variables mapped in `theme.ts` (e.g., `text-primary`).
2. NEVER hardcode text strings in React components. Every UI string and WhatsApp bot message MUST be mapped from `copy.json`. This allows the PM to edit freely without touching code.
3. CONTEXT OPTIMIZATION: Keep all UI code inline within the main page file. Do NOT extract micro-components into separate files unless they strictly require a `'use client'` boundary for interactivity, or if they are major, globally reused elements (like a Navbar). Prioritize single-file monolithic structures to conserve AI context tokens.

---

## PROJECT CONTEXT

Next.js App Router + TypeScript + Tailwind + Supabase + Groq AI + Twilio.
Core flow: Web checkout / Single Link → WhatsApp `wa.me` handoff → Groq AI parses intent (Quantity, Address) via JSON mode → Sandbox Virtual Account checked out from pool → Webhook confirms payment to Platform Wallet → UI updates → Escrow released via Transfer API.
