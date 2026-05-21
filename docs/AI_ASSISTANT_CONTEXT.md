# Contexto para asistentes IA — ai-budget-agent

Resumen de funcionalidades, componentes, flujos de datos y decisiones del proyecto. Complementa `progress.md` (estado y cambios recientes).

## Resumen

- **Propósito**: app web para presupuestos y facturas, con generación de partidas por IA (Groq) y persistencia en Supabase.
- **Dominios**: presupuestos (crear/editar/listar/PDF), facturas (desde presupuesto), auth, parsing/traducción IA.

## Stack

| Capa | Tecnología |
|------|------------|
| Frontend | Next.js 15 (App Router), React 19, TypeScript |
| Estilos | CSS Modules |
| Estado | Local en páginas/hooks (sin Zustand ni Context global) |
| BD | Supabase — cliente server en `src/core/lib/supabaseClient.ts` |
| IA | Groq — `src/features/budgets/lib/ai/groq.ts` |
| Tests | Vitest (unit), Cypress (E2E) |
| Dev | `pnpm dev` → puerto **3001** |

## Funcionalidades principales

- Listado y filtrado de presupuestos (`filterBudgets.ts`)
- Creación `/budgets/nou`: dos vistas (`lines` → `draft`), ver `docs/ADD_BUDGET_FLOW.md`
- Edición `/budgets/[id]/edit`: una pantalla (`BudgetEditView` + IA para añadir partidas)
- IA: `POST /api/generate-budget-draft`, `POST /api/translate-budget-items`
- PDF presupuesto (CA/ES en edición), PDF factura
- Facturas desde presupuesto (`create_invoice_from_budget`)

## Rutas API relevantes

| Ruta | Uso |
|------|-----|
| `POST /api/auth/login` | Cookie `auth_session` |
| `GET/POST /api/budgets` | Listar / crear presupuesto |
| `GET/PUT /api/budgets/[id]` | Detalle / actualizar |
| `POST /api/generate-budget-draft` | Texto → líneas IA |
| `POST /api/translate-budget-items` | Traducción de partidas |
| `POST /api/invoices/from-budget` | Crear factura |

## Componentes UI (presupuestos)

| Componente | Uso |
|------------|-----|
| `BudgetsView` | Listado |
| `BudgetForm` | Wrapper de `BudgetAIInput` en creación |
| `BudgetAIInput` | Textarea + envío IA (+ slider m² opcional) |
| `BudgetDraftEditor` | Partidas editables en vista `lines` de `/nou` |
| `BudgetDraftView` | Cliente + partidas + guardar (crear y editar) |
| `BudgetEditView` | Página de edición; compone `BudgetDraftView` + IA |
| `BudgetClientForm` | Campos del cliente |
| `DecimalFieldInput` | Inputs numéricos compartidos (`src/shared`) |

**Obsoleto en flujo activo:** `BudgetLinesList` (eliminado del flujo de creación). `BudgetOptionGroupCard` / `DraggableLine` existen pero la UI actual de grupos está en `BudgetDraftEditor` / `BudgetDraftView`.

## Flujo de datos (IA → guardar)

```
BudgetAIInput
  → POST /api/generate-budget-draft
  → parseBudgetLinesWithAI + hydrateBudgetLines
  → BudgetLine[] en useBudgetLines
  → generateBudgetDraft → BudgetClientItem[] (draftItems)
  → BudgetDraftView → saveBudgetWithLines (client)
  → POST /api/budgets → saveBudgetWithLines (server) → Supabase
```

**Validación guardar (crear):** solo `client.nameOrCompany` no vacío (`isBudgetDraftComplete`).

**Mapeo líneas BD:** `toBudgetLineRows` — `description` nunca `null`; `unit_price` calculado si falta.

## Archivos IA

- `parseBudgetLinesWithAI.ts` — prompt y validación JSON
- `buildBudgetDraftFromAI.ts` — orquesta parse + hydrate
- `generateBudgetDraft.ts` — plantillas de descripción por tipo de línea
- `translateBudgetItems.ts` — traducción

## Grupos de opciones

Ver `docs/OPTION_GROUP_FLOW.md`. Metadatos `optionGroupId` / `optionLabel` desde la IA hasta PDF y BD.

## Tests

- Unit: `src/features/**/__tests__` (Vitest; ~158 tests)
- E2E: `cypress/e2e/` — login, budgets, new-budget (IA mock, grupos opción, slider)

## Decisiones de arquitectura

- App Router + route handlers en `src/app/api`
- Supabase solo en server para escrituras sensibles; tipos en `src/core/types/supabase.ts`
- Adaptador Groq centralizado
- Sin estado global: hooks `useBudgetLines`, `useBudgetEditController`, `useQuoteNumber`, etc.

## Variables de entorno

- `GROQ_API_KEY`, `GROQ_CHAT_COMPLETIONS_URL`
- `NEXT_PUBLIC_SUPABASE_URL`, claves Supabase (anon/service según uso)
- Credenciales de login (ruta auth)

## Documentación relacionada

| Doc | Contenido |
|-----|-----------|
| [progress.md](../progress.md) | Progreso, commits recientes, pendientes |
| [ADD_BUDGET_FLOW.md](./ADD_BUDGET_FLOW.md) | Creación en `/budgets/nou` |
| [OPTION_GROUP_FLOW.md](./OPTION_GROUP_FLOW.md) | Alternativas IA |

## Pendientes documentados (no implementados)

- Unificar `/budgets/nou` con el flujo de edición (una sola pantalla)
- UX descripción usuario vs plantilla técnica (`suggestedDescription`) — diseñado pero no en el repo actual
- `docs/ROUTES.md`, `env.example` — recomendados

---

_Actualizado a mayo de 2026._
