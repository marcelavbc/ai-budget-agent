import { buildAutoQuoteNumber } from "@/features/budgets/lib/generateQuoteNumber";

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
  optionGroupId?: string;
  optionLabel?: string;
  clientDescription?: string;
}

export interface BudgetDraftResponse {
  lines: BudgetLine[];
  errors?: string[];
}

export interface BudgetOptionGroup {
  /** Shared id across alternative options. */
  id: string;
  /** Title shown for the group (derived from first option). */
  title: string;
  options: BudgetLine[];
}

export type BudgetListItem = BudgetLine | BudgetOptionGroup;

export function isBudgetOptionGroup(
  item: BudgetListItem
): item is BudgetOptionGroup {
  return "options" in item && "id" in item;
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

export interface BudgetClientItem {
  id: string;
  title: string;
  description: string;
  total: number;
  quantity?: number;
  unitLabel?: BudgetLineUnit;
  unitPrice?: number;
  /** From IA / plantilla; used to apply the m² slider only to pintura de parets i sostres. */
  lineType?: BudgetLineType;
  optionGroupId?: string;
  optionLabel?: string;
  clientDescription?: string;
}

/** Budget header (client + reference); used for UI and PDF export. */
export interface BudgetClientDetails {
  nameOrCompany: string;
  clientTaxId?: string;
  clientAddressStreet?: string;
  clientAddressPostalCode?: string;
  clientAddressCity?: string;
  jobAddressStreet?: string;
  jobAddressPostalCode?: string;
  jobAddressCity?: string;
  taxRate: number | null;
  projectName?: string;
  quoteNumber: string;
  /** ISO YYYY-MM-DD (compatible with input type="date"). */
  date: string;
  /** Durada estimada del treball (text lliure, p. ex. dies hàbils). */
  estimatedTime: string;
  lang: "ca" | "es";
  identityLocked?: boolean;
}

export function defaultBudgetClientDetails(): BudgetClientDetails {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  const date = `${y}-${m}-${d}`;
  return {
    nameOrCompany: "",
    clientTaxId: "",
    clientAddressStreet: "",
    clientAddressPostalCode: "",
    clientAddressCity: "",
    jobAddressStreet: "",
    jobAddressPostalCode: "",
    jobAddressCity: "",
    taxRate: null,
    projectName: "",
    quoteNumber: buildAutoQuoteNumber("", date),
    date,
    estimatedTime: "",
    lang: "ca",
  };
}
