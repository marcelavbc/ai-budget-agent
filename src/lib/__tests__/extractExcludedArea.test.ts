import { describe, it, expect } from "vitest";
import { extractExcludedArea } from "../extractExcludedArea";

describe("extractExcludedArea", () => {
  it("returns 0 when only one area is present", () => {
    const result = extractExcludedArea("Pintar pis de 80m2");
    expect(result).toBe(0);
  });

  it("extracts excluded area when multiple m2 are present", () => {
    const result = extractExcludedArea(
      "Pintar pis de 80m2 menys cuina de 15m2"
    );

    expect(result).toBe(15);
  });

  it("handles multiple exclusions", () => {
    const result = extractExcludedArea(
      "Pis de 80m2 menys cuina 15m2 i bany 5m2"
    );

    expect(result).toBe(20);
  });
});