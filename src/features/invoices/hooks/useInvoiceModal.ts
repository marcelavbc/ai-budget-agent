"use client";

import { useState } from "react";
import type { InvoicePricingMode } from "@/features/invoices/types/invoice";

export function useInvoiceModal(clientTaxId: string | null) {
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

  function openModal() {
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
    setStep(1);
    setSelectedPricingMode(null);
    setTaxId(clientTaxId ?? "");
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
    openModal,
    closeModal,
    selectPricing,
    goBack,
  };
}
