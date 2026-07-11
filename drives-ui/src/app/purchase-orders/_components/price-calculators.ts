// /app/purchase-orders/_components/price-calculators.ts
import Big from "big.js";

export enum PurchaseItemType {
  NEW = "NEW",
  USED = "USED",
  BULLION = "BULLION",
}

export interface PurchaseItemDetails {
  type: PurchaseItemType;
  pricePerGram: number;
  charge: number;
  quantity: number;
  quantityInGramsEquivalent: number;
  amount: number;
}

export const unitPriceCalculator = (item: PurchaseItemDetails): number => {
  // 1. Safety Check: If item is null/undefined, return 0
  if (!item) return 0;

  const type = item.type;
  const price = new Big(item.pricePerGram || 0);
  const charge = new Big(item.charge || 0);
  const amount = new Big(item.amount || 0);

  // Use 1 as default for multipliers to avoid unintended 0 results
  // but keep 0 if explicitly provided for the divisor check below
  const qty = new Big(item.quantity ?? 1);
  const gramsEq = new Big(item.quantityInGramsEquivalent ?? 1);

  switch (type) {
    case PurchaseItemType.NEW:
    case PurchaseItemType.BULLION:
      return price.times(gramsEq).plus(charge).toNumber();

    case PurchaseItemType.USED:
      const divisor = qty.times(gramsEq);
      // 2. Division by Zero Check: Big.js throws if we don't check this
      if (divisor.eq(0)) {
        //throw new Error("Division by zero in USED item calculation");
        return 0;
      }
      return amount.div(divisor).toNumber();

    default:
      return 0;
  }
};

export const totalPriceCalculator = (items: PurchaseItemDetails[]): number => {
  // 3. Safety Check: Ensure items is an array and filter out nulls
  if (!Array.isArray(items)) return 0;

  const total = items
    .filter(Boolean) // Remove null/undefined from array
    .reduce((sum: Big, line: PurchaseItemDetails) => {
      return sum.plus(
        new Big(unitPriceCalculator(line)).times(line.quantity || 0),
      );
    }, new Big(0));

  return total.toNumber();
};
