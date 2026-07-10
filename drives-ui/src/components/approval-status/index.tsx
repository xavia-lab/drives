import { EnumTag } from "@components/enum-tag";

export const APPROVAL_STATUS_OPTIONS = [
  { label: "Draft", value: "DRAFT" },
  { label: "Submitted", value: "SUBMITTED" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Cancelled", value: "CANCELLED" },
];

const statusColorMap: Record<string, string> = {
  DRAFT: "default",
  SUBMITTED: "blue",
  APPROVED: "success",
  REJECTED: "error",
  CANCELLED: "warning",
};

export const ApprovalStatus = ({ value }: { value: string }) => (
  <EnumTag
    value={value}
    options={APPROVAL_STATUS_OPTIONS}
    colorMap={statusColorMap}
    tooltipPrefix="Status"
  />
);
