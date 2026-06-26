import { describe, expect, it } from "vitest";
import { formatEstimatedTimeForPdf } from "./formatEstimatedTime";

describe("formatEstimatedTimeForPdf", () => {
  it('returns "" for empty string', () => {
    expect(formatEstimatedTimeForPdf("", "ca")).toBe("");
  });

  it('returns "" for whitespace-only string', () => {
    expect(formatEstimatedTimeForPdf("  ", "ca")).toBe("");
  });

  it('formats "8" in Catalan', () => {
    expect(formatEstimatedTimeForPdf("8", "ca")).toBe("8 dies hàbils");
  });

  it('formats "1" in Catalan as singular', () => {
    expect(formatEstimatedTimeForPdf("1", "ca")).toBe("1 dia hàbil");
  });

  it('formats "1-3" in Catalan', () => {
    expect(formatEstimatedTimeForPdf("1-3", "ca")).toBe("1-3 dies hàbils");
  });

  it('formats "8" in Spanish', () => {
    expect(formatEstimatedTimeForPdf("8", "es")).toBe("8 días hábiles");
  });

  it('formats "1" in Spanish as singular', () => {
    expect(formatEstimatedTimeForPdf("1", "es")).toBe("1 día hábil");
  });

  it('trims trailing space before formatting "10 "', () => {
    expect(formatEstimatedTimeForPdf("10 ", "ca")).toBe("10 dies hàbils");
  });
});
