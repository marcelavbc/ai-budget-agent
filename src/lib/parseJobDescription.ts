import type { ParsedJob, WallCondition } from "@/types/budget";

function detectWallCondition(description: string): WallCondition | null {
  const text = description.toLowerCase();

  // GOOD
  if (
    text.includes("bon estat") ||
    text.includes("en bon estat") ||
    text.includes("good state") ||
    text.includes("good condition") ||
    text.includes("buen estado")
  ) {
    return "good";
  }

  // MEDIUM
  if (
    text.includes("estat mitjà") ||
    text.includes("estat mig") ||
    text.includes("medium state") ||
    text.includes("medium condition") ||
    text.includes("estado medio")
  ) {
    return "medium";
  }

  // BAD
  if (
    text.includes("mal estat") ||
    text.includes("en mal estat") ||
    text.includes("bad state") ||
    text.includes("bad condition") ||
    text.includes("muy mal estado")
  ) {
    return "bad";
  }

  return null;
}

function detectColor(description: string): string | null {
  const text = description.toLowerCase();

  const knownColors = [
    // Catalán
    "blanc",
    "blanca",
    "blau",
    "grís",
    "gris",
    "verd",
    "beix",

    // Español
    "blanco",
    "azul",
    "verde",

    // Inglés (por si acaso)
    "white",
    "blue",
    "green",
    "gray",
    "grey",
    "beige",
  ];

  const matchedColor = knownColors.find((color) => text.includes(color));

  return matchedColor ?? null;
}

function detectAreaM2(description: string): number | null {
  const text = description
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const match = text.match(/(\d+)\s?(m2|m²|metres quadrats|metros cuadrados)/i);

  if (!match) return null;

  return Number(match[1]);
}

export function parseJobDescription(description: string): ParsedJob {
  return {
    jobType: "interior_painting",
    areaM2: detectAreaM2(description),
    color: detectColor(description),
    wallCondition: detectWallCondition(description),
  };
}
