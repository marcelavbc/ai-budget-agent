import { describe, expect, it } from "vitest";
import { localizeAddress } from "@/shared/lib/addressLocale";

describe("localizeAddress", () => {
  it("translates Spanish street type to Catalan", () => {
    expect(localizeAddress("Calle Major 5", "ca")).toBe("Carrer Major 5");
    expect(localizeAddress("Paseo de Gràcia 10", "ca")).toBe(
      "Passeig de Gràcia 10"
    );
    expect(localizeAddress("Avenida Diagonal 42", "ca")).toBe(
      "Avinguda Diagonal 42"
    );
    expect(localizeAddress("Plaza Catalunya 1", "ca")).toBe(
      "Plaça Catalunya 1"
    );
  });

  it("translates Catalan street type to Spanish", () => {
    expect(localizeAddress("Carrer Major 5", "es")).toBe("Calle Major 5");
    expect(localizeAddress("Passeig de Gràcia 10", "es")).toBe(
      "Paseo de Gràcia 10"
    );
    expect(localizeAddress("Avinguda Diagonal 42", "es")).toBe(
      "Avenida Diagonal 42"
    );
    expect(localizeAddress("Plaça Catalunya 1", "es")).toBe(
      "Plaza Catalunya 1"
    );
  });

  it("preserves capitalisation style", () => {
    expect(localizeAddress("calle major 5", "ca")).toBe("carrer major 5");
    expect(localizeAddress("CALLE MAJOR 5", "ca")).toBe("CARRER MAJOR 5");
  });

  it("handles multi-line addresses", () => {
    const input = "Calle Major 5\n08001 Barcelona";
    expect(localizeAddress(input, "ca")).toBe("Carrer Major 5\n08001 Barcelona");
  });

  it("leaves unknown street types unchanged", () => {
    expect(localizeAddress("Via Laietana 10", "ca")).toBe("Via Laietana 10");
    expect(localizeAddress("Ronda Sant Pere 3", "ca")).toBe(
      "Ronda Sant Pere 3"
    );
  });

  it("does not double-translate already-correct forms", () => {
    expect(localizeAddress("Carrer Major 5", "ca")).toBe("Carrer Major 5");
    expect(localizeAddress("Calle Major 5", "es")).toBe("Calle Major 5");
  });
});
