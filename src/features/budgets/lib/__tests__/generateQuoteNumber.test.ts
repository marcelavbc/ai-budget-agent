import { describe, expect, it } from "vitest";
import { buildAutoQuoteNumber, deriveInitialsFromName } from "../generateQuoteNumber";

describe("deriveInitialsFromName", () => {
  it("retorna PRE sense nom", () => {
    expect(deriveInitialsFromName("")).toBe("PRE");
    expect(deriveInitialsFromName("   ")).toBe("PRE");
  });

  it("agafa fins a 3 paraules", () => {
    expect(deriveInitialsFromName("Maria Vila")).toBe("MV");
    expect(deriveInitialsFromName("Pintures Puig SL")).toBe("PPS");
  });

  it("ignora paraules sense lletres per a les inicials", () => {
    expect(deriveInitialsFromName("123 SL")).toBe("S");
  });
});

describe("buildAutoQuoteNumber", () => {
  it("combina inicials i data compacta", () => {
    expect(buildAutoQuoteNumber("Maria Vila", "2026-04-15")).toBe("MV-20260415");
  });

  it("usa PRE sense nom", () => {
    expect(buildAutoQuoteNumber("", "2026-01-01")).toBe("PRE-20260101");
  });
});
