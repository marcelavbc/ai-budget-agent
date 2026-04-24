import { jsPDF } from "jspdf";
import type { BudgetClientDetails, BudgetClientItem } from "@/types/budget";
import { formatEUR } from "@/lib/formatCurrency";
import {
  formatUnitCa,
  pdfCompanyCopyCa,
  pdfFinalSectionCopyCa,
  pdfLabelsCa,
} from "@/lib/pdfCopy.ca";
import { pdfFinalSectionCopyEs, pdfLabelsEs } from "@/lib/pdfCopy.es";

export interface GenerateBudgetPdfInput {
  client: BudgetClientDetails;
  items: BudgetClientItem[];
  total: number;
  lang?: "ca" | "es";
}

type RGB = { r: number; g: number; b: number };

const COLORS = {
  text: { r: 28, g: 28, b: 28 },
  muted: { r: 110, g: 110, b: 110 },
  line: { r: 224, g: 224, b: 224 },
  softLine: { r: 236, g: 236, b: 236 },
  softFill: { r: 250, g: 249, b: 247 },
  softFill2: { r: 245, g: 245, b: 245 },
  accent: { r: 200, g: 169, b: 110 }, // #c8a96e
  accentSoft: { r: 248, g: 243, b: 234 },
};

function setTextColor(doc: jsPDF, rgb?: RGB) {
  const c = rgb ?? COLORS.text;
  doc.setTextColor(c.r, c.g, c.b);
}

function safeTrim(value: string | undefined | null): string {
  return (value ?? "").trim();
}

function compactLines(values: Array<string | undefined | null>): string[] {
  return values.map((v) => safeTrim(v)).filter((v) => v.length > 0);
}

function splitFirstSentence(text: string): { first: string; rest: string } {
  const t = safeTrim(text);
  if (!t) return { first: "", rest: "" };
  const idx = t.indexOf(".");
  if (idx === -1) return { first: t, rest: "" };
  const first = t.slice(0, idx + 1).trim();
  const rest = t.slice(idx + 1).trim();
  return { first, rest };
}

function formatDateDdMmYyyy(value: string): string {
  const v = value.trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (!m) return v;
  const [, yyyy, mm, dd] = m;
  return `${dd}-${mm}-${yyyy}`;
}

function formatMeasurement(item: BudgetClientItem): string {
  const unit = safeTrim(item.unitLabel);
  const hasQty =
    typeof item.quantity === "number" && Number.isFinite(item.quantity);

  if (!hasQty && unit.length === 0) return "—";
  if (!hasQty) return unit;

  const qRaw = item.quantity as number;
  const q =
    Math.abs(qRaw - Math.round(qRaw)) < 1e-9
      ? String(Math.round(qRaw))
      : String(qRaw).replace(".", ",");

  if (unit.length === 0) return q;
  if (unit === "m²") return `${q} ${unit}`;

  return `${q} ${formatUnitCa(unit, q)}`;
}

export async function generateBudgetPdf({
  client,
  items,
  total,
  lang = "ca",
}: GenerateBudgetPdfInput): Promise<Blob> {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const labels = lang === "es" ? pdfLabelsEs : pdfLabelsCa;
  const finalSectionCopy = lang === "es" ? pdfFinalSectionCopyEs : pdfFinalSectionCopyCa;

  const marginX = 48;
  const footerH = 54;
  const headerTop = 40;
  const contentBottomY = pageHeight - footerH - 18;
  const firstPageStartY = headerTop + 136;
  const continuedPageStartY = headerTop + 76;
  const tableCols = {
    concept: 150,
    measure: 70,
    description: 205,
    amount: 82,
  };
  const tableWidth =
    tableCols.concept +
    tableCols.measure +
    tableCols.description +
    tableCols.amount;

  let y = 0;

  type HeaderVariant = "first" | "rest";

  function addPageBase(variant: HeaderVariant) {
    doc.addPage();
    drawPageChrome(variant);
    y = variant === "first" ? firstPageStartY : continuedPageStartY;
  }

  function ensureSpace(requiredHeight: number) {
    if (y + requiredHeight > contentBottomY) {
      addPageBase("rest");
    }
  }

  function drawPageChrome(variant: HeaderVariant) {
    drawHeader(variant);
  }

  function drawHeader(variant: HeaderVariant) {
    const top = headerTop;
    const left = marginX;
    const right = pageWidth - marginX;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    setTextColor(doc, COLORS.text);
    doc.text(pdfCompanyCopyCa.brand, left, top + 8);

    doc.setDrawColor(COLORS.accent.r, COLORS.accent.g, COLORS.accent.b);
    doc.setLineWidth(2);
    doc.line(left, top + 18, left + 135, top + 18);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    setTextColor(doc, COLORS.muted);
    doc.text(pdfCompanyCopyCa.subtitle.toUpperCase(), left, top + 36);

    const quote = safeTrim(client.quoteNumber);
    if (quote.length > 0) {
      const label = labels.quoteNumber(quote);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      setTextColor(doc, COLORS.muted);
      const w = doc.getTextWidth(label);
      doc.text(label, right - w, top + 12);
    }

    doc.setDrawColor(COLORS.line.r, COLORS.line.g, COLORS.line.b);
    doc.setLineWidth(1);
    doc.line(marginX, top + 54, pageWidth - marginX, top + 54);

    if (variant === "first") {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(17);
      setTextColor(doc, COLORS.text);
      doc.text(labels.documentTitle, marginX, top + 86);
    }
  }

  function drawFooter(pageNumber: number, totalPages: number) {
    const lineY = pageHeight - footerH;
    const bottomY = pageHeight - 24;

    doc.setDrawColor(COLORS.line.r, COLORS.line.g, COLORS.line.b);
    doc.setLineWidth(1);
    doc.line(marginX, lineY, pageWidth - marginX, lineY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    setTextColor(doc, COLORS.muted);

    doc.text(
      `${pdfCompanyCopyCa.brand} · ${pdfCompanyCopyCa.subtitle} · ${pdfCompanyCopyCa.phone}`,
      marginX,
      bottomY
    );

    const pageLabel = labels.page(pageNumber, totalPages);
    const labelWidth = doc.getTextWidth(pageLabel);
    doc.text(pageLabel, pageWidth - marginX - labelWidth, bottomY);
  }

  function drawClientIntroBlock() {
    const width = pageWidth - marginX * 2;
    const name = safeTrim(client.nameOrCompany);
    const addressLines = compactLines(
      safeTrim(client.address)
        .split("\n")
        .map((l) => l.trim())
    );
    const date = safeTrim(client.date);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    setTextColor(doc, COLORS.muted);
    doc.text(labels.client, marginX, y);
    y += 14;

    if (name.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      setTextColor(doc, COLORS.text);
      doc.text(name, marginX, y);
      y += 16;
    }

    if (addressLines.length > 0) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      setTextColor(doc, COLORS.text);

      for (const l of addressLines) {
        const wrapped = doc.splitTextToSize(l, width) as string[];
        for (const wl of wrapped) {
          doc.text(wl, marginX, y);
          y += 13;
        }
      }
      y += 4;
    }

    if (date.length > 0) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      setTextColor(doc, COLORS.muted);
      doc.text(labels.date(formatDateDdMmYyyy(date)), marginX, y);
      y += 10;
    }

    y += 10;
  }

  function drawTableHeader() {
    const rowH = 24;

    ensureSpace(rowH + 12);

    doc.setFillColor(
      COLORS.softFill2.r,
      COLORS.softFill2.g,
      COLORS.softFill2.b
    );
    doc.setDrawColor(COLORS.softLine.r, COLORS.softLine.g, COLORS.softLine.b);
    doc.roundedRect(marginX, y, tableWidth, rowH, 4, 4, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    setTextColor(doc, COLORS.muted);

    const pad = 10;
    const xConcept = marginX + pad;
    const xMeasure = marginX + tableCols.concept + pad;
    const xDesc = marginX + tableCols.concept + tableCols.measure + pad;

    doc.text(labels.table.concept, xConcept, y + 16);
    doc.text(labels.table.measure, xMeasure, y + 16);
    doc.text(labels.table.description, xDesc, y + 16);
    doc.text(labels.table.amount, marginX + tableWidth - pad, y + 16, {
      align: "right",
    });

    y += rowH + 6;
  }

  function drawItemRow(item: BudgetClientItem) {
    const padding = 10;
    const conceptX = marginX + padding;
    const measureX = marginX + tableCols.concept + padding;
    const descX = marginX + tableCols.concept + tableCols.measure + padding;
    const amountX = marginX + tableWidth - padding;

    const concept = item.title?.trim() || labels.fallbackConcept;
    const description =
      item.description?.trim() || labels.fallbackDescription;
    const measurement = formatMeasurement(item);
    const amount = formatEUR(item.total);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    const conceptLines = doc.splitTextToSize(
      concept,
      tableCols.concept - padding * 2
    ) as string[];

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    const descLines = doc.splitTextToSize(
      description,
      tableCols.description - padding * 2
    ) as string[];

    const lineH = 13;
    const conceptH = conceptLines.length * lineH;
    const descH = descLines.length * lineH;
    const rowH = Math.max(34, Math.max(conceptH, descH) + 14);

    ensureSpace(rowH + 2);

    doc.setDrawColor(COLORS.softLine.r, COLORS.softLine.g, COLORS.softLine.b);
    doc.line(marginX, y + rowH, marginX + tableWidth, y + rowH);

    // Concept
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    setTextColor(doc, COLORS.text);
    let conceptY = y + 14;
    for (const line of conceptLines) {
      doc.text(line, conceptX, conceptY);
      conceptY += lineH;
    }

    // Measurement (single line, subtle)
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    setTextColor(doc, COLORS.muted);
    const measureW = tableCols.measure - padding * 2;
    const measureText =
      measurement.length > 0
        ? (doc.splitTextToSize(measurement, measureW) as string[])[0]
        : "—";
    doc.text(measureText ?? "—", measureX, y + 14);

    // Description
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    setTextColor(doc, COLORS.text);
    let descY = y + 14;
    for (const line of descLines) {
      doc.text(line, descX, descY);
      descY += lineH;
    }

    // Amount
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    setTextColor(doc, COLORS.text);
    doc.text(amount, amountX, y + 14, { align: "right" });

    y += rowH;
  }

  function drawTotalsBox(subtotal: number) {
    const totalAmount = subtotal;

    const rowH = 34;
    ensureSpace(rowH + 18);

    const right = pageWidth - marginX;
    const left = right - 260;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12.5);
    setTextColor(doc, COLORS.text);
    doc.text(labels.total, left, y + 28);
    doc.text(formatEUR(totalAmount), right, y + 28, { align: "right" });

    y += rowH + 16;
  }

  function drawFinalTextSection(input: {
    heading: string;
    materials: string;
    payment: string;
    validity: string;
    generalConditions: string[];
  }) {
    const width = pageWidth - marginX * 2;
    const bodyW = width;

    ensureSpace(80);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12.5);
    setTextColor(doc, COLORS.text);
    doc.text(input.heading, marginX, y);

    doc.setDrawColor(COLORS.accent.r, COLORS.accent.g, COLORS.accent.b);
    doc.setLineWidth(1);
    doc.line(marginX, y + 10, marginX + 120, y + 10);
    y += 32;

    const { first: ivaSentence, rest: validityRest } = splitFirstSentence(
      input.validity
    );

    if (ivaSentence) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.8);
      setTextColor(doc, COLORS.text);
      const ivaLines = doc.splitTextToSize(ivaSentence, bodyW) as string[];
      ensureSpace(ivaLines.length * 14 + 14);
      for (const line of ivaLines) {
        doc.text(line, marginX, y);
        y += 14;
      }
      y += 10;
    }

    const paragraphs = [
      `${safeTrim(input.materials)} ${safeTrim(input.payment)}`.trim(),
      `${safeTrim(validityRest)} ${safeTrim(input.generalConditions[0])}`.trim(),
      `${safeTrim(input.generalConditions[1])} ${safeTrim(
        input.generalConditions[2]
      )}`.trim(),
      safeTrim(input.generalConditions[3]),
    ].filter((p) => p.length > 0);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    setTextColor(doc, COLORS.muted);

    for (const p of paragraphs) {
      const wrapped = doc.splitTextToSize(p, bodyW) as string[];
      ensureSpace(wrapped.length * 13 + 18);
      for (const line of wrapped) {
        doc.text(line, marginX, y);
        y += 13;
      }
      y += 12;
    }
  }

  drawPageChrome("first");
  y = firstPageStartY;
  drawClientIntroBlock();
  drawTableHeader();

  for (const item of items) {
    drawItemRow(item);
  }

  drawTotalsBox(total);

  // The final section always starts on a new page to avoid splitting legal text.
  addPageBase("rest");
  y += 4;
  drawFinalTextSection({
    heading: labels.finalSection.heading,
    materials: finalSectionCopy.materials,
    payment: finalSectionCopy.payment,
    validity: finalSectionCopy.validity,
    generalConditions: finalSectionCopy.generalConditions,
  });

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i += 1) {
    doc.setPage(i);
    drawFooter(i, totalPages);
  }

  return doc.output("blob");
}
