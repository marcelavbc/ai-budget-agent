# Add Budget — User Flow

## Overview

This document describes the real user flow for creating a new budget in the application (`/budgets/nou`). The flow is split into two sequential views managed by a local `view` state: **"lines"** and **"draft"**.

## Actors

- User: authenticated user navigating the app.
- AI backend: receives a natural-language description of a work item and returns structured line item data.
- System: persists the final budget via `saveBudgetWithLines`.

## Preconditions

- User is signed in.
- User is on the Budgets list page.

## Step-by-step Flow

### Phase 1 — View: `lines` (Add line items via AI)

1. **Navigate to Budgets**
   - User opens the `Budgets` section from the main navigation.

2. **Start a new budget**
   - User clicks the `New Budget` button.
   - The app navigates to `/budgets/nou`, which opens directly in the `lines` view.

3. **Add line items using AI (repeat as needed)**
   - The page shows `BudgetAIInput`: a text area where the user describes a work item in natural language (e.g. _"Pintar menjador de 20 m² en blanc"_).
   - Optionally the user adjusts a **price-per-m² slider** before submitting.
   - On submit, the description is sent to the AI backend (`/api/generate-budget-draft`), which returns a structured line item (description, quantity, unit, unit price, tax rate).
   - The generated line is added to `BudgetLinesList`, which shows all items and their running totals.
   - The user can **edit or remove** any line directly in the list.
   - Steps 3a–3c repeat until all line items are added.

4. **Generate draft**
   - Once satisfied with the line items, the user clicks **"Generar esborrany"**.
   - This calls `generateBudgetDraft(items)` client-side, which transforms the raw lines into `BudgetClientItem[]`.
   - The `view` state transitions to `"draft"`.

---

### Phase 2 — View: `draft` (Fill client details and save)

5. **Fill in client details**
   - `BudgetDraftView` renders alongside the draft items.
   - `BudgetClientForm` exposes the following fields:
     - Name or company
     - Street address, postal code, city
     - Estimated work duration
     - Quote number (auto-generated from client initials + date; editable)

6. **Review and adjust draft items**
   - The draft view shows the final line items. The user can still edit or remove individual items inline.

7. **Set budget status**
   - A status selector lets the user choose between: `draft`, `sent`, `approved`, `invoiced`.

8. **Export PDF (optional)**
   - User can export the current draft as a PDF before saving.

9. **Save**
   - User clicks **Save** (or equivalent).
   - `saveBudgetWithLines` POSTs the budget and all line items to the backend.
   - On success, the app redirects to the budget detail page.

10. **Convert to Invoice (optional)**
    - From the saved budget, the user may choose to create a linked invoice.

---

## Validations and Errors

- At least one line item must exist before the draft can be generated.
- Line-level validations: positive quantities and unit prices, valid tax rates.
- The quote number is auto-generated but can be manually overridden.
- On save failure: inline or banner error with a retry option.

## Postconditions

- A budget record exists in the database with a unique ID, status, client details, and all line items.
- The user is redirected to the budget detail/edit page.

## Key components and files

| Component / file               | Role                                                              |
| ------------------------------ | ----------------------------------------------------------------- |
| `src/app/budgets/nou/page.tsx` | Page entry point; owns `view`, `items`, and `clientDetails` state |
| `BudgetAIInput`                | Text area + AI submission for a single line item                  |
| `BudgetLinesList`              | Displays, edits, and removes accumulated line items               |
| `BudgetDraftView`              | Draft layout: client form + item review + save action             |
| `BudgetClientForm`             | Client/quote fields within the draft view                         |
| `generateBudgetDraft`          | Client-side transform from raw lines → `BudgetClientItem[]`       |
| `saveBudgetWithLines`          | API call that persists the budget and its lines                   |
| `/api/generate-budget-draft`   | AI endpoint: natural language → structured line item              |

---

This document reflects the actual implementation and is intended for product and engineering teams.
