import type {
  BudgetClientDetails,
  BudgetClientItem,
} from "@/features/budgets/types/budget";

export const pdfCompanyCopyCa = {
  brand: "SANMARTÍ",
  subtitle: "Pintura decorativa",
  phone: "616 287 601",
};

export const pdfLabelsCa = {
  quoteNumber: (quoteNumber: string) => `Pressupost núm. ${quoteNumber}`,
  documentTitle: "PRESSUPOST DE PINTURA",
  client: "Client",
  date: (formattedDdMmYyyy: string) => `Data: ${formattedDdMmYyyy}`,
  estimatedDurationLabel: "Durada estimada dels treballs",
  table: {
    concept: "CONCEPTE",
    measure: "MESURA",
    description: "DESCRIPCIÓ",
    amount: "IMPORT",
  },
  fallbackConcept: "Concepte",
  fallbackDescription: "Segons treball indicat.",
  total: "Total",
  defaultOptionLabel: "Opció",
  optionGroupHint: "Opcions (escollir-ne una)",
  page: (pageNumber: number, totalPages: number) =>
    `Pàgina ${pageNumber} / ${totalPages}`,
  finalSection: {
    heading: "Condicions del pressupost",
    materialsLabel: "Materials",
    paymentLabel: "Forma de pagament",
    validityLabel: "Validesa del pressupost",
    generalConditionsLabel: "Condicions generals",
  },
};

export function formatUnitCa(unit: string, quantityAsString: string): string {
  if (unit === "unitat") {
    return quantityAsString === "1" ? "unitat" : "unitats";
  }
  if (unit === "partida") {
    return quantityAsString === "1" ? "partida" : "partides";
  }
  return unit;
}

export function buildIntroTextCa(client: BudgetClientDetails): string {
  const address = (client.address ?? "").trim();
  if (address) {
    const singleLineAddress = address.replace(/\n+/g, ", ");
    return `Treballs de pintura a realitzar a ${singleLineAddress}.`;
  }

  return "Treballs de pintura detallats segons les partides indicades en aquest pressupost.";
}

export function buildInterventionSummaryCa(items: BudgetClientItem[]): string {
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

export const pdfFinalSectionCopyCa = {
  materials:
    "Els materials utilitzats seran els especificats a cada partida i seran de qualitat professional.",
  paymentTitle: "Forma de pagament",
  payment: [
    "40% del pressupost a l'inici de les feines",
    "60% a la finalització dels treballs",
  ],
  validity:
    "Aquest pressupost no inclou l’IVA i té una validesa de 3 mesos des de la data d'emissió.",
  generalConditions: [
    "Els imports d’aquest pressupost s’han calculat segons les normes de medició d’ANSPI (Federació Nacional d’Empresaris de Pintura).",
    "Aquest pressupost inclou únicament les partides descrites. Les partides no previstes que puguin sorgir durant l’execució es pressupostaran i facturaran a part.",
    "Els repassos o correccions que no siguin imputables al pintor aniran a càrrec del client.",
    "L’empresa respon dels danys imputables a la seva responsabilitat civil i es reserva el dret d’emprendre les accions pertinents en cas de perjudici per aquest concepte.",
  ],
};
