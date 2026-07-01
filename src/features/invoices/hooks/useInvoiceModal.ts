"use client";

import { useState } from "react";
import type { InvoicePricingMode } from "@/features/invoices/types/invoice";
import { getClientByBudgetId } from "@/features/invoices/lib/invoicesClient";

export type InvoiceModalStep = 1 | 1.5 | 2;

export type InvoiceModalJobAddress = {
  street?: string | null;
  postalCode?: string | null;
  city?: string | null;
};

export function useInvoiceModal(
  clientTaxId: string | null,
  budgetId: string,
  jobAddress: InvoiceModalJobAddress = {}
) {
  const jobStreet = (jobAddress.street ?? "").trim();
  const jobPostal = (jobAddress.postalCode ?? "").trim();
  const jobCity = (jobAddress.city ?? "").trim();

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
  const [hasFiscalAddress, setHasFiscalAddress] = useState(false);
  const [useDifferentFiscalAddress, setUseDifferentFiscalAddress] =
    useState(false);
  const [clientDataLoading, setClientDataLoading] = useState(false);

  async function openModal() {
    setOpen(true);
    setUseDifferentFiscalAddress(false);
    setClientDataLoading(true);

    try {
      const data = await getClientByBudgetId(budgetId);
      if (data) {
        setTaxId(data.tax_id ?? clientTaxId ?? "");
        const fiscalStreet = (data.fiscal_address_street ?? "").trim();
        if (fiscalStreet) {
          setHasFiscalAddress(true);
          setAddressStreet(data.fiscal_address_street ?? "");
          setAddressPostalCode(data.fiscal_address_postal_code ?? "");
          setAddressCity(data.fiscal_address_city ?? "");
        } else {
          setHasFiscalAddress(false);
          setAddressStreet(jobStreet);
          setAddressPostalCode(jobPostal);
          setAddressCity(jobCity);
        }
      } else {
        setTaxId(clientTaxId ?? "");
        setHasFiscalAddress(false);
        setAddressStreet(jobStreet);
        setAddressPostalCode(jobPostal);
        setAddressCity(jobCity);
      }
    } finally {
      setClientDataLoading(false);
    }
  }

  function toggleDifferentFiscalAddress(checked: boolean) {
    setUseDifferentFiscalAddress(checked);
    if (checked) {
      // Vaciar para que Roger introduzca la dirección fiscal
      setAddressStreet("");
      setAddressPostalCode("");
      setAddressCity("");
    } else {
      // Restaurar la dirección de la obra
      setAddressStreet(jobStreet);
      setAddressPostalCode(jobPostal);
      setAddressCity(jobCity);
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
    setHasFiscalAddress(false);
    setUseDifferentFiscalAddress(false);
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
    hasFiscalAddress,
    useDifferentFiscalAddress,
    toggleDifferentFiscalAddress,
    clientDataLoading,
    openModal,
    closeModal,
    selectPricing,
    confirmTaxRate,
    goBack,
  };
}
