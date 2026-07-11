import { Tag, Tooltip } from "antd";

export const PRODUCT_STATUS_OPTIONS = [
  { label: "Allocated", value: "ALLOCATED" },
  { label: "In Stock", value: "IN_STOCK" },
  { label: "On Display", value: "ON_DISPLAY" },
  { label: "Sold", value: "SOLD" },
  { label: "Returned", value: "RETURNED" },
  { label: "Missing", value: "MISSING" },
  { label: "Recycled", value: "RECYCLED" },
  { label: "Quarantine", value: "QUARANTINE" },
  { label: "Reserved", value: "RESERVED" },
  { label: "Transferred", value: "TRANSFERRED" },
  { label: "Damaged", value: "DAMAGED" },
  { label: "Repaired", value: "REPAIRED" },
  { label: "Discontinued", value: "DISCONTINUED" },
  { label: "Verified", value: "VERIFIED" },
  { label: "Adjusted", value: "ADJUSTED" },
  { label: "In Transit", value: "IN_TRANSIT" },
];

const statusColorMap: Record<string, string> = {
  ALLOCATED: "blue",
  IN_STOCK: "cyan",
  ON_DISPLAY: "purple",
  SOLD: "success",
  RETURNED: "orange",
  MISSING: "error",
  RECYCLED: "green",
  QUARANTINE: "warning",
  RESERVED: "gold",
  TRANSFERRED: "geekblue",
  DAMAGED: "volcano",
  REPAIRED: "lime",
  DISCONTINUED: "default",
  VERIFIED: "magenta",
  ADJUSTED: "processing",
  IN_TRANSIT: "processing",
};

export const ProductStatus = ({ value }: { value: string }) => {
  const status = PRODUCT_STATUS_OPTIONS.find((item) => item.value === value);
  const label = status ? status.label : value;
  const color = statusColorMap[value] || "default";

  return (
    <Tooltip title={`Status: ${label}`}>
      <Tag color={color} style={{ cursor: "pointer" }}>
        {label}
      </Tag>
    </Tooltip>
  );
};
