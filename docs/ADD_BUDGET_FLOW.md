# Flujo de creación de presupuesto

## Resumen

Describe el flujo real de creación de un presupuesto en `/budgets/nou`. La página
usa un estado local `view` con dos vistas secuenciales: **`lines`** (añadir y editar
partidas) y **`draft`** (datos del cliente y guardar).

---

## Actores

- **Usuario**: autenticado (cookie `auth_session`).
- **IA (Groq)**: recibe texto en lenguaje natural y devuelve líneas estructuradas.
- **Sistema**: persiste el presupuesto vía `POST /api/budgets` → `saveBudgetWithLines`.

---

## Precondiciones

- Usuario con sesión iniciada.
- Navegación desde el listado de presupuestos (o enlace directo a `/budgets/nou`).

---

## Flujo paso a paso

### Fase 1 — Vista `lines` (añadir partidas con IA)

1. **Ir a Presupuestos** y pulsar **Nuevo presupuesto** → `/budgets/nou` (vista `lines` por defecto).

2. **Añadir partidas (repetible)**
   - `BudgetForm` envuelve `BudgetAIInput`: textarea + botón enviar.
   - Opcional: slider **precio por m²** (`pricePerSqm` en `useBudgetLines`).
   - Al enviar: `POST /api/generate-budget-draft` → líneas validadas e hidratadas → `useBudgetLines.addLines`.
   - Las partidas se muestran en **`BudgetDraftEditor`** (tarjetas editables).
   - El usuario puede editar en cada tarjeta: título, importe total, cantidad, unidad, descripción; y eliminar partidas.
   - Los cambios de precio/cantidad pasan por `handleDraftItemChange`, que sincroniza `draftItems` y `updateLine` para recalcular `hasPending`.

3. **Generar borrador**
   - Botón **«Generar esborrany»** (visible solo si hay partidas y `hasPending === false`).
   - No llama a la API: solo `setView("draft")`. Los `BudgetClientItem` ya están en `draftItems`.

### Fase 2 — Vista `draft` (cliente y guardar)

4. **Datos del cliente**
   - `BudgetDraftView` + `BudgetClientForm`: nombre o empresa, dirección (calle, CP, ciudad), duración estimada, número de presupuesto (autogenerado con iniciales + fecha, editable).

5. **Revisar partidas**
   - Mismas tarjetas editables que en la fase 1.
   - Botón **«← Tornar a les partides»** vuelve a la vista `lines`.
   - Se pueden eliminar partidas desde esta vista.

6. **Guardar**
   - Botón **«Guardar pressupost»**, habilitado si `isBudgetDraftComplete` (solo exige nombre o empresa).
   - `saveBudgetWithLines` (cliente) → `POST /api/budgets` → devuelve `{ budgetId, contactId }`.
   - Éxito: `router.push('/budgets?new={budgetId}')`.
     - El listado lee el param `new`, hace un fetch puntual de ese presupuesto, lo inyecta al inicio de la lista optimistamente y limpia la URL con `router.replace('/budgets')` una vez carga la lista general.
   - Error: mensaje en pantalla (`saveError`).

---

## Qué no ocurre en la creación (`mode="create"`)

- **Selector de estado** del presupuesto: solo en edición, como pill de solo lectura.
- **Exportar PDF**: menú CA/ES solo en edición.
- **Añadir partidas con IA** en la misma pantalla del borrador: solo en `/budgets/[id]/edit`.

---

## Validaciones y errores

| Regla            | Comportamiento                                                   |
| ---------------- | ---------------------------------------------------------------- |
| Generar borrador | Al menos una partida; ninguna pendiente de precio (`hasPending`) |
| Guardar          | Solo **nombre o empresa** obligatorio (`isBudgetDraftComplete`)  |
| Líneas en BD     | `description` vacía → `""`; `unit_price` derivado si falta       |
| IA vacía         | `BudgetAIInput` muestra error en `[role="alert"]`                |
| Fallo al guardar | Alerta en `BudgetDraftView`; cabecera del API registra el error  |

---

## Postcondiciones

- Registro en Supabase: `budgets`, `contacts`, `budget_lines`.
- Redirección al listado `/budgets` con el nuevo presupuesto visible inmediatamente.

---

## Archivos clave

| Archivo                             | Rol                                                             |
| ----------------------------------- | --------------------------------------------------------------- |
| `src/app/budgets/nou/page.tsx`      | Estado `view`, `items`, `draftItems`, `clientDetails`, handlers |
| `BudgetForm` / `BudgetAIInput`      | Entrada IA + slider m² (fase `lines`)                           |
| `BudgetDraftEditor`                 | Lista editable de partidas en fase `lines`                      |
| `BudgetDraftView`                   | Cliente + partidas + guardar en fase `draft`                    |
| `BudgetClientForm`                  | Campos del cliente                                              |
| `useBudgetLines`                    | Líneas de trabajo, `hasPending`, precio m²                      |
| `useQuoteNumber`                    | Autogeneración del número de presupuesto                        |
| `generateBudgetDraft`               | `BudgetLine[]` → `BudgetClientItem[]`                           |
| `DecimalFieldInput`                 | Inputs decimales editables                                      |
| `budgetsClient.saveBudgetWithLines` | `fetch` POST al API                                             |
| `/api/generate-budget-draft`        | IA: texto → líneas                                              |
| `/api/budgets`                      | Persistencia; devuelve `{ budgetId, contactId }`                |

---

## Evolución prevista

Unificar creación y edición en una sola pantalla (como `/budgets/[id]/edit`),
eliminando el paso «Generar esborrany». Ver `progress.md` → Pendientes.

---

_Actualizado a 4 de junio de 2026._
