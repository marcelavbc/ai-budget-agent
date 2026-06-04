# Contexto para asistentes IA — ai-budget-agent

Resumen de funcionalidades, componentes, flujos de datos y decisiones del proyecto.
Complementa `progress.md` (estado, cambios recientes y pendientes).

---

## Resumen

- **Propósito**: app web para presupuestos y facturas, con generación de partidas por IA (Groq) y persistencia en Supabase.
- **Usuario final**: Roger, contratista de pintura (uso en solitario).
- **Dominios**: presupuestos (crear/editar/listar/PDF), facturas (desde presupuesto), auth, parsing/traducción IA.

---

## Stack

| Capa     | Tecnología                                                                      |
| -------- | ------------------------------------------------------------------------------- |
| Frontend | Next.js 15.3.1 (App Router), React 19, TypeScript                               |
| Estilos  | CSS Modules                                                                     |
| Estado   | Local en páginas/hooks (sin Zustand ni Context global)                          |
| BD       | Supabase — cliente server en `src/core/lib/supabaseClient.ts`                   |
| IA       | Groq — modelo `llama-3.3-70b-versatile` — `src/features/budgets/lib/ai/groq.ts` |
| PDF      | jsPDF (presupuestos y facturas)                                                 |
| Tests    | Vitest (unit, 158 tests), Cypress (E2E)                                         |
| Deploy   | Vercel                                                                          |
| Dev      | `pnpm dev` → puerto **3001**                                                    |

---

## Modelo de datos (tablas principales)

- `contacts` — clientes (migrada desde `clients`; los presupuestos y facturas referencian `contact_id`, no `client_id`)
- `contact_addresses` — direcciones de trabajo asociadas a un contacto
- `budgets` — presupuestos; campos: `contact_id`, `quote_number`, `document_date`, `estimated_time`, `status`, `lang`, etc.
- `budget_lines` — partidas de un presupuesto
- `invoices` — facturas generadas desde presupuesto
- `settings` — configuración del emisor (RLS desactivado intencionalmente)

⚠️ **RLS en `settings` debe permanecer desactivado** — activarlo hace que `getSettings()` retorne null silenciosamente.

---

## Principios y convenciones

- **Valores en BD siempre en inglés** — estados (`draft`, `issued`, `paid`), códigos de lengua (`ca`, `es`). La localización es solo en la capa UI.
- **Sin estado global** — sin Zustand ni Context. Estado local en páginas y hooks.
- **Supabase solo desde server** — nunca desde el cliente directamente para operaciones sensibles.
- **Atomicidad en creación de facturas** — `create_invoice_from_budget` RPC maneja la transacción completa; fallo parcial revierte todo.
- **Nunca traducir marcas** — Jotun, Isaval, Titanlux no se traducen en la generación de PDF bilingüe.
- **Versiones fijadas sin `^`** — especialmente Next.js; 15.5.x tiene un bug crítico con las DevTools internas.

---

## Funcionalidades principales

- Listado y filtrado de presupuestos (`filterBudgets.ts`)
- Creación `/budgets/nou`: dos vistas (`lines` → `draft`), ver `docs/ADD_BUDGET_FLOW.md`
- Edición `/budgets/[id]/edit`: una pantalla (`BudgetEditView` + IA para añadir partidas)
- Navegación optimista post-guardado: `router.push('/budgets?new={id}')` → fetch puntual → deduplicación → `router.replace('/budgets')`
- IA: `POST /api/generate-budget-draft`, `POST /api/translate-budget-items`
- PDF presupuesto (CA/ES en edición), PDF factura
- Facturas desde presupuesto (`create_invoice_from_budget`)

---

## Rutas API

| Ruta                               | Uso                        |
| ---------------------------------- | -------------------------- |
| `POST /api/auth/login`             | Cookie `auth_session`      |
| `GET/POST /api/budgets`            | Listar / crear presupuesto |
| `GET/PUT /api/budgets/[id]`        | Detalle / actualizar       |
| `DELETE /api/budgets/[id]`         | Eliminar presupuesto       |
| `POST /api/generate-budget-draft`  | Texto → líneas IA          |
| `POST /api/translate-budget-items` | Traducción de partidas     |
| `POST /api/invoices/from-budget`   | Crear factura              |
| `PUT /api/invoices/[id]/status`    | Cambiar estado factura     |

---

## Componentes UI (presupuestos)

| Componente          | Uso                                               |
| ------------------- | ------------------------------------------------- |
| `BudgetsView`       | Listado                                           |
| `BudgetForm`        | Wrapper de `BudgetAIInput` en creación            |
| `BudgetAIInput`     | Textarea + envío IA (+ slider m² opcional)        |
| `BudgetDraftEditor` | Partidas editables en vista `lines` de `/nou`     |
| `BudgetDraftView`   | Cliente + partidas + guardar (crear y editar)     |
| `BudgetEditView`    | Página de edición; compone `BudgetDraftView` + IA |
| `BudgetClientForm`  | Campos del cliente                                |
| `DecimalFieldInput` | Inputs numéricos compartidos (`src/shared`)       |

**Obsoleto en flujo activo:** `BudgetLinesList` (eliminado del flujo de creación). `BudgetOptionGroupCard` / `DraggableLine` existen pero no se usan en el flujo actual.

---

## Flujo de datos (IA → guardar)

BudgetAIInput
→ POST /api/generate-budget-draft
→ parseBudgetLinesWithAI + hydrateBudgetLines
→ BudgetLine[] en useBudgetLines
→ generateBudgetDraft → BudgetClientItem[] (draftItems)
→ BudgetDraftView → saveBudgetWithLines (cliente)
→ POST /api/budgets → saveBudgetWithLines (servidor)
→ Supabase → { budgetId, contactId }
→ router.push('/budgets?new={budgetId}')

**Validación guardar (crear):** solo `client.nameOrCompany` no vacío (`isBudgetDraftComplete`).
**Mapeo líneas BD:** `toBudgetLineRows` — `description` nunca `null`; `unit_price` calculado si falta.

---

## Archivos IA

- `parseBudgetLinesWithAI.ts` — prompt y validación JSON
- `buildBudgetDraftFromAI.ts` — orquesta parse + hydrate
- `generateBudgetDraft.ts` — plantillas de descripción por tipo de línea
- `translateBudgetItems.ts` — traducción

---

## Grupos de opciones

Ver `docs/OPTION_GROUP_FLOW.md`. Metadatos `optionGroupId` / `optionLabel` desde la IA hasta PDF y BD.

---

## PDF

- **Presupuestos**: `generateBudgetPdf.ts` — bilingüe CA/ES, logo embedido vía canvas (MAX_WIDTH 600px, calidad 0.90).
- **Facturas**: `generateInvoicePdf.ts` — mismo tratamiento de logo.
- Logo fuente: `/public/logo-sanmarti.png`. Calidad limitada por el PNG fuente (generado por IA, sin vectorial disponible).

---

## Tests

- Unit: `src/features/**/__tests__` (Vitest; 158 tests)
- E2E: `cypress/e2e/` — login, budgets, new-budget (IA mock, grupos opción, slider)

---

## Variables de entorno

- `GROQ_API_KEY`, `GROQ_CHAT_COMPLETIONS_URL`
- `NEXT_PUBLIC_SUPABASE_URL`, claves Supabase (anon/service según uso)
- `APP_PASSWORD` — contraseña de login; cookie `auth_session` con expiración 30 días

---

## Documentación relacionada

| Doc                                            | Contenido                                                  |
| ---------------------------------------------- | ---------------------------------------------------------- |
| [progress.md](../progress.md)                  | Estado actual, tareas Jira, pendientes, definition of done |
| [ADD_BUDGET_FLOW.md](./ADD_BUDGET_FLOW.md)     | Creación en `/budgets/nou` paso a paso                     |
| [OPTION_GROUP_FLOW.md](./OPTION_GROUP_FLOW.md) | Alternativas IA (grupos de opciones)                       |

---

_Actualizado a 4 de junio de 2026._
