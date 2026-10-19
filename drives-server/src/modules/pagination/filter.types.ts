// Shared filter vocabulary for the generic list query API.
//
// Filters are supplied through the `filters` parameter (one JSON object, a JSON
// array, or repeated params), plus direct `id` lookups. They are normalized to
// `FilterCondition[]` and ANDed together.

export const FILTER_OPERATORS = [
  'eq',
  'ne',
  'gt',
  'gte',
  'lt',
  'lte',
  'in',
  'like',
  'between',
] as const;

export type FilterOperator = (typeof FILTER_OPERATORS)[number];

export interface FilterCondition {
  field: string;
  operator: FilterOperator;
  value: string;
}

// Raw values as they arrive on the query string (unknown because Express can
// parse repeated keys into arrays).
export interface RawFilterParams {
  id?: unknown;
  filters?: unknown;
}
