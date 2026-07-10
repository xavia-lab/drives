import { describe, it, expect } from "vitest";
import {
  unitPriceCalculator,
  totalPriceCalculator,
  PurchaseItemType,
  PurchaseItemDetails,
} from "./price-calculators";

describe("Financial Calculators Suite", () => {
  describe("unitPriceCalculator Edge Cases", () => {
    it("should handle floating point precision correctly using big.js", () => {
      // 0.1 + 0.2 in JS is 0.30000000000000004
      const item: Partial<PurchaseItemDetails> = {
        type: PurchaseItemType.NEW,
        pricePerGram: 0.1,
        quantityInGramsEquivalent: 1,
        charge: 0.2,
      };
      expect(unitPriceCalculator(item as any)).toBe(0.3);
    });

    it("should handle division by zero for USED items", () => {
      const faultyItem = {
        type: PurchaseItemType.USED,
        amount: 1000,
        quantity: 0, // This will result in divisor 0
        quantityInGramsEquivalent: 5,
      };

      // This will now correctly catch the Error thrown in our switch statement
      expect(unitPriceCalculator(faultyItem as any)).toBe(0.0);
    });

    it("should handle very large numbers (billionaire scenarios)", () => {
      const largeItem: Partial<PurchaseItemDetails> = {
        type: PurchaseItemType.NEW,
        pricePerGram: 1_000_000,
        quantityInGramsEquivalent: 1_000,
        charge: 500_000,
      };
      // (1,000,000 * 1,000) + 500,000 = 1,000,500,000
      expect(unitPriceCalculator(largeItem as any)).toBe(1000500000);
    });

    it("should use default value 1 for quantityInGramsEquivalent if provided as 0 or undefined", () => {
      const item: Partial<PurchaseItemDetails> = {
        type: PurchaseItemType.NEW,
        pricePerGram: 100,
        charge: 10,
        quantityInGramsEquivalent: undefined, // Should default to 1
      };
      // (100 * 1) + 10 = 110
      expect(unitPriceCalculator(item as any)).toBe(110);
    });
  });

  describe("totalPriceCalculator Scenarios", () => {
    it("should correctly sum a mix of NEW, BULLION, and USED items", () => {
      const items: Partial<PurchaseItemDetails>[] = [
        {
          type: PurchaseItemType.NEW, // (10 * 1) + 5 = 15. Total: 15 * 2 = 30
          pricePerGram: 10,
          charge: 5,
          quantityInGramsEquivalent: 1,
          quantity: 2,
        },
        {
          type: PurchaseItemType.USED, // 100 / (1 * 2) = 50. Total: 50 * 1 = 50
          amount: 100,
          quantity: 1,
          quantityInGramsEquivalent: 2,
        },
      ];
      // 30 + 50 = 80
      expect(totalPriceCalculator(items as any)).toBe(80);
    });

    it("should return 0 for invalid or empty items list", () => {
      expect(totalPriceCalculator([])).toBe(0);
      // This will no longer crash because of the .filter(Boolean) and Array.isArray checks
      expect(totalPriceCalculator(null as any)).toBe(0);
      expect(totalPriceCalculator([null as any])).toBe(0);
    });

    it("should not accumulate floating point errors over many items", () => {
      // Adding 0.1 ten times should be exactly 1.0
      const items: Partial<PurchaseItemDetails>[] = Array(10).fill({
        type: PurchaseItemType.NEW,
        pricePerGram: 0.1,
        quantityInGramsEquivalent: 1,
        charge: 0,
        quantity: 1,
      });
      expect(totalPriceCalculator(items as any)).toBe(1.0);
    });
  });

  describe("Validation & Types", () => {
    it("should gracefully return 0 for unsupported item types", () => {
      const invalidItem = { type: "UNKNOWN" };
      expect(unitPriceCalculator(invalidItem as any)).toBe(0);
    });
  });
});
