import { describe, it, expect } from "vitest";
import { calculatePaintableSurface } from "../calculatePaintableSurface";

describe("calculatePaintableSurface", () => {
  it("multiplies area by 3", () => {
    expect(calculatePaintableSurface(20)).toBe(60);
  });
});