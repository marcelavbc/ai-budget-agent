import { describe, expect, it } from "vitest";
import { parseJobDescription } from "../parseJobDescription";

describe("parseJobDescription", () => {
  it("detects area, color and wall condition in Catalan", () => {
    const result = parseJobDescription(
      "Pintar menjador de 20m2 en blanc, en bon estat",
    );

    expect(result).toEqual({
      jobType: "interior_painting",
      areaM2: 20,
      color: "blanc",
      wallCondition: "good",
    });
  });

  it("returns null for missing values", () => {
    const result = parseJobDescription("Pintar menjador");

    expect(result).toEqual({
      jobType: "interior_painting",
      areaM2: null,
      color: null,
      wallCondition: null,
    });
  });
});
