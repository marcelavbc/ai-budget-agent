import { jsPDF } from "jspdf";
import type { BudgetClientDetails, BudgetClientItem } from "@/types/budget";
import { formatEUR } from "@/lib/formatCurrency";

export interface GenerateBudgetPdfInput {
  client: BudgetClientDetails;
  items: BudgetClientItem[];
  total: number;
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

const COMPANY = {
  brand: "SANMARTÍ",
  subtitle: "Pintura decorativa",
  email: "navarroisanmarti@gmail.com",
  phone: "616 287 601",
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

  if (unit === "unitat") {
    return `${q} ${q === "1" ? "unitat" : "unitats"}`;
  }

  if (unit === "partida") {
    return `${q} ${q === "1" ? "partida" : "partides"}`;
  }

  return `${q} ${unit}`;
}

function drawTextBlock(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  width: number,
  lineHeight = 14
): number {
  const lines = doc.splitTextToSize(text, width) as string[];
  let currentY = y;

  for (const line of lines) {
    doc.text(line, x, currentY);
    currentY += lineHeight;
  }

  return currentY;
}

function buildIntroText(client: BudgetClientDetails): string {
  const address = safeTrim(client.address);
  if (address) {
    const singleLineAddress = address.replace(/\n+/g, ", ");
    return `Treballs de pintura a realitzar a ${singleLineAddress}.`;
  }

  return "Treballs de pintura detallats segons les partides indicades en aquest pressupost.";
}

function buildInterventionSummary(items: BudgetClientItem[]): string {
  const nonEmptyTitles = items
    .map((item) => item.title?.trim())
    .filter((value): value is string => Boolean(value));

  if (nonEmptyTitles.length === 0) {
    return "S'inclou la preparació de superfícies, la protecció dels elements susceptibles de ser tacats i l'acabat final segons les partides indicades.";
  }

  const uniqueTitles = Array.from(new Set(nonEmptyTitles)).slice(0, 3);

  if (uniqueTitles.length === 1) {
    return `Intervenció prevista sobre ${uniqueTitles[0].toLowerCase()}, amb preparació de superfícies i acabat final segons necessitat.`;
  }

  if (uniqueTitles.length === 2) {
    return `Intervenció prevista sobre ${uniqueTitles[0].toLowerCase()} i ${uniqueTitles[1].toLowerCase()}, amb preparació de superfícies i acabat final segons necessitat.`;
  }

  return `Intervenció prevista sobre ${uniqueTitles[0].toLowerCase()}, ${uniqueTitles[1].toLowerCase()} i altres elements indicats al detall de partides.`;
}

export async function generateBudgetPdf({
  client,
  items,
  total,
}: GenerateBudgetPdfInput): Promise<Blob> {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

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
    doc.text(COMPANY.brand, left, top + 8);

    doc.setDrawColor(COLORS.accent.r, COLORS.accent.g, COLORS.accent.b);
    doc.setLineWidth(2);
    doc.line(left, top + 18, left + 135, top + 18);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    setTextColor(doc, COLORS.muted);
    doc.text(COMPANY.subtitle.toUpperCase(), left, top + 36);

    const quote = safeTrim(client.quoteNumber);
    if (quote.length > 0) {
      const label = `Pressupost núm. ${quote}`;
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
      doc.text("PRESSUPOST DE PINTURA", marginX, top + 86);
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
      `${COMPANY.brand} · ${COMPANY.subtitle} · ${COMPANY.phone}`,
      marginX,
      bottomY
    );

    const pageLabel = `Pàgina ${pageNumber} / ${totalPages}`;
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
    doc.text("Client", marginX, y);
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
      doc.text(`Data: ${formatDateDdMmYyyy(date)}`, marginX, y);
      y += 10;
    }

    y += 10;
  }

  function drawSectionTitle(title: string) {
    ensureSpace(28);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    setTextColor(doc, COLORS.text);
    doc.text(title, marginX, y);

    doc.setDrawColor(COLORS.accent.r, COLORS.accent.g, COLORS.accent.b);
    doc.setLineWidth(1);
    doc.line(marginX, y + 8, marginX + 56, y + 8);

    y += 22;
  }

  function drawSectionTitleWide(title: string) {
    ensureSpace(30);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11.5);
    setTextColor(doc, COLORS.text);
    doc.text(title, marginX, y);

    doc.setDrawColor(COLORS.line.r, COLORS.line.g, COLORS.line.b);
    doc.setLineWidth(1);
    doc.line(marginX, y + 10, pageWidth - marginX, y + 10);

    y += 26;
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

    doc.text("CONCEPTE", xConcept, y + 16);
    doc.text("MESURA", xMeasure, y + 16);
    doc.text("DESCRIPCIÓ", xDesc, y + 16);
    doc.text("IMPORT", marginX + tableWidth - pad, y + 16, { align: "right" });

    y += rowH + 6;
  }

  function drawItemRow(item: BudgetClientItem) {
    const padding = 10;
    const conceptX = marginX + padding;
    const measureX = marginX + tableCols.concept + padding;
    const descX = marginX + tableCols.concept + tableCols.measure + padding;
    const amountX = marginX + tableWidth - padding;

    const concept = item.title?.trim() || "Concepte";
    const description = item.description?.trim() || "Segons treball indicat.";
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
    doc.text("Total", left, y + 28);
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

    function drawSubsection(label: string, paragraph: string) {
      ensureSpace(84);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.2);
      setTextColor(doc, COLORS.text);
      doc.text(label, marginX, y);
      y += 16;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      setTextColor(doc, COLORS.muted);
      const wrapped = doc.splitTextToSize(paragraph, bodyW) as string[];
      ensureSpace(wrapped.length * 13 + 26);
      for (const line of wrapped) {
        doc.text(line, marginX, y);
        y += 13;
      }

      y += 18;
    }

    function drawNumberedConditions(label: string, conditions: string[]) {
      ensureSpace(120);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.2);
      setTextColor(doc, COLORS.text);
      doc.text(label, marginX, y);
      y += 18;

      const numW = 18;
      const textX = marginX + numW;
      const textW = bodyW - numW;
      const lineH = 12.8;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.6);
      setTextColor(doc, COLORS.muted);

      for (let i = 0; i < conditions.length; i += 1) {
        const c = conditions[i];
        const n = `${i + 1}.`;
        const wrapped = doc.splitTextToSize(c, textW) as string[];

        ensureSpace(Math.max(44, wrapped.length * lineH + 18));

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.6);
        setTextColor(doc, COLORS.muted);
        doc.text(n, marginX, y);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.6);
        setTextColor(doc, COLORS.muted);
        for (const line of wrapped) {
          doc.text(line, textX, y);
          y += lineH;
        }
        y += 10;
      }

      y += 10;
    }

    ensureSpace(80);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12.5);
    setTextColor(doc, COLORS.text);
    doc.text(input.heading, marginX, y);

    doc.setDrawColor(COLORS.accent.r, COLORS.accent.g, COLORS.accent.b);
    doc.setLineWidth(1);
    doc.line(marginX, y + 10, marginX + 120, y + 10);
    y += 32;

    drawSubsection("Materials", input.materials);
    drawSubsection("Forma de pagament", input.payment);
    drawSubsection("Validesa del pressupost", input.validity);

    // Separació editorial abans del bloc legal numerat
    ensureSpace(20);
    doc.setDrawColor(COLORS.softLine.r, COLORS.softLine.g, COLORS.softLine.b);
    doc.setLineWidth(1);
    doc.line(marginX, y - 6, pageWidth - marginX, y - 6);
    y += 10;

    drawNumberedConditions("Condicions generals", input.generalConditions);
  }

  drawPageChrome("first");
  y = firstPageStartY;
  drawClientIntroBlock();
  drawTableHeader();

  for (const item of items) {
    drawItemRow(item);
  }

  drawTotalsBox(total);

  // Secció final: sempre comença en una pàgina nova.
  addPageBase("rest");
  y += 4;
  drawFinalTextSection({
    heading: "Condicions i informació addicional",
    materials:
      "Els materials utilitzats seran els especificats a cada partida i seran de qualitat professional.",
    payment:
      "40% del pressupost a l'inici de les feines i 60% a la finalització dels treballs.",
    validity:
      "Aquest pressupost no inclou l’IVA i té una validesa de 3 mesos des de la data d'emissió.",
    generalConditions: [
      "Els imports d’aquest pressupost s’han calculat segons les normes de medició d’ANSPI (Federació Nacional d’Empresaris de Pintura).",
      "Aquest pressupost inclou únicament les partides descrites. Les partides no previstes que apareguin durant l’execució es pressupostaran i facturaran a part.",
      "Els repassos o correccions que no siguin imputables al pintor aniran a càrrec del client.",
      "L’empresa respon dels danys imputables a la seva responsabilitat civil i es reserva el dret d’emprendre les accions pertinents si és perjudicada pel mateix concepte.",
    ],
  });

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i += 1) {
    doc.setPage(i);
    drawFooter(i, totalPages);
  }

  return doc.output("blob");
}
