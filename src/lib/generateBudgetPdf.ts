import { jsPDF } from "jspdf";
import type { BudgetClientDetails, BudgetClientItem } from "@/types/budget";
import { formatEUR } from "@/lib/formatCurrency";
import { hexToRgb, theme } from "@/theme/colors";
import {
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

// Measurement column intentionally removed from the PDF table layout.

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
  const firstPageStartY = firstPageTitleY + 24;
  const continuedPageStartY = headerSeparatorY + 28;

  const tableCols = {
    concept: 150,
    description: 275,
    amount: 82,
  };

  const tableWidth =
    tableCols.concept +
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
    const right = pageWidth - marginX;
    const topY = y;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    setTextColor(doc, COLORS.muted);
    doc.text(labels.client, marginX, y);

    if (date.length > 0) {
      const dateLabel = labels.date(formatDateDdMmYyyy(date));
      const dateW = doc.getTextWidth(dateLabel);
      doc.text(dateLabel, right - dateW, y);
    }

    y += 12;

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

      y += 2;
    }

    // Keep a compact separation before the table.
    y = Math.max(y, topY + 48);
    y += 8;
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
    const xDesc = marginX + tableCols.concept + pad;

    doc.text(labels.table.concept, xConcept, y + 16);
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
    const descX = marginX + tableCols.concept + padding + indentX;
    const amountX = marginX + tableWidth - padding;

    const concept =
      opts?.conceptOverride?.trim() || item.title?.trim() || labels.fallbackConcept;
    const description = item.description?.trim() || labels.fallbackDescription;
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
    const topPad = 14;

    let remainingDesc = [...descLines];
    let firstChunk = true;

    while (remainingDesc.length > 0) {
      // Ensure we have at least a minimal area to print.
      ensureSpace(34 + 2);

      const available = contentBottomY - y;
      const maxDescLines = Math.max(1, Math.floor((available - topPad - 8) / lineH));
      const descChunk = remainingDesc.slice(0, maxDescLines);
      remainingDesc = remainingDesc.slice(maxDescLines);

      const chunkConceptLines = firstChunk ? conceptLines : [];
      const conceptH = chunkConceptLines.length * lineH;
      const descH = descChunk.length * lineH;
      const rowH = Math.max(34, Math.max(conceptH, descH) + topPad);

      // If the computed row doesn't fit, start a new page and retry chunk sizing.
      if (y + rowH > contentBottomY) {
        addPageBase("rest");
        continue;
      }

      doc.setDrawColor(COLORS.softLine.r, COLORS.softLine.g, COLORS.softLine.b);
      doc.line(marginX, y + rowH, marginX + tableWidth, y + rowH);

      if (firstChunk) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        setTextColor(doc, COLORS.text);

        let conceptY = y + topPad;
        for (const line of chunkConceptLines) {
          doc.text(line, conceptX, conceptY);
          conceptY += lineH;
        }
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      setTextColor(doc, COLORS.text);

      let descY = y + topPad;
      for (const line of descChunk) {
        doc.text(line, descX, descY);
        descY += lineH;
      }

      if (firstChunk) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        setTextColor(doc, COLORS.text);
        doc.text(amount, amountX, y + topPad, { align: "right" });
      }

      y += rowH;
      firstChunk = false;
    }
  }

  function drawOptionGroupHeader(title: string) {
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
    const headerTitle = safeTrim(title) || labels.optionGroupHint;
    doc.text(headerTitle, marginX + 10, y + 15);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    setTextColor(doc, COLORS.muted);
    const hint = labels.optionGroupHint;
    const hintW = doc.getTextWidth(hint);
    doc.text(hint, marginX + tableWidth - 10 - hintW, y + 15);

    y += rowH + 6;
  }

  function deriveOptionGroupTitle(groupItems: BudgetClientItem[]): string {
    const titles = groupItems.map((it) => safeTrim(it.title)).filter(Boolean);
    if (titles.length === 0) return "";

    const prefixes = titles
      .map((t) => {
        const idx = t.indexOf(":");
        return idx === -1 ? "" : t.slice(0, idx).trim();
      })
      .filter(Boolean);

    if (prefixes.length === titles.length) {
      const first = prefixes[0]!;
      if (prefixes.every((p) => p === first)) return `${first}:`;
      return `${prefixes[0]!}:`;
    }

    const idx = titles[0]!.indexOf(":");
    if (idx !== -1) return `${titles[0]!.slice(0, idx).trim()}:`;
    return titles[0]!;
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
      for (const line of ivaLines) {
        ensureSpace(14 + 6);
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
      for (const line of wrapped) {
        ensureSpace(13 + 10);
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

    drawOptionGroupHeader(deriveOptionGroupTitle(groupItems));
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
