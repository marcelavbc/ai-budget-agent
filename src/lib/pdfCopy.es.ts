import type { BudgetClientDetails, BudgetClientItem } from "@/types/budget";

export const pdfLabelsEs = {
  quoteNumber: (quoteNumber: string) => `Presupuesto núm. ${quoteNumber}`,
  documentTitle: "PRESUPUESTO DE PINTURA",
  client: "Cliente",
  date: (formattedDdMmYyyy: string) => `Fecha: ${formattedDdMmYyyy}`,
  estimatedDurationLabel: "Duración estimada del trabajo",
  table: {
    concept: "CONCEPTO",
    measure: "MEDIDA",
    description: "DESCRIPCIÓN",
    amount: "IMPORTE",
  },
  fallbackConcept: "Concepto",
  fallbackDescription: "Según el trabajo indicado.",
  total: "Total",
  defaultOptionLabel: "Opción",
  optionGroupHint: "Opciones (elegir una)",
  page: (pageNumber: number, totalPages: number) =>
    `Página ${pageNumber} / ${totalPages}`,
  finalSection: {
    heading: "Condiciones del presupuesto",
    materialsLabel: "Materiales",
    paymentLabel: "Forma de pago",
    validityLabel: "Validez del presupuesto",
    generalConditionsLabel: "Condiciones generales",
  },
};

export function buildIntroTextEs(client: BudgetClientDetails): string {
  const address = (client.address ?? "").trim();
  if (address) {
    const singleLineAddress = address.replace(/\n+/g, ", ");
    return `Trabajos de pintura a realizar en ${singleLineAddress}.`;
  }

  return "Trabajos de pintura detallados según las partidas indicadas en este presupuesto.";
}

export function buildInterventionSummaryEs(items: BudgetClientItem[]): string {
  const nonEmptyTitles = items
    .map((item) => item.title?.trim())
    .filter((value): value is string => Boolean(value));

  if (nonEmptyTitles.length === 0) {
    return "Se incluye la preparación de superficies, la protección de los elementos susceptibles de mancharse y el acabado final según las partidas indicadas.";
  }

  const uniqueTitles = Array.from(new Set(nonEmptyTitles)).slice(0, 3);

  if (uniqueTitles.length === 1) {
    return `Intervención prevista sobre ${uniqueTitles[0].toLowerCase()}, con preparación de superficies y acabado final según necesidad.`;
  }

  if (uniqueTitles.length === 2) {
    return `Intervención prevista sobre ${uniqueTitles[0].toLowerCase()} y ${uniqueTitles[1].toLowerCase()}, con preparación de superficies y acabado final según necesidad.`;
  }

  return `Intervención prevista sobre ${uniqueTitles[0].toLowerCase()}, ${uniqueTitles[1].toLowerCase()} y otros elementos indicados en el detalle de partidas.`;
}

export const pdfFinalSectionCopyEs = {
  materials:
    "Los materiales utilizados serán los especificados en cada partida y serán de calidad profesional.",
  payment:
    "40% del presupuesto al inicio de los trabajos y 60% a la finalización de los mismos.",
  validity:
    "Este presupuesto no incluye el IVA y tiene una validez de 3 meses desde la fecha de emisión.",
  generalConditions: [
    "Los importes de este presupuesto se han calculado según las normas de medición de ANSPI (Federación Nacional de Empresarios de Pintura).",
    "Este presupuesto incluye únicamente las partidas descritas. Las partidas no previstas que aparezcan durante la ejecución se presupuestarán y facturarán aparte.",
    "Los repasos o correcciones que no sean imputables al pintor correrán a cargo del cliente.",
    "La empresa responde de los daños imputables a su responsabilidad civil y se reserva el derecho de emprender las acciones pertinentes si se viera perjudicada por el mismo concepto.",
  ],
};

