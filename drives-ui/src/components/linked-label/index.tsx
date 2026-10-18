import type { ReactNode } from "react";
import { Typography } from "antd";
import { ExportOutlined } from "@ant-design/icons";

export type LinkedLabelOption = {
  label: string;
  value: unknown;
};

export type LinkedLabelProps = {
  /** Refine resource whose show page the label links to (e.g. `"vendors"`). */
  resource: string;
  /** Foreign-key value used to build the show URL (`/{resource}/show/{value}`). */
  value: unknown;
  /** Lookup options used to resolve the display label from `value`. */
  options?: LinkedLabelOption[];
  /** Explicit label; when provided it wins over `options` resolution. */
  label?: ReactNode;
  /** Rendered when the value is empty or no label can be resolved. */
  fallback?: ReactNode;
};

const isEmpty = (value: unknown) =>
  value === undefined || value === null || value === "";

/**
 * Renders a foreign-key label as an external link to the target resource's show
 * page (opened in a new tab, with an external-link affordance). Falls back to
 * plain text when the value is missing or its label cannot be resolved — so it
 * is safe to use while lookup options are still loading.
 */
export const LinkedLabel = ({
  resource,
  value,
  options,
  label,
  fallback = "Loading...",
}: LinkedLabelProps) => {
  const resolvedLabel =
    label ?? options?.find((option) => option.value === value)?.label;

  if (isEmpty(value) || resolvedLabel === undefined || resolvedLabel === null) {
    return <>{fallback}</>;
  }

  return (
    <Typography.Link
      href={`/${resource}/show/${value}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      {resolvedLabel} <ExportOutlined style={{ fontSize: 12 }} />
    </Typography.Link>
  );
};
