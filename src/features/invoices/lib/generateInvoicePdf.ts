import { jsPDF } from "jspdf";
import { formatEUR } from "@/shared/lib/formatCurrency";
import { hexToRgb, theme } from "@/shared/theme/colors";
import { localizeAddress } from "@/shared/lib/addressLocale";
import { pdfCompanyCopyCa } from "@/features/budgets/lib/pdfCopy.ca";

export interface GenerateInvoicePdfInput {
  invoice: {
    invoice_number: string | null;
    issue_date: string | null;
    due_date: string | null;
    pricing_mode: string;
    subtotal: number;
    tax_rate: number;
    tax_amount: number;
    total: number;
    job_address: string | null;
  };
  owner: {
    owner_name: string | null;
    owner_address: string | null;
    owner_postal_code: string | null;
    owner_city: string | null;
    owner_nif: string | null;
    bank_iban: string | null;
  };
  client: {
    name: string | null;
    tax_id: string | null;
    address_street: string | null;
    address_postal_code: string | null;
    address_city: string | null;
  };
  lines: Array<{
    description: string | null;
    subtotal: number | null;
  }>;
  lang?: "ca" | "es";
}

// ---------------------------------------------------------------------------
// Labels
// ---------------------------------------------------------------------------

const labelsCa = {
  documentTitle: "FACTURA",
  invoiceNumber: (n: string) => `Núm. ${n}`,
  issueDate: (d: string) => `Data d'emissió: ${d}`,
  dueDate: (d: string) => `Venciment: ${d}`,
  withIva: "AMB IVA",
  issuer: "",
  client: "CLIENT:",
  jobAddress: (a: string) => `Obra: ${a}`,
  table: { description: "DESCRIPCIÓ", amount: "IMPORT" },
  subtotal: "Subtotal",
  iva: (rate: number) => `IVA (${rate}%)`,
  total: "TOTAL",
  payment: (iban: string) => `Forma de pagament: Transferència a ${iban}`,
  page: (n: number, t: number) => `Pàgina ${n} / ${t}`,
  fallbackDescription: "Segons treball indicat.",
};

const labelsEs = {
  documentTitle: "FACTURA",
  invoiceNumber: (n: string) => `Núm. ${n}`,
  issueDate: (d: string) => `Fecha de emisión: ${d}`,
  dueDate: (d: string) => `Vencimiento: ${d}`,
  withIva: "CON IVA",
  issuer: "",
  client: "CLIENTE:",
  jobAddress: (a: string) => `Obra: ${a}`,
  table: { description: "DESCRIPCIÓN", amount: "IMPORTE" },
  subtotal: "Subtotal",
  iva: (rate: number) => `IVA (${rate}%)`,
  total: "TOTAL",
  payment: (iban: string) => `Forma de pago: Transferencia a ${iban}`,
  page: (n: number, t: number) => `Página ${n} / ${t}`,
  fallbackDescription: "Según trabajo indicado.",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
};

async function loadOptimizedImageAsDataUrl(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const MAX_WIDTH = 600;
      const scale =
        img.naturalWidth > MAX_WIDTH ? MAX_WIDTH / img.naturalWidth : 1;
      const w = Math.round(img.naturalWidth * scale);
      const h = Math.round(img.naturalHeight * scale);

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get 2D canvas context"));
        return;
      }

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);

      resolve(canvas.toDataURL("image/jpeg", 0.9));
    };

    img.onerror = () => reject(new Error("Failed to load image: " + src));
    img.src = src;
  });
}

function naturalSizeFromDataUrl(
  dataUrl: string
): Promise<{ w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => reject(new Error("Could not read logo"));
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

function formatDateDdMmYyyy(value: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!m) return value;
  const [, yyyy, mm, dd] = m;
  return `${dd}/${mm}/${yyyy}`;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function generateInvoicePdf(
  input: GenerateInvoicePdfInput
): Promise<Blob> {
  const { invoice, owner, client, lines, lang = "ca" } = input;
  const labels = lang === "es" ? labelsEs : labelsCa;

  const doc = new jsPDF({ unit: "pt", format: "a4", compress: true });
  const logoDataUrl = await loadOptimizedImageAsDataUrl("/logo-sanmarti.png");
  const logoNatural = await naturalSizeFromDataUrl(logoDataUrl);
  const { w: logoW, h: logoH } = fitLogoSize(
    logoNatural.w,
    logoNatural.h,
    300,
    110
  );

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const marginX = 48;
  const footerH = 54;
  const headerTop = 40;
  const contentBottomY = pageHeight - footerH - 18;

  const logoTopY = headerTop - 8;
  const headerSeparatorY = logoTopY + logoH + 16;
  const contentStartY = headerSeparatorY + 28;

  // Two-column table: description (wide) + amount (fixed)
  const amountColW = 90;
  const tableWidth = pageWidth - marginX * 2;
  const descColW = tableWidth - amountColW;

  let y = 0;

  // -------------------------------------------------------------------------
  // Page chrome helpers
  // -------------------------------------------------------------------------

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

  function drawHeader() {
    const right = pageWidth - marginX;

    // Logo
    doc.addImage(logoDataUrl, "PNG", marginX, logoTopY, logoW, logoH);

    // Title block (right of header, above separator)
    const titleX = right;
    let titleY = headerTop + 4;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    setTextColor(doc, COLORS.text);
    const titleW = doc.getTextWidth(labels.documentTitle);
    doc.text(labels.documentTitle, titleX - titleW, titleY);
    titleY += 18;

    const invoiceNum = safeTrim(invoice.invoice_number);
    if (invoiceNum) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      setTextColor(doc, COLORS.muted);
      const numLabel = labels.invoiceNumber(invoiceNum);
      const numW = doc.getTextWidth(numLabel);
      doc.text(numLabel, titleX - numW, titleY);
    }

    titleY += 14;
    if (invoice.issue_date) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      setTextColor(doc, COLORS.muted);
      const label = labels.issueDate(formatDateDdMmYyyy(invoice.issue_date));
      const w = doc.getTextWidth(label);
      doc.text(label, titleX - w, titleY);
      titleY += 13;
    }
    if (invoice.due_date) {
      const label = labels.dueDate(formatDateDdMmYyyy(invoice.due_date));
      const w = doc.getTextWidth(label);
      doc.text(label, titleX - w, titleY);
    }

    // Separator line
    doc.setDrawColor(COLORS.line.r, COLORS.line.g, COLORS.line.b);
    doc.setLineWidth(1);
    doc.line(marginX, headerSeparatorY, pageWidth - marginX, headerSeparatorY);
  }

  function addContinuedPage() {
    doc.addPage();
    // Minimal repeated header: just logo + separator
    doc.addImage(logoDataUrl, "PNG", marginX, logoTopY, logoW, logoH);
    doc.setDrawColor(COLORS.line.r, COLORS.line.g, COLORS.line.b);
    doc.setLineWidth(1);
    doc.line(marginX, headerSeparatorY, pageWidth - marginX, headerSeparatorY);
    y = contentStartY;
  }

  function ensureSpace(requiredHeight: number) {
    if (y + requiredHeight > contentBottomY) {
      addContinuedPage();
    }
  }

  // -------------------------------------------------------------------------
  // Section: Owner block (left column below header)
  // -------------------------------------------------------------------------

  function drawOwnerBlock(startY: number): number {
    let oy = startY;
    const ownerLines: string[] = [];

    const name = safeTrim(owner.owner_name);
    const address = safeTrim(owner.owner_address);
    const postalCity = [
      safeTrim(owner.owner_postal_code),
      safeTrim(owner.owner_city),
    ]
      .filter(Boolean)
      .join(" ");
    const nif = safeTrim(owner.owner_nif);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    setTextColor(doc, COLORS.muted);
    doc.text(labels.issuer, marginX, oy);
    oy += 14;

    if (name) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      setTextColor(doc, COLORS.text);
      doc.text(name, marginX, oy);
      oy += 14;
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    setTextColor(doc, COLORS.text);

    if (nif) {
      ownerLines.push(nif);
    }
    if (address) {
      ownerLines.push(address);
    }
    if (postalCity) {
      ownerLines.push(postalCity);
    }

    for (const line of ownerLines) {
      doc.text(line, marginX, oy);
      oy += 13;
    }

    return oy;
  }

  // -------------------------------------------------------------------------
  // Section: Client block
  // -------------------------------------------------------------------------

  function drawClientBlock(startY: number): number {
    const clientX = pageWidth / 2;
    const clientMaxW = pageWidth - marginX - clientX - 10;
    let cy = startY;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    setTextColor(doc, COLORS.muted);
    doc.text(labels.client, clientX, cy);
    cy += 14;

    const clientName = safeTrim(client.name);
    if (clientName) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      setTextColor(doc, COLORS.text);
      const clientNameLines = doc.splitTextToSize(
        clientName,
        clientMaxW
      ) as string[];
      for (const nameLine of clientNameLines) {
        doc.text(nameLine, clientX, cy);
        cy += 15;
      }
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    setTextColor(doc, COLORS.text);

    const taxId = safeTrim(client.tax_id);
    if (taxId) {
      const taxIdLines = doc.splitTextToSize(taxId, clientMaxW) as string[];
      for (const line of taxIdLines) {
        doc.text(line, clientX, cy);
        cy += 13;
      }
    }

    const street = safeTrim(client.address_street);
    if (street) {
      const localized = localizeAddress(street, lang);
      const streetLines = doc.splitTextToSize(
        localized,
        clientMaxW
      ) as string[];
      for (const line of streetLines) {
        doc.text(line, clientX, cy);
        cy += 13;
      }
    }

    const postalCity = [
      safeTrim(client.address_postal_code),
      safeTrim(client.address_city),
    ]
      .filter(Boolean)
      .join(" ");
    if (postalCity) {
      const postalCityLines = doc.splitTextToSize(
        postalCity,
        clientMaxW
      ) as string[];
      for (const line of postalCityLines) {
        doc.text(line, clientX, cy);
        cy += 13;
      }
    }

    const jobAddress = safeTrim(invoice.job_address);
    if (jobAddress) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      setTextColor(doc, COLORS.muted);
      const jobAddressLines = doc.splitTextToSize(
        labels.jobAddress(jobAddress),
        clientMaxW
      ) as string[];
      for (const line of jobAddressLines) {
        doc.text(line, clientX, cy);
        cy += 13;
      }
    }

    cy += 8;
    return cy;
  }

  // -------------------------------------------------------------------------
  // Section: Table
  // -------------------------------------------------------------------------

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
    doc.text(labels.table.description, marginX + pad, y + 16);
    doc.text(labels.table.amount, marginX + tableWidth - pad, y + 16, {
      align: "right",
    });

    y += rowH + 6;
  }

  function drawLineRow(line: {
    description: string | null;
    subtotal: number | null;
  }) {
    const padding = 10;
    const descX = marginX + padding;
    const amountX = marginX + tableWidth - padding;

    const description =
      safeTrim(line.description) || labels.fallbackDescription;
    const amount = line.subtotal != null ? formatEUR(line.subtotal) : "";

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    const descLines = doc.splitTextToSize(
      description,
      descColW - padding * 2
    ) as string[];

    const lineH = 13;
    const topPad = 14;

    let remainingDesc = [...descLines];
    let firstChunk = true;

    while (remainingDesc.length > 0) {
      ensureSpace(34 + 2);

      const available = contentBottomY - y;
      const maxDescLines = Math.max(
        1,
        Math.floor((available - topPad - 8) / lineH)
      );
      const descChunk = remainingDesc.slice(0, maxDescLines);
      remainingDesc = remainingDesc.slice(maxDescLines);

      const descH = descChunk.length * lineH;
      const rowH = Math.max(28, descH + topPad);

      if (y + rowH > contentBottomY) {
        addContinuedPage();
        continue;
      }

      doc.setDrawColor(COLORS.softLine.r, COLORS.softLine.g, COLORS.softLine.b);
      doc.line(marginX, y + rowH, marginX + tableWidth, y + rowH);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      setTextColor(doc, COLORS.text);

      const verticalOffset =
        (rowH - descChunk.length * lineH) / 2 + lineH * 0.7;
      let descY = y + verticalOffset;
      for (const dl of descChunk) {
        doc.text(dl, descX, descY);
        descY += lineH;
      }

      if (firstChunk && amount) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        setTextColor(doc, COLORS.text);
        doc.text(amount, amountX, y + verticalOffset, { align: "right" });
      }

      y += rowH;
      firstChunk = false;
    }
  }

  // -------------------------------------------------------------------------
  // Section: Totals
  // -------------------------------------------------------------------------

  function drawTotalsBlock() {
    const rowH = 18;
    const pad = 10;
    const labelX = marginX + tableWidth - 120 - pad;
    const valueX = marginX + tableWidth - pad;
    const withIva = invoice.pricing_mode === "with_iva";

    const rows: Array<{
      label: string;
      value: string;
      bold?: boolean;
      accent?: boolean;
    }> = [];

    if (withIva) {
      rows.push({ label: labels.subtotal, value: formatEUR(invoice.subtotal) });
      rows.push({
        label: labels.iva(invoice.tax_rate),
        value: formatEUR(invoice.tax_amount),
      });
    }
    rows.push({
      label: labels.total,
      value: formatEUR(invoice.total),
      bold: true,
      accent: true,
    });

    const totalH = rows.length * rowH + 16;
    ensureSpace(totalH);

    y += 12;

    for (const row of rows) {
      doc.setFont("helvetica", row.bold ? "bold" : "normal");
      doc.setFontSize(row.bold ? 11 : 10);

      if (row.accent) {
        setTextColor(doc, COLORS.accent);
      } else {
        setTextColor(doc, COLORS.muted);
      }

      doc.text(row.label, labelX, y);

      if (row.bold) {
        setTextColor(doc, COLORS.accent);
      } else {
        setTextColor(doc, COLORS.text);
      }

      doc.text(row.value, valueX, y, { align: "right" });
      y += rowH;
    }

    y += 8;
  }

  // -------------------------------------------------------------------------
  // Compose the document
  // -------------------------------------------------------------------------

  // First page chrome
  drawHeader();
  y = contentStartY;

  const ownerEndY = drawOwnerBlock(y);
  const clientEndY = drawClientBlock(y);
  y = Math.max(ownerEndY, clientEndY) + 16;

  // Table
  drawTableHeader();
  for (const line of lines) {
    drawLineRow(line);
  }

  // Totals
  drawTotalsBlock();

  // Payment — anchored near the bottom of page 1, just above the footer line
  const paymentY = pageHeight - footerH - 36;
  if (owner.bank_iban) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    setTextColor(doc, COLORS.text);
    doc.setPage(1);
    doc.text(labels.payment(owner.bank_iban), marginX, paymentY);
  }

  // Render footers on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i += 1) {
    doc.setPage(i);
    drawFooter(i, totalPages);
  }

  return doc.output("blob");
}

// ---------------------------------------------------------------------------
// Filename helper
// ---------------------------------------------------------------------------

export function buildInvoicePdfFilename(
  invoiceNumber: string | null,
  clientName: string | null,
  lang: "ca" | "es"
): string {
  const slug = (v: string) =>
    v
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40);
  const prefix = lang === "es" ? "Factura" : "Factura";
  const num = slug(invoiceNumber ?? "");
  const name = slug(clientName ?? "");
  if (num && name) return `${prefix}-${num}-${name}.pdf`;
  if (num) return `${prefix}-${num}.pdf`;
  return `${prefix}.pdf`;
}
