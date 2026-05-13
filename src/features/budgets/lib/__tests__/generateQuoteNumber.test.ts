import { describe, expect, it } from "vitest";
import { buildAutoQuoteNumber, deriveInitialsFromName } from "../generateQuoteNumber";

describe("deriveInitialsFromName", () => {
  it("returns PRE for blank or whitespace-only name", () => {
    expect(deriveInitialsFromName("")).toBe("PRE");
    expect(deriveInitialsFromName("   ")).toBe("PRE");
  });

  it("uses up to three words for initials", () => {
    expect(deriveInitialsFromName("Maria Vila")).toBe("MV");
    expect(deriveInitialsFromName("Pintures Puig SL")).toBe("PPS");
  });

  it("skips words with no letters when deriving initials", () => {
    expect(deriveInitialsFromName("123 SL")).toBe("S");
  });
});

describe("buildAutoQuoteNumber", () => {
  it("combines initials and compact date", () => {
    expect(buildAutoQuoteNumber("Maria Vila", "2026-04-15")).toBe("MV-20260415");
  });

  it("builds quote number with PRE when client name is empty", () => {
    expect(buildAutoQuoteNumber("", "2026-01-01")).toBe("PRE-20260101");
  });
});
