# Flujo de grupos de opciones (partidas alternativas)

## Resumen

Un **grupo de opciones** son dos o más partidas alternativas para el mismo trabajo (p. ej. Opció 1 / Opció 2). La IA los crea automáticamente según cómo el usuario describe el trabajo; no hay creación manual de grupos.

---

## Cómo se dispara un grupo

El usuario escribe alternativas en `BudgetAIInput`, por ejemplo:

> _"Passamà de fusta: opció 1 decapat + lasur o opció 2 polit + imprimació + esmalt"_

El prompt en `parseBudgetLinesWithAI` pide una línea por alternativa, con el mismo `optionGroupId` (kebab-case) y `optionLabel` secuencial (`"Opció 1"`, `"Opció 2"`, …).

```json
{
  "lines": [
    {
      "type": "enamel_varnish",
      "label": "Passamà: decapat + lasur",
      "quantity": 1,
      "unitLabel": "partida",
      "optionGroupId": "passama-fusta",
      "optionLabel": "Opció 1"
    },
    {
      "type": "enamel_varnish",
      "label": "Passamà: polit + esmalt",
      "quantity": 1,
      "unitLabel": "partida",
      "optionGroupId": "passama-fusta",
      "optionLabel": "Opció 2"
    }
  ]
}
```

Una línea normal no lleva `optionGroupId` ni `optionLabel`.

---

## Flujo paso a paso

### 1 — Usuario describe alternativas en `BudgetAIInput`

Envío del textarea → API de borrador IA.

### 2 — La IA devuelve varias líneas con `optionGroupId` compartido

`parseBudgetLinesWithAI` valida que `optionGroupId` y `optionLabel` vayan juntos o ninguno.

### 3 — Normalización y precios

`normalizeLinesWithDraftContext` (vía pipeline de `buildBudgetDraftFromAI` / `addLines`) asigna `unitPrice`, `subtotal`, `pricingMode`.

### 4 — `buildOptionGroups` agrupa el listado plano

En `useBudgetLines.addLines` / `removeLine`:

- Líneas consecutivas con el mismo `optionGroupId` y **≥ 2** → `BudgetOptionGroup { id, title, options[] }`.
- Si solo queda **1** línea con ese id → se deshace el grupo (`stripLine`) y la línea pasa a ser normal.

### 5 — UI en creación: `BudgetDraftEditor`

En `/budgets/nou` (vista `lines`), **`BudgetDraftEditor`** usa `segmentDraftItems` sobre `BudgetClientItem[]` (tras sync desde `generateBudgetDraft`):

- Partida suelta → tarjeta individual.
- Grupo → bloque **«Opcions alternatives»** con una tarjeta por opción (misma estructura que en el borrador).

> **Nota:** `BudgetOptionGroupCard` y `DraggableLine` siguen en el repo pero **no se usan** en el flujo actual de creación; la UI de grupos está duplicada inline en `BudgetDraftEditor` y `BudgetDraftView`.

### 6 — Eliminar una opción puede deshacer el grupo

`removeLine` → `stripLine` → si queda una sola opción, el grupo desaparece.

### 7 — Pasar al borrador (`draft`)

Al pulsar **«Generar pressupost»**, `draftItems` ya contienen `optionGroupId` / `optionLabel` por partida. `generateBudgetDraft` preserva esos metadatos al mapear desde `BudgetListItem[]`.

### 8 — Vista borrador: `BudgetDraftView`

También usa `segmentDraftItems` y renderiza grupos con el mismo patrón visual (cabecera «Opcions alternatives» + tarjetas por opción), sin `BudgetOptionGroupCard`.

---

## Modelo de datos

```
BudgetLine (trabajo / IA)
  id, label, type, quantity, unitLabel, unitPrice, subtotal
  optionGroupId?   ← compartido entre alternativas
  optionLabel?     ← "Opció 1", "Opció 2", …

BudgetOptionGroup (compuesto en memoria)
  id, title, options: BudgetLine[]

BudgetClientItem (borrador / BD / PDF)
  id, title, description, total, quantity?, unitLabel?, unitPrice?
  optionGroupId?, optionLabel?
  description ← plantilla técnica por tipo (generateBudgetDraft)
```

---

## Archivos clave

| Archivo                     | Rol                                                 |
| --------------------------- | --------------------------------------------------- |
| `parseBudgetLinesWithAI.ts` | Prompt + validación; emite metadatos de grupo       |
| `budgetListItems.ts`        | `buildOptionGroups`, `stripLine`, `getAllLines`     |
| `useBudgetLines.ts`         | Estado; agrupa en cada add/remove                   |
| `generateBudgetDraft.ts`    | Aplana grupos a `BudgetClientItem[]`                |
| `BudgetDraftEditor.tsx`     | UI de grupos en vista `lines`                       |
| `BudgetDraftView.tsx`       | UI de grupos en vista `draft` / edición             |
| `types/budget.ts`           | `BudgetLine`, `BudgetOptionGroup`, `BudgetListItem` |

## Tests

- E2E: `cypress/e2e/new-budget.cy.ts` — caso «renders option group card when AI returns alternative lines» (comprueba texto «Opcions alternatives» en la página).

---

_Documento alineado con la implementación a mayo de 2026._
