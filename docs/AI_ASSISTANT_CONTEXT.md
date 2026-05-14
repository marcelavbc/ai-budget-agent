# AI Assistant Context — ai-budget-agent

This document summarizes the main features, components, data flow, and key decisions in the ai-budget-agent codebase. Use this as context for an AI assistant or new contributor.

## Overview

- Purpose: Web app for creating and managing budgets and invoices, with AI-assisted budget draft generation and item translation.
- Main domains: Budgets (create/edit/generate), Invoices (create from budgets), Auth, AI parsing/translation, PDF export.

## Tech stack & tooling

- Framework: Next.js (app router), React, TypeScript
- Backend/DB: Supabase (via `src/core/lib/supabaseClient.ts`)
- AI: Groq chat completions adapter (see AI lib)
- Testing: Cypress (E2E) and Vitest (unit)
- Packaging and scripts: `package.json` (pnpm-compatible)

## Main features

- Budget creation, editing, and listing
- AI-assisted draft generation from free-form text (`/api/generate-budget-draft`)
- Item translation for budgets (`/api/translate-budget-items`)
- Export budgets to PDF and generate invoices from budgets

## Important files & folders

- Project root: [package.json](package.json), [next.config.ts](next.config.ts), [tsconfig.json](tsconfig.json)
- App entry and pages: [src/app](src/app)
- API routes: [src/app/api](src/app/api)
- Supabase client and types: [src/core/lib/supabaseClient.ts](src/core/lib/supabaseClient.ts), [src/core/types/supabase.ts](src/core/types/supabase.ts)
- Budgets feature: [src/features/budgets](src/features/budgets)
- Shared components & utilities: [src/shared/components](src/shared/components), [src/shared/lib](src/shared/lib)
- Tests: [cypress/e2e](cypress/e2e), [vitest.config.ts](vitest.config.ts)

## Key API routes (server handlers)

- Auth: [src/app/api/auth/login/route.ts](src/app/api/auth/login/route.ts) — simple password-based login sets `auth_session` cookie.
- Budgets: [src/app/api/budgets/route.ts](src/app/api/budgets/route.ts) and [src/app/api/budgets/[id]/route.ts](src/app/api/budgets/[id]/route.ts) — CRUD + export and client-data endpoints.
- Generate draft (AI): [src/app/api/generate-budget-draft/route.ts](src/app/api/generate-budget-draft/route.ts)
- Translate items (AI): [src/app/api/translate-budget-items/route.ts](src/app/api/translate-budget-items/route.ts)
- Invoices-from-budget: [src/app/api/invoices/from-budget/route.ts](src/app/api/invoices/from-budget/route.ts)

## Key UI components

- Budgets listing and view: [src/features/budgets/components/BudgetsView.tsx](src/features/budgets/components/BudgetsView.tsx)
- Budget editor form: [src/features/budgets/components/BudgetForm.tsx](src/features/budgets/components/BudgetForm.tsx)
- Budget lines list: [src/features/budgets/components/BudgetLinesList.tsx](src/features/budgets/components/BudgetLinesList.tsx)
- AI input widget: [src/features/budgets/components/BudgetAIInput.tsx](src/features/budgets/components/BudgetAIInput.tsx)
- Draft preview: [src/features/budgets/components/BudgetDraftView.tsx](src/features/budgets/components/BudgetDraftView.tsx)
- Shared UI: [src/shared/components/Header.tsx](src/shared/components/Header.tsx), [src/shared/components/FilterBar.tsx](src/shared/components/FilterBar.tsx)

## Data flow & integrations

- Client-side UI components call API routes via `fetch` (client hooks/components).
- API handlers use the Supabase client from [src/core/lib/supabaseClient.ts](src/core/lib/supabaseClient.ts) to read/write DB.
- Authentication is implemented by a simple password check in the `auth` route which sets an `auth_session` cookie used by client requests.
- AI flows:
  - `BudgetAIInput` (client) → `POST /api/generate-budget-draft` → server uses parsing utilities in `src/features/budgets/lib` → calls Groq via `src/features/budgets/lib/ai/groq.ts` → returns validated JSON draft to client.
  - `POST /api/translate-budget-items` → server translates item lines via Groq and returns preserved-brand translations.

## AI-specific files & notes

- Groq adapter: [src/features/budgets/lib/ai/groq.ts](src/features/budgets/lib/ai/groq.ts) — expects `GROQ_API_KEY` and `GROQ_CHAT_COMPLETIONS_URL` env vars.
- Parsing & validation: [src/features/budgets/lib/parseBudgetLinesWithAI.ts](src/features/budgets/lib/parseBudgetLinesWithAI.ts)
- Draft builder: [src/features/budgets/lib/buildBudgetDraftFromAI.ts](src/features/budgets/lib/buildBudgetDraftFromAI.ts)
- Translation: [src/features/budgets/lib/translateBudgetItems.ts](src/features/budgets/lib/translateBudgetItems.ts)

## Testing & CI

- E2E: Cypress specs at [cypress/e2e](cypress/e2e) — e.g., [cypress/e2e/login.cy.ts](cypress/e2e/login.cy.ts).
- Unit: Vitest configured in [vitest.config.ts](vitest.config.ts); feature tests are under `src/features/*/__tests__`.

## Key architectural decisions & rationale

- Next.js App Router: modern React + server components, streamlined route handlers in `src/app/api`.
- Supabase for DB/auth: simple hosted Postgres with REST-like client (keeps server code concise).
- AI via Groq: centralized adapter (`ai/groq.ts`) to keep prompts & validation consistent.
- CSS Modules: scoped styling in component-level `.module.css` files for predictable styles.
- Testing split: e2e flows for UX-critical paths (Cypress) and unit tests for parsing/AI helpers (Vitest).

## Quick pointers for an AI assistant

- To generate budgets from user text, inspect [src/features/budgets/components/BudgetAIInput.tsx](src/features/budgets/components/BudgetAIInput.tsx) and the handler [src/app/api/generate-budget-draft/route.ts](src/app/api/generate-budget-draft/route.ts).
- For database schema or migrations, check [supabase/migrations](supabase/migrations).
- For configuration and env var requirements: `GROQ_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or server keys), and standard Next.js envs.

## Next steps (recommendations)

- Add a small `docs/ROUTES.md` mapping each API route to inputs/outputs for quick reference.
- Add an env sample file `env.example` listing required env vars for local development and AI features.

---

_Generated automatically to help AI assistants and new contributors get up to speed quickly._
