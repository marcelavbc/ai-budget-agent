"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { updateInvoiceStatus } from "@/features/invoices/lib/invoicesClient";
import styles from "./InvoicesView.module.css";

type Props = {
  invoiceId: string;
  initialStatus: string;
  onStatusChange?: (next: string) => void;
};

function pillClass(s: string): string {
  if (s === "issued") return styles.pillSent;
  if (s === "paid") return styles.pillApproved;
  return styles.pillDraft;
}

export default function InvoiceStatusPill({
  invoiceId,
  initialStatus,
  onStatusChange,
}: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const handleClick = async () => {
    if (status !== "issued" || saving) return;
    const prev = status;
    try {
      setStatus("paid");
      setSaving(true);
      await updateInvoiceStatus(invoiceId, "paid");
      onStatusChange?.("paid");
      router.refresh();
    } catch (err) {
      setStatus(prev);
    } finally {
      setSaving(false);
    }
  };

  if (status === "issued") {
    return (
      <button
        type="button"
        title="Marcar com a cobrada"
        className={`${styles.pill} ${pillClass(status)}`}
        onClick={handleClick}
        aria-disabled={saving}
      >
        {saving ? "..." : "Emesa"}
      </button>
    );
  }

  return (
    <span className={`${styles.pill} ${pillClass(status)}`} aria-hidden>
      {status === "paid" ? "Cobrada" : status}
    </span>
  );
}
