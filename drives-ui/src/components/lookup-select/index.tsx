"use client";

import { useLookupOptions } from "@hooks/use-lookup-options";
import { Select } from "antd";
import type { SelectProps } from "antd";

interface LookupSelectProps extends SelectProps {
  resource: string;
  optionLabel?: string;
  optionValue?: string;
  pageSize?: number;
}

/**
 * A select backed by a Refine resource that loads its options up front and
 * filters them in the browser as the user types (Ant Design's built-in search).
 */
export const LookupSelect = ({
  resource,
  optionLabel = "name",
  optionValue = "id",
  pageSize = 100,
  ...selectProps
}: LookupSelectProps) => {
  const { options, isLoading } = useLookupOptions({
    resource,
    optionLabel,
    optionValue,
    pageSize,
  });

  return (
    <Select
      showSearch
      optionFilterProp="label"
      loading={isLoading}
      {...selectProps}
      options={options}
    />
  );
};
