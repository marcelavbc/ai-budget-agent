# Progreso del proyecto — ai-budget-agent

Última actualización: **22 de mayo de 2026**

Documento de seguimiento del trabajo realizado. Refleja el estado del código en `main` (commit local `871c2e8`, 1 commit por delante de `origin/main`).

---

## Resumen

Aplicación Next.js (App Router) para gestionar **pressupostos** y **factures**, con generación de partidas asistida por IA (Groq) y persistencia en Supabase. El dominio principal está en `src/features/budgets` e `src/features/invoices`.

| Área | Estado |
|------|--------|
| Auth (cookie + middleware) | Hecho |
| Listado / filtrado de pressupostos | Hecho |
| Creació de pressupost amb IA (`/budgets/nou`) | Hecho (flujo unificat, una sola pantalla) |
| Edición de pressupost guardat (`/budgets/[id]/edit`) | Hecho |
| Guardar pressupost (POST `/api/budgets`) | Hecho (fix NOT NULL, may 2026) |
| Factures des de pressupost + PDF | Hecho |
| Tests Vitest | **158 tests** en verde |
| Tests Cypress E2E | Presentes (`cypress/e2e/`) |
| UX descripció Roger (text usuari vs plantilla) | **Hecho** (may 2026) |
| Camp `lang` a pressupostos | Hecho (may 2026) |
| Traducció manual CA/ES amb revisió | **Hecho** (may 2026) |
| Eliminació camp `address` legacy de clients | Hecho (may 2026) |

---

## Infraestructura y arquitectura

- **Next.js 15** + React 19 + TypeScript, puerto dev **3001**.
- Estructura por **features** (`budgets`, `invoices`) + `src/shared`.
- **Sin estado global** (Zustand/Context): estado local en páginas y hooks.
- **CSS Modules** por componente.
- **Supabase** solo desde server (`getSupabaseClient`); tipos en `src/core/types/supabase.ts`.
- **IA**: Groq vía `src/features/budgets/lib/ai/groq.ts` — rutas `/api/generate-budget-draft`, `/api/translate-budget-items`.
- Documentación de flujos: `docs/ADD_BUDGET_FLOW.md`, `docs/OPTION_GROUP_FLOW.md`, `docs/AI_ASSISTANT_CONTEXT.md`.

---

## Pressupostos — hecho

### Listado y filtros

- Vista de pressupostos con tabla/tarjetas, filtros por texto, estado y rango de fechas.
- Lógica extraída a `filterBudgets.ts` + tests (`filterBudgets.test.ts`).

### Creació (`/budgets/nou`)

- Una sola pantalla: `BudgetDraftView` (mode="create") + `BudgetAIInput` en `itemsFooter`
- `useBudgetCreateController` gestiona todo el estado
- Eliminats: `useBudgetLines`, `BudgetDraftEditor`, `generateBudgetDraft`, vista lines/draft, botó «Generar esborrany», useEffect de sincronització
- Nous arxius: `useBudgetCreateController`, `budgetLinesToClientItemsFromAI`, `budgetDescriptionTemplates`

### UX descripció Roger (may 2026)

- La IA genera `clientDescription` per cada línia parsejada
- `budgetDescriptionTemplates.ts` centralitza la lògica de plantilles (Jotun, Isaval, Titanlux) i és usat per `budgetLinesToClientItemsFromAI` i `generateBudgetDraft` (aquest últim eliminat)
- `repair` i `custom` usen `clientDescription` directament com a descripció
- Tipus amb plantilla mostren la plantilla amb color interpolat + bloc col·lapsable "Text original de Roger" amb botó "Usar text original" a `BudgetDraftView`

### Edición de pressupostos guardados

- Ruta `/budgets/[id]/edit` → `BudgetEditView` + `useBudgetEditController`.
- Misma UI base que el esborrany (`BudgetDraftView` en `mode="edit"`).
- Permite editar cliente y partidas, **añadir partidas con IA** (`BudgetAIInput` con label «Afegir»), guardar con `PUT`.
- `useRouter` migrado a `next/navigation` (no `next/router`).

### Grupos de opciones (IA)

- La IA puede devolver varias líneas con el mismo `optionGroupId` (alternativas).
- UI agrupa en tarjetas «Opcions alternatives» (`BudgetDraftEditor`, `BudgetDraftView`, `BudgetOptionGroupCard`).
- Documentado en `docs/OPTION_GROUP_FLOW.md` + tests E2E de renderizado.

### PDF de pressupost

- Export CA/ES desde `BudgetDraftView` (modo edición) vía `usePdfExport` / `generateBudgetPdf`.

### Idioma i traducció (may 2026)

- Camp `lang`: "ca" | "es" afegit a la taula budgets (NOT NULL, default "ca")
- `BudgetClientDetails` té `lang` — es persiste en crear i actualitzar pressupostos
- La traducció automàtica al generar PDF ha estat eliminada
- `BudgetDraftView` (mode="edit") té botons "Traduir al castellà" / "Tornar al català" amb snapshot local
- Al traduir, `client.lang` canvia a "es" i es desa; al revertir, torna a "ca"
- `generateBudgetPdf` usa `client.lang` per seleccionar els textos del PDF
- `buildPdfFilename` usa `client.lang` per al prefix del fitxer (Pressupost/Presupuesto)
- Listado: columna "Idioma" amb badge CA/ES; botó PDF genera directament en l'idioma desat
- `BudgetsListTable` té ara el seu propi CSS module (`BudgetsListTable.module.css`)

### Eliminació address legacy (may 2026)

- Columna `address` eliminada de la taula clients — els camps estructurats `address_street`, `address_postal_code`, `address_city` són l'única font de veritat
- Tipus Supabase regenerats
- Codi netejat a `budgets.ts`, `helpers.ts`, `mapBudgetEditInitialState.ts`, `pdfCopy.ca.ts`, `pdfCopy.es.ts`, `generateBudgetPdf.ts`

### Refactors y tests (pressupostos)

- Helpers de líneas → `budgetListItems.ts`, `budgetLineComputations.ts`.
- Tests: `useBudgetLines`, `mapBudgetEditInitialState`, `helpers`, `budgetDraft`, `hydrateBudgetLines`, `buildBudgetDraftFromAI`, `budgetOptionGroups`, etc.

---

## Cambios recientes (sesión 21 may 2026)

Commits locales (aún no pusheados a `origin/main`):

### `08ef2a1` — `BudgetDraftEditor` y gestión de partidas en nou

- Nuevo componente **`BudgetDraftEditor`**: edición inline de partidas antes del esborrany final.
- Eliminado **`BudgetLinesList`** del flujo de creación (sustituido por el editor).
- Nuevo **`DecimalFieldInput`** (`src/shared/components/DecimalFieldInput.tsx`): permite borrar el `0` y escribir importes sin quedar `0200` (estado de texto local mientras se edita).
- Sincronización **`handleDraftItemChange`**: actualiza `draftItems` y llama a `updateLine` para que `hasPending` recalcule el botón «Generar esborrany» al añadir precio.

### `871c2e8` — validación, guardado y UX del esborrany

- **`isBudgetDraftComplete`**: solo exige **Nom o empresa** con texto (ya no obliga número de pressupost, fecha, durada ni descripció de partidas para habilitar guardar).
- **`BudgetDraftView` en creación**: partidas **editables** (antes `readOnly` en `mode="create"`); se puede eliminar partidas desde el esborrany (`onItemRemove` en `nou/page.tsx`).
- **POST `/api/budgets`**: logging del error real + mensaje en JSON (`error: message`).
- **`toBudgetLineRows`** (`helpers.ts`):
  - `description` vacía → `""` (no `null`) — cumple NOT NULL en BD.
  - `unit_price` ausente → calculado desde `total / quantity`, o `0`.
  - `calcBudgetHeaderAmounts` tolera `total` undefined (`?? 0`).
- Tests actualizados en `budgetDraft.test.ts` y `helpers.test.ts`.

**No hace falta migración de BD** para el fix de guardado: el esquema ya exigía NOT NULL; se corrigió el mapeo en la app.

---

## Factures — hecho

- Crear factura desde pressupost (RPC `create_invoice_from_budget` + API + modal).
- Listado con filtros (`filterInvoices.ts` + tests).
- Detalle de factura, PDF, cambio de estado (`InvoiceStatusPill`, API status).
- Dirección estructurada del cliente, datos del emisor desde settings.
- Historial: se implementó **`emit_invoice`** (RPC + API + `EmitInvoiceButton`) y luego se **retiró** del código de app (`fd985ec`); el tipo `emit_invoice` puede seguir en `supabase.ts` como resto de tipos generados.

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

Cobertura relevante: hooks de líneas, filtros, mapeo edición, helpers de guardado, generación de borrador IA (mocks), option groups.

---

## Pendiente y discutido

### 1. Unificar flujo de creación — hecho (may 2026)

Hoy crear un pressupost tiene **dos pantallas** (`lines` → `draft`). En edición ya hay **una sola** pantalla editable + IA.

**Propuesta acordada**: eliminar `view: "lines" | "draft"`, el botón «Generar esborrany» y reutilizar en `/budgets/nou` el mismo patrón que `/budgets/[id]/edit` (`BudgetDraftView` + `BudgetAIInput` + guardar con POST).

**Estado**: implementado (may 2026).

### 2. UX descripció para Roger — hecho (may 2026)

**Solució implementada**:
- La IA genera `clientDescription` per cada línia parsejada, amb els detalls específics que Roger ha escrit (materials, colors, tècniques).
- `hydrateBudgetLines` propaga `clientDescription` a `BudgetLine`.
- `generateBudgetDraft` usa `clientDescription` directament per a tipus sense plantilla (`repair`, `custom`). Per a tipus amb plantilla, la plantilla és la descripció principal i el color s'interpola des de `clientDescription` si Roger l'ha especificat.
- `BudgetDraftEditor` mostra un bloc col·lapsable "Text original de Roger" amb botó "Usar text original" quan hi ha plantilla i difereix de `clientDescription`.
- `nou/page.tsx` preserva `clientDescription` en el merge `items → draftItems`.

**Arxius modificats**: `parseBudgetLinesWithAI.ts`, `hydrateBudgetLines.ts`, `generateBudgetDraft.ts`, `BudgetDraftEditor.tsx`, `nou/page.tsx`, tipus `BudgetLine` i `BudgetClientItem`.

### 3. Revisión de código (may 2026)

Revisión estática documentada en conversación ([revisión Next.js](655a73f9-b7cd-40a5-8ed6-f3c587170464)) — hallazgos principales:

| Prioridad | Tema |
|-----------|------|
| Alta | Duplicación UI entre `BudgetDraftEditor` y `BudgetDraftView` (tarjetas de partida) |
| Alta | `BudgetDraftView` muy grande (~400 líneas): extraer lista de partidas / footer |
| Media | Props de `BudgetDraftView` no usadas (`footerNotice`, etc.) |
| Media | CSS huérfano en `.module.css` |
| Baja | Dependencias sin uso; unificar patrones loading/error |

No se aplicaron refactors de esa revisión aún.

### 4. Documentación / DX

- `PROGRESS.md` / `progress.md` no estaban versionados; este archivo cubre el hueco.
- Recomendaciones abiertas en `docs/AI_ASSISTANT_CONTEXT.md`: `docs/ROUTES.md`, `env.example`.

---

## Comportamiento actual que conviene recordar

- **Botón «Guardar pressupost»**: habilitado con solo el nombre/empresa del cliente rellenado.
- **Descripcions**: la IA genera `clientDescription` per cada línia. `budgetLinesToClientItemsFromAI` aplica plantilles des de `budgetDescriptionTemplates.ts` (color interpolat des de `clientDescription` si Roger l'especifica). Tipus sense plantilla (`repair`, `custom`) usen `clientDescription` directament. A `BudgetDraftView`, tipus amb plantilla mostren bloc col·lapsable "Text original de Roger" amb botó "Usar text original".
- **Flux creació = flux edició**: `/budgets/nou` usa el mateix patró que `/budgets/[id]/edit`. No hi ha dos passos ni sincronització manual.
- **Guardar con descripciones vacías**: OK en UI; en BD se persisten como `""`.
- **Edición post-guardado**: completa en `/budgets/[id]/edit`.

---

## Commits recientes (referencia)

```
871c2e8 fix: error handling guardado API + validación esborrany (solo nom/empresa) + toBudgetLineRows
08ef2a1 feat: BudgetDraftEditor + DecimalFieldInput + sync updateLine/hasPending
d0a7369 refactor: BudgetLinesList CSS y botones
b57dade test: option groups en nou
041e9ba docs: ADD_BUDGET_FLOW, OPTION_GROUP_FLOW
533e428 test: Cypress E2E budgets + nou
```

---

## Próximos pasos sugeridos (orden práctico)

1. **Refactor** compartit Editor/View de partidas (ara ja resolt parcialment amb l'unificació; queda extreure llista de partides si cal).
2. Añadir **`env.example`** y documentar variables en `docs/AI_ASSISTANT_CONTEXT.md`.
3. **Revisión de components UI** (pendent de la revisió iniciada avui — duplicación, props no usadas, CSS huérfano).
4. **Revisió CSS huèrfan** a `BudgetsView.module.css` (classes de taula duplicades ara que `BudgetsListTable` té CSS propi).
