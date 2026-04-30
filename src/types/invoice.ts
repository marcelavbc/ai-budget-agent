export type InvoicePricingMode = "without_iva" | "with_iva";

export function invoicePricingLabel(mode: string | null | undefined): string {
  if (mode === "with_iva") return "Amb IVA";
  return "Sense IVA";
}

export function isInvoicePricingMode(
  value: unknown
): value is InvoicePricingMode {
  return value === "without_iva" || value === "with_iva";
}

export type InvoicePricingSlotKey = "withoutIva" | "withIva";

export function pricingModeToSlot(
  mode: InvoicePricingMode
): InvoicePricingSlotKey {
  return mode === "with_iva" ? "withIva" : "withoutIva";
}
