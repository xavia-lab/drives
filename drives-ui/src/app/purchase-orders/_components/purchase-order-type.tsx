import { EnumTag } from "@components/enum-tag";

export const PURCHASE_ORDER_TYPE_OPTIONS = [
  { label: "New", value: "NEW" },
  { label: "Used", value: "USED" },
  { label: "Bullion", value: "BULLION" },
];

export const purchaseTypeColorMap = {
  NEW: "volcano",
  USED: "magenta",
  BULLION: "gold",
};

export const PurchaseOrderType = ({ value }: { value: string }) => (
  <EnumTag
    value={value}
    options={PURCHASE_ORDER_TYPE_OPTIONS}
    colorMap={purchaseTypeColorMap}
    tooltipPrefix="Order Type"
  />
);
