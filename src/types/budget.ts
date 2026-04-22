import { buildAutoQuoteNumber } from "@/lib/generateQuoteNumber";

export interface BudgetRequest {
  description: string;
}

export type BudgetLineType =
  | "walls_and_ceilings"
  | "repair"
  | "doors"
  | "windows"
  | "enamel_varnish"
  | "exterior"
  | "custom";

export type BudgetLineUnit = "m²" | "unitat" | "partida";

export type BudgetLinePricingMode = "range" | "input";

export interface BudgetLine {
  id: string;
  type: BudgetLineType;
  label: string;
  quantity: number;
  unitLabel: BudgetLineUnit;
  unitPrice: number;
  subtotal: number;
  pricingMode: BudgetLinePricingMode;
}

export interface BudgetDraftResponse {
  lines: BudgetLine[];
  total: number | null;
  errors?: string[];
}

export interface BudgetGroup {
  id: string;
  zone: string;
  lines: BudgetLine[];
  subtotal: number;
}

export type BudgetListItem = BudgetLine | BudgetGroup;

export function isBudgetGroup(item: BudgetListItem): item is BudgetGroup {
  return "zone" in item && "lines" in item;
}

export const templateGroup: Record<BudgetLineType, string> = {
  walls_and_ceilings: "interior",
  repair: "interior",
  exterior: "exterior",
  doors: "openings",
  windows: "openings",
  enamel_varnish: "enamel",
  custom: "custom",
};

export function canGroup(a: BudgetLine, b: BudgetLine): boolean {
  const groupA = templateGroup[a.type];
  const groupB = templateGroup[b.type];
  return groupA === groupB && groupA !== "custom";
}

export interface BudgetClientItem {
  id: string;
  title: string;
  description: string;
  total: number;
  quantity?: number;
  unitLabel?: BudgetLineUnit;
  unitPrice?: number;
}

/** Capçalera del pressupost (client + referència); preparat per exportar a PDF més endavant. */
export interface BudgetClientDetails {
  nameOrCompany: string;
  email: string;
  address: string;
  quoteNumber: string;
  /** ISO YYYY-MM-DD (compatible amb input type="date") */
  date: string;
  /** Termini o text lliure (p. ex. dies hàbils). */
  estimatedTime: string;
}

export function defaultBudgetClientDetails(): BudgetClientDetails {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  const date = `${y}-${m}-${d}`;
  return {
    nameOrCompany: "",
    email: "",
    address: "",
    quoteNumber: buildAutoQuoteNumber("", date),
    date,
    estimatedTime: "",
  };
}
