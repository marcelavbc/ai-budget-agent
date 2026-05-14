# Option Group Flow — Alternative Budget Items

## Overview

An **option group** is a set of two or more alternative line items that cover the same job with different treatments. Instead of creating separate budgets, the user can present the client with labelled alternatives (Opció 1, Opció 2, …) grouped under a single card.

Option groups are created **automatically by the AI** — the user never manually creates them. The trigger is the way the user describes the work in natural language.

---

## How an option group is triggered

The user describes a work item that explicitly contains **alternative treatments**, for example:

> _"Passamà de fusta: opció 1 decapat + lasur o opció 2 polit + imprimació + esmalt"_

The AI system prompt (`parseBudgetLinesWithAI`) detects that the description contains alternatives and emits **one line per alternative**, all sharing the same `optionGroupId` (a short kebab-case string, e.g. `"passama-fusta"`) and a sequential `optionLabel` (`"Opció 1"`, `"Opció 2"`, …).

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

A normal (non-alternative) line never carries `optionGroupId` or `optionLabel`.

---

## Step-by-step flow

### 1 — User describes alternatives in `BudgetAIInput`

The user types a description containing alternative options in the AI text input and submits.

### 2 — AI returns multiple lines with shared `optionGroupId`

`parseBudgetLinesWithAI` calls the Groq API with the system prompt and returns an `AIParsedBudgetLines` payload. Validation enforces that `optionGroupId` and `optionLabel` are either both present or both absent.

### 3 — Lines are normalised and priced

`normalizeLinesWithDraftContext` fills in `unitPrice`, `subtotal`, and `pricingMode` for each returned line, including option lines.

### 4 — `buildOptionGroups` groups the flat lines

`useBudgetLines.addLines` calls `buildOptionGroups` after merging the new lines with the existing list. `buildOptionGroups` scans the flat `BudgetLine[]` array and:

- Collects consecutive lines that share the same `optionGroupId`.
- If **≥ 2** lines share the id → creates a `BudgetOptionGroup` `{ id, title, options[] }` where `title` is derived from the first option's label.
- If only **1** line has a given id (e.g. the user removed the others) → the group is disbanded and the line is promoted back to a normal ungrouped line (with `optionGroupId` and `optionLabel` stripped).

### 5 — `BudgetLinesList` renders a `BudgetOptionGroupCard`

For each `BudgetListItem`:

- Plain `BudgetLine` → rendered as a `DraggableLine`.
- `BudgetOptionGroup` → rendered as a `BudgetOptionGroupCard`.

`BudgetOptionGroupCard` shows:

- A "Opcions alternatives" kicker and the group title.
- Each option as a labelled row (`Opció 1`, `Opció 2`, …) wrapping a `DraggableLine`.
- The user can edit quantity/price or remove individual options directly inside the card.

### 6 — Removing an option line may disband the group

When the user removes an option line via `onRemoveLine`, `useBudgetLines.removeLine` calls `stripLine`. If after removal only **1** option remains, the group is disbanded and the survivor becomes a plain ungrouped line.

### 7 — Generating the draft (`generateBudgetDraft`)

When the user clicks **"Generar esborrany"**, `generateBudgetDraft` flattens the items list back to `BudgetClientItem[]`. For each `BudgetOptionGroup` it maps each option to a `BudgetClientItem` preserving `optionGroupId` and `optionLabel`, so the draft view can still render them grouped.

### 8 — Draft view renders option groups via `segmentDraftItems`

`BudgetDraftView` runs `segmentDraftItems` on the `BudgetClientItem[]` array. Items that share the same `optionGroupId` are collected into an `optionGroup` segment and rendered as a `BudgetOptionGroupCard`. Items without `optionGroupId` are rendered as individual rows.

---

## Data model summary

```
BudgetLine (raw AI output / lines view)
  id            string
  label         string
  optionGroupId string   ← shared across alternatives
  optionLabel   string   ← "Opció 1", "Opció 2", …

BudgetOptionGroup (composed by buildOptionGroups)
  id      string          ← same as optionGroupId
  title   string          ← first option's label
  options BudgetLine[]

BudgetClientItem (draft view)
  id            string
  title         string
  description   string    ← AI-generated template text
  total         number
  optionGroupId string?
  optionLabel   string?
```

---

## Key files

| File                                                        | Role                                                                  |
| ----------------------------------------------------------- | --------------------------------------------------------------------- |
| `src/features/budgets/lib/parseBudgetLinesWithAI.ts`        | AI prompt + validation; emits `optionGroupId` / `optionLabel`         |
| `src/features/budgets/lib/budgetListItems.ts`               | `buildOptionGroups`, `stripLine`, `isOptionLine`                      |
| `src/features/budgets/hooks/useBudgetLines.ts`              | State; calls `buildOptionGroups` on every `addLines` / `removeLine`   |
| `src/features/budgets/components/BudgetOptionGroupCard.tsx` | UI card for a group in the lines view                                 |
| `src/features/budgets/lib/generateBudgetDraft.ts`           | Flattens groups to `BudgetClientItem[]` preserving option metadata    |
| `src/features/budgets/components/BudgetDraftView.tsx`       | Calls `segmentDraftItems`; renders groups in the draft view           |
| `src/features/budgets/types/budget.ts`                      | Type definitions: `BudgetLine`, `BudgetOptionGroup`, `BudgetListItem` |
