import { Tag, Tooltip } from "antd";

// Export options for use in FilterDropdown or Select components
export const ALLOCATION_STATUS_OPTIONS = [
  { label: "Pending", value: "PENDING" },
  { label: "Partially Allocated", value: "PARTIALLY_ALLOCATED" },
  { label: "Fully Allocated", value: "FULLY_ALLOCATED" },
  { label: "Over Allocated", value: "OVER_ALLOCATED" },
  { label: "Cancelled", value: "CANCELLED" },
  { label: "Completed", value: "COMPLETED" },
];

const statusColorMap: Record<string, string> = {
  PENDING: "default",
  PARTIALLY_ALLOCATED: "blue",
  FULLY_ALLOCATED: "success",
  OVER_ALLOCATED: "error",
  CANCELLED: "warning",
  COMPLETED: "success",
};

export const AllocationStatus = ({ value }: { value: string }) => {
  const status = ALLOCATION_STATUS_OPTIONS.find((item) => item.value === value);
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
