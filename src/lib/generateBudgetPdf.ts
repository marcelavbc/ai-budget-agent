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
  const tableCols = {
    partida: 165,
    detail: 260,
    amount: 82,
  };
  const tableWidth = tableCols.partida + tableCols.detail + tableCols.amount;

  let y = 0;

  function addPageBase() {
    doc.addPage();
    drawPageChrome();
    y = 196;
  }

  function ensureSpace(requiredHeight: number) {
    if (y + requiredHeight > contentBottomY) {
      addPageBase();
    }
  }

  function drawPageChrome() {
    drawHeader();
  }

  function drawHeader() {
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

    doc.setFont("helvetica", "bold");
    doc.setFontSize(17);
    setTextColor(doc, COLORS.text);
    doc.text("PRESSUPOST DE PINTURA", marginX, top + 86);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    setTextColor(doc, COLORS.muted);
    doc.text(buildIntroText(client), marginX, top + 106);
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
      doc.text(`Data: ${date}`, marginX, y);
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

    doc.text("PARTIDA", marginX + 10, y + 16);
    doc.text("DETALL", marginX + tableCols.partida + 10, y + 16);
    doc.text("IMPORT", marginX + tableWidth - 10, y + 16, { align: "right" });

    y += rowH + 6;
  }

  function drawItemRow(item: BudgetClientItem) {
    const padding = 10;
    const partidaX = marginX + padding;
    const detailX = marginX + tableCols.partida + padding;
    const amountX = marginX + tableWidth - padding;

    const title = item.title?.trim() || "Partida";
    const detail = item.description?.trim() || "Segons treball indicat.";
    const amount = formatEUR(item.total);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    const partidaLines = doc.splitTextToSize(
      title,
      tableCols.partida - padding * 2
    ) as string[];

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    const detailLines = doc.splitTextToSize(
      detail,
      tableCols.detail - padding * 2
    ) as string[];

    const lineH = 13;
    const textLines = Math.max(partidaLines.length, detailLines.length);
    const rowH = Math.max(34, textLines * lineH + 14);

    ensureSpace(rowH + 2);

    doc.setDrawColor(COLORS.softLine.r, COLORS.softLine.g, COLORS.softLine.b);
    doc.line(marginX, y + rowH, marginX + tableWidth, y + rowH);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    setTextColor(doc, COLORS.text);

    let partidaY = y + 14;
    for (const line of partidaLines) {
      doc.text(line, partidaX, partidaY);
      partidaY += lineH;
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    setTextColor(doc, COLORS.text);

    let detailY = y + 14;
    for (const line of detailLines) {
      doc.text(line, detailX, detailY);
      detailY += lineH;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(amount, amountX, y + 14, { align: "right" });

    y += rowH;
  }

  function drawTotalsBox(subtotal: number) {
    const iva = subtotal * 0.21;
    const grand = subtotal + iva;

    const boxW = 220;
    const boxX = pageWidth - marginX - boxW;
    const boxY = y + 8;
    const boxH = 88;

    ensureSpace(boxH + 20);

    doc.setFillColor(
      COLORS.accentSoft.r,
      COLORS.accentSoft.g,
      COLORS.accentSoft.b
    );
    doc.setDrawColor(COLORS.softLine.r, COLORS.softLine.g, COLORS.softLine.b);
    doc.roundedRect(boxX, boxY, boxW, boxH, 8, 8, "FD");

    const left = boxX + 14;
    const right = boxX + boxW - 14;
    let ty = boxY + 24;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    setTextColor(doc, COLORS.muted);
    doc.text("Subtotal", left, ty);
    setTextColor(doc, COLORS.text);
    doc.text(formatEUR(subtotal), right, ty, { align: "right" });

    ty += 18;
    setTextColor(doc, COLORS.muted);
    doc.text("IVA (21%)", left, ty);
    setTextColor(doc, COLORS.text);
    doc.text(formatEUR(iva), right, ty, { align: "right" });

    ty += 24;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    setTextColor(doc, COLORS.text);
    doc.text("Total", left, ty);
    doc.text(formatEUR(grand), right, ty, { align: "right" });

    y = boxY + boxH + 26;
  }

  function drawNoteBlock(title: string, text: string) {
    const width = pageWidth - marginX * 2;
    const paddingX = 14;
    const paddingTop = 14;
    const titleToBodyGap = 10;
    const bodyLineH = 13.2;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.6);
    const lines = doc.splitTextToSize(text, width - paddingX * 2) as string[];

    const bodyH = lines.length * bodyLineH;
    const blockH = paddingTop + 12 + titleToBodyGap + bodyH + 14;

    ensureSpace(blockH + 10);

    doc.setDrawColor(COLORS.softLine.r, COLORS.softLine.g, COLORS.softLine.b);
    doc.setFillColor(COLORS.softFill.r, COLORS.softFill.g, COLORS.softFill.b);
    doc.roundedRect(marginX, y, width, blockH, 8, 8, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    setTextColor(doc, COLORS.text);
    doc.text(title, marginX + paddingX, y + paddingTop + 10);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.6);
    setTextColor(doc, COLORS.muted);

    let ty = y + paddingTop + 10 + titleToBodyGap + 8;
    for (const line of lines) {
      doc.text(line, marginX + paddingX, ty);
      ty += bodyLineH;
    }

    y += blockH + 14;
  }

  function drawConditionsGeneralsBlock(conditions: string[]) {
    const width = pageWidth - marginX * 2;
    const paddingX = 14;
    const paddingTop = 14;
    const numberColW = 16;
    const textW = width - paddingX * 2 - numberColW;
    const lineH = 12.6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.2);

    const wrappedByCondition = conditions.map((c) =>
      (doc.splitTextToSize(c, textW) as string[]).filter((l) => l.trim().length)
    );

    const linesCount =
      wrappedByCondition.reduce((sum, lines) => sum + lines.length, 0) +
      Math.max(0, conditions.length - 1); // extra gaps between items

    const bodyH = linesCount * lineH;
    const blockH = paddingTop + 12 + 10 + bodyH + 14;

    ensureSpace(blockH + 10);

    doc.setDrawColor(COLORS.softLine.r, COLORS.softLine.g, COLORS.softLine.b);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(marginX, y, width, blockH, 8, 8, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    setTextColor(doc, COLORS.text);
    doc.text("Condicions generals", marginX + paddingX, y + paddingTop + 10);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.2);
    setTextColor(doc, COLORS.muted);

    let ty = y + paddingTop + 10 + 18;
    for (let i = 0; i < wrappedByCondition.length; i += 1) {
      const n = `${i + 1}.`;
      doc.setFont("helvetica", "bold");
      setTextColor(doc, COLORS.muted);
      doc.text(n, marginX + paddingX, ty);

      doc.setFont("helvetica", "normal");
      setTextColor(doc, COLORS.muted);
      const lines = wrappedByCondition[i];
      let innerY = ty;
      for (const line of lines) {
        doc.text(line, marginX + paddingX + numberColW, innerY);
        innerY += lineH;
      }
      ty = innerY + lineH * 0.6;
    }

    y += blockH + 14;
  }

  drawPageChrome();
  y = firstPageStartY;
  drawClientIntroBlock();
  drawTableHeader();

  for (const item of items) {
    drawItemRow(item);
  }

  drawTotalsBox(total);

  y += 10;
  drawSectionTitleWide("Informació addicional");

  drawNoteBlock(
    "Materials",
    "Els materials utilitzats seran els especificats a cada partida i seran de qualitat professional."
  );

  drawNoteBlock(
    "Forma de pagament",
    "40% del pressupost a l'inici de les feines i 60% a la finalització dels treballs."
  );

  drawNoteBlock(
    "Validesa del pressupost",
    "Aquest pressupost té una validesa de 3 mesos des de la data d'emissió."
  );

  drawConditionsGeneralsBlock([
    "Els imports d’aquest pressupost s’han calculat segons les normes de medició d’ANSPI (Federació Nacional d’Empresaris de Pintura).",
    "Aquest pressupost inclou únicament les partides descrites. Les partides no previstes que apareguin durant l’execució es pressupostaran i facturaran a part.",
    "Els repassos o correccions que no siguin imputables al pintor aniran a càrrec del client.",
    "L’empresa respon dels danys imputables a la seva responsabilitat civil i es reserva el dret d’emprendre les accions pertinents si és perjudicada pel mateix concepte.",
  ]);

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i += 1) {
    doc.setPage(i);
    drawFooter(i, totalPages);
  }

  return doc.output("blob");
}
