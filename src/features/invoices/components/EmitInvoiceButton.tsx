"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { emitInvoice } from "@/features/invoices/lib/invoicesClient";

type EmitInvoiceButtonProps = {
  invoiceId: string;
  status: string;
};

export function EmitInvoiceButton({
  invoiceId,
  status,
}: EmitInvoiceButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status !== "draft") return null;

  async function handleClick() {
    setLoading(true);
    setError(null);

    try {
      await emitInvoice(invoiceId);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : "No s'ha pogut emetre la factura."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={handleClick} disabled={loading}>
        {loading ? "…" : "Emetre factura"}
      </button>
      {error ? <p role="alert">{error}</p> : null}
    </div>
  );
}
