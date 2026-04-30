import { jsPDF } from "jspdf";
import type { BudgetClientDetails, BudgetClientItem } from "@/types/budget";
import { formatEUR } from "@/lib/formatCurrency";
import { hexToRgb, theme } from "@/theme/colors";
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
  lang?: "ca" | "es";
}

type RGB = { r: number; g: number; b: number };

const { colors: C } = theme;

const COLORS = {
  text: hexToRgb(C.black),
  muted: hexToRgb(C.blackSoft),
  line: hexToRgb(C.beigeMedium),
  softLine: hexToRgb(C.beigeLight),
  softFill: hexToRgb(C.background),
  softFill2: hexToRgb(C.beigeLight),
  accent: hexToRgb(C.goldMedium),
  accentSoft: hexToRgb(C.goldLight),
};

async function loadImageAsDataUrl(src: string): Promise<string> {
  const response = await fetch(src);
  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function naturalSizeFromDataUrl(
  dataUrl: string
): Promise<{ w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () =>
      resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => reject(new Error("No s'ha pogut llegir el logo"));
    img.src = dataUrl;
  });
}

function fitLogoSize(
  naturalW: number,
  naturalH: number,
  maxW: number,
  maxH: number
): { w: number; h: number } {
  if (naturalW <= 0 || naturalH <= 0) return { w: maxW, h: maxH };
  const aspect = naturalW / naturalH;
  let w = maxW;
  let h = w / aspect;
  if (h > maxH) {
    h = maxH;
    w = h * aspect;
  }
  return { w, h };
}

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

  return {
    first: t.slice(0, idx + 1).trim(),
    rest: t.slice(idx + 1).trim(),
  };
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
  lang = "ca",
}: GenerateBudgetPdfInput): Promise<Blob> {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const logoDataUrl = await loadImageAsDataUrl("/logo-sanmarti.png");
  const logoNatural = await naturalSizeFromDataUrl(logoDataUrl);
  const { w: logoW, h: logoH } = fitLogoSize(
    logoNatural.w,
    logoNatural.h,
    380,
    136
  );

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const labels = lang === "es" ? pdfLabelsEs : pdfLabelsCa;
  const finalSectionCopy =
    lang === "es" ? pdfFinalSectionCopyEs : pdfFinalSectionCopyCa;

  const marginX = 48;
  const footerH = 54;
  const headerTop = 40;
  const contentBottomY = pageHeight - footerH - 18;

  const logoTopY = headerTop - 8;
  const headerSeparatorY = logoTopY + logoH + 16;
  const firstPageTitleY = headerSeparatorY + 40;
  const firstPageStartY = firstPageTitleY + 48;
  const continuedPageStartY = headerSeparatorY + 28;

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

    doc.addImage(logoDataUrl, "PNG", left, logoTopY, logoW, logoH);

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
    doc.line(marginX, headerSeparatorY, pageWidth - marginX, headerSeparatorY);

    if (variant === "first") {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      setTextColor(doc, COLORS.text);
      doc.text(labels.documentTitle, marginX, firstPageTitleY);
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

      for (const line of addressLines) {
        const wrapped = doc.splitTextToSize(line, width) as string[];

        for (const wrappedLine of wrapped) {
          doc.text(wrappedLine, marginX, y);
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
    return drawItemRowInternal(item);
  }

  function drawItemRowInternal(
    item: BudgetClientItem,
    opts?: { indentX?: number; conceptOverride?: string }
  ) {
    const padding = 10;
    const indentX = opts?.indentX ?? 0;
    const conceptX = marginX + padding + indentX;
    const measureX = marginX + tableCols.concept + padding;
    const descX = marginX + tableCols.concept + tableCols.measure + padding + indentX;
    const amountX = marginX + tableWidth - padding;

    const concept =
      opts?.conceptOverride?.trim() || item.title?.trim() || labels.fallbackConcept;
    const description = item.description?.trim() || labels.fallbackDescription;
    const measurement = formatMeasurement(item);
    const amount = formatEUR(item.total);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    const conceptLines = doc.splitTextToSize(
      concept,
      tableCols.concept - padding * 2 - indentX
    ) as string[];

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    const descLines = doc.splitTextToSize(
      description,
      tableCols.description - padding * 2 - indentX
    ) as string[];

    const lineH = 13;
    const conceptH = conceptLines.length * lineH;
    const descH = descLines.length * lineH;
    const rowH = Math.max(34, Math.max(conceptH, descH) + 14);

    ensureSpace(rowH + 2);

    doc.setDrawColor(COLORS.softLine.r, COLORS.softLine.g, COLORS.softLine.b);
    doc.line(marginX, y + rowH, marginX + tableWidth, y + rowH);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    setTextColor(doc, COLORS.text);

    let conceptY = y + 14;
    for (const line of conceptLines) {
      doc.text(line, conceptX, conceptY);
      conceptY += lineH;
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    setTextColor(doc, COLORS.muted);

    const measureW = tableCols.measure - padding * 2;
    const measureText =
      measurement.length > 0
        ? (doc.splitTextToSize(measurement, measureW) as string[])[0]
        : "—";

    doc.text(measureText ?? "—", measureX, y + 14);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    setTextColor(doc, COLORS.text);

    let descY = y + 14;
    for (const line of descLines) {
      doc.text(line, descX, descY);
      descY += lineH;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    setTextColor(doc, COLORS.text);
    doc.text(amount, amountX, y + 14, { align: "right" });

    y += rowH;
  }

  function drawOptionGroupHeader() {
    const rowH = 22;
    ensureSpace(rowH + 8);

    doc.setFillColor(
      COLORS.accentSoft.r,
      COLORS.accentSoft.g,
      COLORS.accentSoft.b
    );
    doc.setDrawColor(COLORS.softLine.r, COLORS.softLine.g, COLORS.softLine.b);
    doc.roundedRect(marginX, y, tableWidth, rowH, 4, 4, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    setTextColor(doc, COLORS.text);
    doc.text(labels.optionGroupHeader, marginX + 10, y + 15);

    y += rowH + 6;
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

    for (const paragraph of paragraphs) {
      const wrapped = doc.splitTextToSize(paragraph, bodyW) as string[];
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

  let idx = 0;
  while (idx < items.length) {
    const item = items[idx]!;
    const optionGroupId = safeTrim(item.optionGroupId);

    if (!optionGroupId) {
      drawItemRow(item);
      idx += 1;
      continue;
    }

    const groupItems: BudgetClientItem[] = [item];
    let j = idx + 1;
    while (j < items.length) {
      const next = items[j]!;
      if (safeTrim(next.optionGroupId) !== optionGroupId) break;
      groupItems.push(next);
      j += 1;
    }

    if (groupItems.length < 2) {
      drawItemRow({ ...item, optionGroupId: undefined, optionLabel: undefined });
      idx = j;
      continue;
    }

    drawOptionGroupHeader();
    for (const opt of groupItems) {
      const optLabel = safeTrim(opt.optionLabel) || "Opció";
      drawItemRowInternal(opt, {
        indentX: 14,
        conceptOverride: `${optLabel}: ${safeTrim(opt.title)}`,
      });
    }

    idx = j;
  }

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
