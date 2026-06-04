# Progreso del proyecto — ai-budget-agent

Última actualización: **4 de junio de 2026**

Documento de seguimiento del trabajo realizado y decisiones tomadas.

---

## Resumen

Aplicación Next.js (App Router) para gestionar **presupuestos** y **facturas**, con generación de partidas asistida por IA (Groq) y persistencia en Supabase. El dominio principal está en `src/features/budgets` y `src/features/invoices`.

| Área                                                   | Estado                                                  |
| ------------------------------------------------------ | ------------------------------------------------------- |
| Auth (cookie + middleware)                             | ✅ Hecho                                                |
| Listado / filtrado de presupuestos                     | ✅ Hecho                                                |
| Creación de presupuesto con IA (`/budgets/nou`)        | ✅ Hecho (flujo en 2 pasos)                             |
| Edición de presupuesto guardado (`/budgets/[id]/edit`) | ✅ Hecho                                                |
| Guardar presupuesto (POST `/api/budgets`)              | ✅ Hecho                                                |
| Navegación optimista al listado post-guardado          | ✅ Hecho (KAN-21)                                       |
| Calidad del logo en PDFs                               | ✅ Hecho (KAN-17)                                       |
| Facturas desde presupuesto + PDF                       | ✅ Hecho                                                |
| Tests Vitest                                           | **158 tests** en verde                                  |
| Tests Cypress E2E                                      | Presentes (`cypress/e2e/`)                              |
| UX descripción Roger (texto usuario vs plantilla)      | ❌ No en el repo actual — ver [Pendientes](#pendientes) |

---

## Infraestructura y arquitectura

- **Next.js 15.3.1** (versión fijada, sin `^`) + React 19 + TypeScript, puerto dev **3001**.
- Estructura por **features** (`budgets`, `invoices`) + `src/shared`.
- **Sin estado global** (sin Zustand ni Context): estado local en páginas y hooks.
- **CSS Modules** por componente.
- **Supabase** solo desde server (`getSupabaseClient`); tipos en `src/core/types/supabase.ts`.
- **IA**: Groq vía `src/features/budgets/lib/ai/groq.ts` — rutas `/api/generate-budget-draft`, `/api/translate-budget-items`.
- Modelo de datos: tabla `contacts` (migrada desde `clients`); presupuestos y facturas referencian `contact_id`.

⚠️ **Versión Next.js fijada sin `^`** — Next.js 15.5.x introdujo un bug crítico con las DevTools internas (`segment-explorer-node.js`) que rompía el bundle. No actualizar sin verificar.

---

## Presupuestos — hecho

### Listado y filtros

- Vista con tabla/tarjetas, filtros por texto, estado y rango de fechas.
- Lógica extraída a `filterBudgets.ts` + tests.

### Creación (`/budgets/nou`) — flujo actual en dos pasos

1. **Vista `lines`**: `BudgetForm` + IA (`BudgetAIInput`) → partidas en `useBudgetLines` + vista previa en `BudgetDraftEditor`.
2. **Vista `draft`**: botón «Generar esborrany» → `BudgetDraftView` (datos cliente + guardar).

Post-guardado: navega a `/budgets?new={budgetId}`. El listado lee el param `new`, hace un fetch puntual de ese presupuesto y lo inyecta optimistamente mientras carga la lista general. Una vez cargada, hace `router.replace('/budgets')` para limpiar la URL.

Archivos clave:

- `src/app/budgets/nou/page.tsx`
- `src/features/budgets/components/BudgetDraftEditor.tsx`
- `src/features/budgets/components/BudgetDraftView.tsx`
- `src/features/budgets/hooks/useBudgetLines.ts`
- `src/features/budgets/lib/generateBudgetDraft.ts`

### Edición de presupuestos guardados

- Ruta `/budgets/[id]/edit` → `BudgetEditView` + `useBudgetEditController`.
- Misma UI base que el borrador (`BudgetDraftView` en `mode="edit"`).
- Permite editar cliente y partidas, añadir partidas con IA, guardar con `PUT`.

### Grupos de opciones (IA)

- La IA puede devolver varias líneas con el mismo `optionGroupId` (alternativas).
- UI agrupa en tarjetas «Opcions alternatives».
- Documentado en `docs/OPTION_GROUP_FLOW.md`.

### PDF de presupuesto

- Export CA/ES desde `BudgetDraftView` (modo edición) vía `usePdfExport` / `generateBudgetPdf`.
- Logo: PNG procesado vía canvas antes de embedder (MAX_WIDTH 600px, calidad JPEG 0.90). La calidad es la máxima posible con el PNG fuente actual — si Roger quiere más calidad, necesita un logo vectorial profesional.

---

## Facturas — hecho

- Crear factura desde presupuesto (RPC `create_invoice_from_budget` + API + modal).
- Listado con filtros (`filterInvoices.ts` + tests).
- Detalle de factura, PDF, cambio de estado (`InvoiceStatusPill`, API status).
- Dirección estructurada del cliente, datos del emisor desde settings.
- RPC `emit_invoice` diseñada y retirada del código de app (`fd985ec`); el tipo puede seguir en `supabase.ts`.

---

## Autenticación — hecho

- Login con contraseña → cookie `auth_session`.
- Middleware protege rutas de la app.
- Tests E2E de login.

---

## Testing

```bash
pnpm test        # Vitest — 158 tests, 17 archivos
pnpm run dev     # http://localhost:3001
# Cypress E2E (manual): cypress/e2e/*.cy.ts
```

---

## Tareas Jira abiertas

| Clave  | Descripción                                                       | Estado |
| ------ | ----------------------------------------------------------------- | ------ |
| KAN-18 | Añadir unidad "dies" al campo de duración estimada                | To Do  |
| KAN-19 | Consistencia de fuente y etiqueta "Client" en PDFs                | To Do  |
| KAN-22 | Revisión y limpieza de la base de datos (padre)                   | To Do  |
| KAN-23 | Auditoría: identificar campos y RPCs no utilizados                | To Do  |
| KAN-24 | Limpieza: eliminar campos y RPCs obsoletos (bloqueada por KAN-23) | To Do  |

---

## Pendientes

### 1. Unificar flujo de creación (acordado, no implementado)

Eliminar `view: "lines" | "draft"` y el botón «Generar esborrany». Reutilizar en `/budgets/nou` el mismo patrón que `/budgets/[id]/edit` (`BudgetDraftView` + `BudgetAIInput` + guardar con POST).

### 2. UX descripción Roger (diseñado, no en el repo)

`description` = texto del cliente (Roger); `suggestedDescription` = plantilla (solo UI). Implementado y probado en sesión de agente (166 tests en ese momento) pero **nunca commiteado**. Reimplementar o recuperar desde backup.

### 3. Deuda técnica de revisión de código (mayo 2026)

| Prioridad | Tema                                                                               |
| --------- | ---------------------------------------------------------------------------------- |
| Alta      | Duplicación UI entre `BudgetDraftEditor` y `BudgetDraftView` (tarjetas de partida) |
| Alta      | `BudgetDraftView` muy grande (~400 líneas): extraer lista de partidas / footer     |
| Media     | Props de `BudgetDraftView` no usadas (`footerNotice`, etc.)                        |
| Media     | CSS huérfano en `.module.css`                                                      |
| Baja      | Dependencias sin uso; unificar patrones loading/error                              |

### 4. Al eliminar un presupuesto

El contacto asociado debería eliminarse si no tiene otros presupuestos. Actualmente solo se elimina el presupuesto.

---

## Comportamiento actual que conviene recordar

- **Botón «Generar esborrany»**: deshabilitado mientras `hasPending` (partidas sin precio válido).
- **Botón «Guardar pressupost»**: habilitado con solo el nombre/empresa del cliente.
- **Descripciones al crear**: plantillas por tipo (`generateBudgetDraft`); Roger las edita manualmente.
- **Guardar con descripciones vacías**: OK en UI; en BD se persisten como `""`.
- **RLS en la tabla `settings` debe permanecer desactivado** — activarlo hace que `getSettings()` retorne null silenciosamente.
- **Valores en BD siempre en inglés** — claves de estado (`draft`, `issued`, `paid`), códigos de lengua (`ca`, `es`). La localización es solo en la capa UI.

---

## Definition of done

Antes de cerrar cualquier tarea:

1. `pnpm build` sin errores
2. Todos los tests en verde
3. Verificado en local (e idealmente en Vercel)
4. Este `progress.md` actualizado
5. Actualizar otros `.md` afectados por el cambio

---

## Commits de referencia

```
871c2e8 fix: error handling guardado API + validación borrador
08ef2a1 feat: BudgetDraftEditor + DecimalFieldInput + sync updateLine/hasPending
d0a7369 refactor: BudgetLinesList CSS y botones
b57dade test: option groups en nou
041e9ba docs: ADD_BUDGET_FLOW, OPTION_GROUP_FLOW
533e428 test: Cypress E2E budgets + nou
```
