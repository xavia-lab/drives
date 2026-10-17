import type { BaseRecord } from "@refinedev/core";
import { useList } from "@refinedev/core";
import { useMemo } from "react";

interface UseLookupOptionsProps {
  resource: string;
  optionLabel?: string;
  optionValue?: string;
  pageSize?: number;
}

/**
 * Loads every row of a small lookup resource up front and maps it to Ant Design
 * select options. Kept in one page so the select can filter them in the browser.
 */
export const useLookupOptions = ({
  resource,
  optionLabel = "name",
  optionValue = "id",
  pageSize = 100,
}: UseLookupOptionsProps) => {
  const { query } = useList({
    resource,
    pagination: { mode: "server", currentPage: 1, pageSize },
  });

  const options = useMemo(
    () =>
      (query.data?.data ?? []).map((record: BaseRecord) => ({
        label: String(record[optionLabel] ?? ""),
        value: record[optionValue],
      })),
    [query.data?.data, optionLabel, optionValue],
  );

  return { options, isLoading: query.isLoading };
};
