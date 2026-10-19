import { OrderItem, WhereOptions } from 'sequelize';
import { RawFilterParams } from '../filter.types';
import { normalizeFilters } from './filter-normalizer';
import { buildWhere } from './where-clause.builder';

export interface PaginationQueryParams extends RawFilterParams {
  pageNumber?: number;
  pageSize?: number;
  sortField?: string;
  /** Single direction or a comma-separated list paired with `sortField`. */
  sortOrder?: string;
}

export interface PaginationResult {
  offset?: number;
  limit?: number;
  order: OrderItem[];
  where?: WhereOptions;
}

/**
 * Builds Sequelize `FindOptions` from the generic list query.
 *
 * - Paging is applied only when both `pageNumber` and `pageSize` are positive.
 * - Sorting supports comma-separated fields and orders (paired by index).
 * - Filtering supports any number of conditions, ANDed together.
 */
export const build = (params: PaginationQueryParams = {}): PaginationResult => {
  const where = buildWhere(normalizeFilters(params));

  return {
    ...calculatePaging(params),
    order: calculateSorting(params),
    ...(where ? { where } : {}),
  };
};

const calculatePaging = ({
  pageNumber,
  pageSize,
}: PaginationQueryParams): Pick<PaginationResult, 'offset' | 'limit'> => {
  const page = Number(pageNumber);
  const size = Number(pageSize);

  if (
    Number.isFinite(page) &&
    Number.isFinite(size) &&
    page >= 1 &&
    size >= 1
  ) {
    return { offset: (page - 1) * size, limit: size };
  }

  return {};
};

const calculateSorting = ({
  sortField,
  sortOrder,
}: PaginationQueryParams): OrderItem[] => {
  if (!sortField) {
    return [];
  }

  const fields = sortField
    .split(',')
    .map((field) => field.trim())
    .filter((field) => field.length > 0);
  const orders = (sortOrder ?? '')
    .split(',')
    .map((order) => order.trim().toLowerCase())
    .filter((order) => order.length > 0);

  return fields.map((field, index): OrderItem => {
    const direction = orders[index] ?? orders[0] ?? 'asc';
    return [field, direction === 'desc' ? 'desc' : 'asc'];
  });
};
