"use client";

import Link from "next/link";
import type { BudgetClientDetails, BudgetClientItem } from "@/types/budget";
import type { BudgetLineRow, BudgetRow, ClientRow } from "@/lib/budgets";
import { formatEUR } from "@/lib/formatCurrency";
import { generateBudgetPdf } from "@/lib/generateBudgetPdf";
import { useMemo, useState } from "react";

interface Props {
  budget: BudgetRow;
  client: ClientRow;
  lines: BudgetLineRow[];
}

export function BudgetDetailView({ budget, client, lines }: Props) {
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const { itemsForPdf, clientForPdf, totalForPdf } = useMemo(() => {
    const itemsForPdf: BudgetClientItem[] = lines.map((l) => ({
      id: l.id,
      title: (l.title ?? "").trim() || "Línia",
      description: (l.description ?? "").trim(),
      total: l.line_total ?? 0,
      quantity: l.quantity ?? undefined,
      unitLabel: (l.unit ?? undefined) as BudgetClientItem["unitLabel"],
      unitPrice: l.unit_price ?? undefined,
    }));

    const clientForPdf: BudgetClientDetails = {
      nameOrCompany: (client.name ?? "").trim(),
      email: (client.email ?? "").trim(),
      address: (budget.job_address ?? client.address ?? "").trim(),
      quoteNumber: (budget.quote_number ?? "").trim(),
      date: (budget.document_date ?? "").trim(),
      estimatedTime: (budget.estimated_time ?? "").trim(),
    };

    return {
      itemsForPdf,
      clientForPdf,
      totalForPdf: budget.total ?? budget.subtotal ?? 0,
    };
  }, [
    budget.document_date,
    budget.estimated_time,
    budget.job_address,
    budget.quote_number,
    budget.subtotal,
    budget.total,
    client.address,
    client.email,
    client.name,
    lines,
  ]);

  async function handleGeneratePdf() {
    if (generatingPdf) return;
    setGeneratingPdf(true);
    try {
      const blob = await generateBudgetPdf({
        client: clientForPdf,
        items: itemsForPdf,
        total: totalForPdf,
      });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
    } finally {
      setGeneratingPdf(false);
    }
  }

  return (
    <section style={{ marginTop: "2rem" }}>
      <h1 style={{ margin: 0 }}>
        {budget.title ?? `Pressupost ${budget.id}`}
      </h1>
      <p style={{ margin: "0.5rem 0 0", color: "#666" }}>
        <strong>Estat:</strong> {budget.status ?? "—"} {" · "}
        <strong>Adreça:</strong> {budget.job_address ?? "—"}
      </p>

      {(budget.quote_number || budget.document_date || budget.estimated_time) ? (
        <p style={{ margin: "0.5rem 0 0", color: "#666" }}>
          {budget.quote_number ? (
            <>
              <strong>Núm. pressupost:</strong> {budget.quote_number}{" "}
            </>
          ) : null}
          {budget.document_date ? (
            <>
              <strong>Data:</strong> {budget.document_date}{" "}
            </>
          ) : null}
          {budget.estimated_time ? (
            <>
              <strong>Temps estimat:</strong> {budget.estimated_time}
            </>
          ) : null}
        </p>
      ) : null}

      {budget.notes ? (
        <p style={{ marginTop: "0.75rem" }}>
          <strong>Notes:</strong> {budget.notes}
        </p>
      ) : null}

      <h2 style={{ marginTop: "1.5rem" }}>Partides</h2>
      {lines.length === 0 ? (
        <p>No hi ha partides.</p>
      ) : (
        <ul style={{ paddingLeft: "1.25rem" }}>
          {lines.map((l) => (
            <li key={l.id} style={{ margin: "0.35rem 0" }}>
              <strong>{(l.title ?? "").trim() || "—"}</strong>
              {(l.description ?? "").trim().length > 0 ? (
                <>
                  {" "}
                  <span style={{ color: "#666" }}>
                    — {(l.description ?? "").trim()}
                  </span>
                </>
              ) : null}{" "}
              <span style={{ color: "#666" }}>
                ({l.quantity ?? "—"} {l.unit ?? ""})
              </span>{" "}
              — <strong>{formatEUR(l.line_total ?? 0)}</strong>
            </li>
          ))}
        </ul>
      )}
      <p style={{ margin: "0.25rem 0" }}>
        <strong>Total:</strong>{" "}
        {formatEUR(budget.total ?? budget.subtotal ?? 0)}
      </p>

      <div
        style={{
          marginTop: "1rem",
          display: "flex",
          gap: "0.75rem",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <Link
          href={`/budgets/${budget.id}/edit`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid #ddd",
            background: "#fff",
            color: "#2a2a2a",
            borderRadius: 10,
            padding: "0.7rem 1rem",
            fontSize: "0.9rem",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Editar
        </Link>

        <button
          type="button"
          onClick={handleGeneratePdf}
          disabled={generatingPdf}
          style={{
            padding: "0.7rem 1rem",
            borderRadius: 10,
            border: "1px solid #ddd",
            background: "#111",
            color: "#fff",
            cursor: generatingPdf ? "not-allowed" : "pointer",
            opacity: generatingPdf ? 0.6 : 1,
          }}
        >
          {generatingPdf ? "Generant PDF…" : "Generar PDF"}
        </button>
      </div>
    </section>
  );
}
