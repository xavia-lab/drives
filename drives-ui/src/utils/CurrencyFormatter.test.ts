// src/utils/CurrencyFormatter.test.ts
import { describe, it, expect } from "vitest";
import { CurrencyFormatter } from "./CurrencyFormatter";

describe("CurrencyFormatter Class", () => {
  const formatter = new CurrencyFormatter("en-US");

  it("should format a standard number with currency code", () => {
    const result = formatter.format(1234.56, "USD");
    expect(result).toBe("1,234.56 USD");
  });

  it("should format with a currency symbol when option is enabled", () => {
    const result = formatter.format(1234.56, "USD", { useSymbol: true });
    // Note: Use a regex or non-breaking space check if testing specific Intl outputs
    expect(result).toContain("$");
    expect(result).toContain("1,234.56");
  });

  it("should handle different locales (e.g., German)", () => {
    const deFormatter = new CurrencyFormatter("de-DE");
    const result = deFormatter.format(1234.56, "EUR");
    // German uses dot for thousands and comma for decimals
    expect(result).toContain("1.234,56");
  });

  it("should work via static helper method", () => {
    const result = CurrencyFormatter.quickFormat(50, "GBP");
    expect(result).toBe("50.00 GBP");
  });
});
