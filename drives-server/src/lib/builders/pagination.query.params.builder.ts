import { isNotEmpty } from '../utils/objects.util';
import { where as buildWhereClause } from './select.operators.builder';

export interface PaginationQueryParams {
  pageNumber?: number;
  pageSize?: number;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
  filterField?: string;
  filterOperator?: string;
  filterValue?: string;
}

export interface PaginationResult {
  offset?: number;
  limit?: number;
  order: any[];
  where?: any;
}

export const build = (queryParams: PaginationQueryParams): PaginationResult => {
  const paging = calculatePaging(queryParams);
  const order = calculateSorting(queryParams);
  const filter = calculateFiltering(queryParams);

  const result: PaginationResult = {
    order,
    ...paging,
    ...filter,
  };

  return result;
};

const calculatePaging = (params: PaginationQueryParams) => {
  const { pageNumber, pageSize } = params;

  // Use direct truthiness check so TypeScript narrows the type automatically
  if (pageNumber !== undefined && pageSize !== undefined) {
    return {
      offset: (pageNumber - 1) * pageSize,
      limit: pageSize,
    };
  }
  return {};
};

const calculateSorting = (params: PaginationQueryParams) => {
  const { sortField, sortOrder } = params;

  // Direct check narrows 'sortField' to string
  if (sortField !== undefined && isNotEmpty(sortField)) {
    const fields = sortField.split(',').map((f) => f.trim());
    if (sortOrder) {
      return fields.map((field) => [field, sortOrder]);
    }
    return fields.map((field) => [field]);
  }
  return [];
};

const calculateFiltering = (params: PaginationQueryParams) => {
  const { filterField, filterOperator, filterValue } = params;

  // Ensure all are defined strings before passing to buildWhereClause
  if (
    filterField !== undefined &&
    filterOperator !== undefined &&
    filterValue !== undefined &&
    isNotEmpty(filterField) &&
    isNotEmpty(filterOperator) &&
    isNotEmpty(filterValue)
  ) {
    return buildWhereClause({
      field: filterField, // Now guaranteed to be string
      operator: filterOperator,
      value: filterValue,
    });
  }
  return {};
};
