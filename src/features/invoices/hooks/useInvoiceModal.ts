"use client";

import { useState } from "react";
import type { InvoicePricingMode } from "@/features/invoices/types/invoice";
import { getClientByBudgetId } from "@/features/invoices/lib/invoicesClient";

export type InvoiceModalStep = 1 | 1.5 | 2;

export function useInvoiceModal(clientTaxId: string | null, budgetId: string) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<InvoiceModalStep>(1);
  const [selectedPricingMode, setSelectedPricingMode] =
    useState<InvoicePricingMode | null>(null);
  const [taxRate, setTaxRate] = useState(21);
  const [taxId, setTaxId] = useState<string>(clientTaxId ?? "");
  const [issueDate, setIssueDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [addressStreet, setAddressStreet] = useState("");
  const [addressPostalCode, setAddressPostalCode] = useState("");
  const [addressCity, setAddressCity] = useState("");
  const [clientDataLoading, setClientDataLoading] = useState(false);

  async function openModal() {
    setOpen(true);
    setClientDataLoading(true);
    try {
      const data = await getClientByBudgetId(budgetId);
      if (data) {
        setTaxId(data.tax_id ?? clientTaxId ?? "");
        setAddressStreet(data.fiscal_address_street ?? "");
        setAddressPostalCode(data.fiscal_address_postal_code ?? "");
        setAddressCity(data.fiscal_address_city ?? "");
      }
    } finally {
      setClientDataLoading(false);
    }
  }

  function closeModal() {
    setOpen(false);
    setStep(1);
    setSelectedPricingMode(null);
    setTaxRate(21);
    setTaxId(clientTaxId ?? "");
    setAddressStreet("");
    setAddressPostalCode("");
    setAddressCity("");
  }

  function selectPricing(mode: InvoicePricingMode) {
    setSelectedPricingMode(mode);
    if (mode === "with_iva") {
      setStep(1.5);
    } else {
      setStep(2);
    }
  }

  function confirmTaxRate() {
    setStep(2);
  }

  function goBack() {
    if (step === 2 && selectedPricingMode === "with_iva") {
      setStep(1.5);
      return;
    }
    setStep(1);
  }

  return {
    open,
    step,
    selectedPricingMode,
    taxRate,
    setTaxRate,
    taxId,
    setTaxId,
    issueDate,
    setIssueDate,
    dueDate,
    setDueDate,
    addressStreet,
    setAddressStreet,
    addressPostalCode,
    setAddressPostalCode,
    addressCity,
    setAddressCity,
    clientDataLoading,
    openModal,
    closeModal,
    selectPricing,
    confirmTaxRate,
    goBack,
  };
}
