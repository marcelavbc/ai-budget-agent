"use client";

import { useState } from "react";
import type { InvoicePricingMode } from "@/features/invoices/types/invoice";
import { getClientByBudgetId } from "@/features/invoices/lib/invoicesClient";

export function useInvoiceModal(clientTaxId: string | null, budgetId: string) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedPricingMode, setSelectedPricingMode] =
    useState<InvoicePricingMode | null>(null);
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
        setAddressStreet(data.address_street ?? "");
        setAddressPostalCode(data.address_postal_code ?? "");
        setAddressCity(data.address_city ?? "");
      }
    } finally {
      setClientDataLoading(false);
    }
  }

  function closeModal() {
    setOpen(false);
    setStep(1);
    setSelectedPricingMode(null);
    setTaxId(clientTaxId ?? "");
    setAddressStreet("");
    setAddressPostalCode("");
    setAddressCity("");
  }

  function selectPricing(mode: InvoicePricingMode) {
    setSelectedPricingMode(mode);
    setStep(2);
  }

  function goBack() {
    setStep(1);
  }

  return {
    open,
    step,
    selectedPricingMode,
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
    goBack,
  };
}
