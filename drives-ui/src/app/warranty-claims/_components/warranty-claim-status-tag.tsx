"use client";

import { Tag } from "antd";

export const WARRANTY_CLAIM_STATUS_OPTIONS = [
  { label: "Submitted", value: "SUBMITTED" },
  { label: "Shipped to vendor", value: "SHIPPED_TO_VENDOR" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Replacement received", value: "REPLACEMENT_RECEIVED" },
  { label: "Closed", value: "CLOSED" },
] as const;

const STATUS_META: Record<string, { label: string; color: string }> = {
  SUBMITTED: { label: "Submitted", color: "blue" },
  SHIPPED_TO_VENDOR: { label: "Shipped to vendor", color: "geekblue" },
  APPROVED: { label: "Approved", color: "green" },
  REJECTED: { label: "Rejected", color: "red" },
  REPLACEMENT_RECEIVED: {
    label: "Replacement received",
    color: "purple",
  },
  CLOSED: { label: "Closed", color: "default" },
};

export const WarrantyClaimStatusTag = ({
  status,
}: {
  status?: string | null;
}) => {
  const key = status ?? "SUBMITTED";
  const meta = STATUS_META[key] ?? { label: key, color: "default" };

  return <Tag color={meta.color}>{meta.label}</Tag>;
};
