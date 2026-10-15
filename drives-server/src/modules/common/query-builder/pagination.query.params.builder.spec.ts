import { build } from './pagination.query.params.builder';
import { describe, it, expect } from 'vitest'; // 🚀 Pure ESM imports from Vitest

describe('PaginationQueryParamsBuilder', () => {
  describe('Paging', () => {
    it('should calculate offset and limit for given pageNumber and pageSize', () => {
      const result = build({ pageNumber: 5, pageSize: 25 });
      expect(result.offset).toBe(100);
      expect(result.limit).toBe(25);
      expect(result.order).toStrictEqual([]);
    });

    it('should return no offset or limit if no paging params', () => {
      const result = build({});
      expect(result.offset).not.toBeDefined();
      expect(result.limit).not.toBeDefined();
      expect(result.order).toStrictEqual([]);
    });
  });

  describe('Sorting', () => {
    it('should build order for multiple sort fields with order', () => {
      const result = build({ sortOrder: 'asc', sortField: 'name,createdAt' });
      expect(result.order).toStrictEqual([
        ['name', 'asc'],
        ['createdAt', 'asc'],
      ]);
    });

    it('should build order for single sort field with order', () => {
      const result = build({ sortOrder: 'desc', sortField: 'name' });
      expect(result.order).toStrictEqual([['name', 'desc']]);
    });

    it('should build order for sort field without order (default asc)', () => {
      const result = build({ sortField: 'name' });
      expect(result.order).toStrictEqual([['name']]);
    });

    it('should return empty order if no sorting params', () => {
      const result = build({});
      expect(result.order).toStrictEqual([]);
    });
  });

  describe('Filtering', () => {
    it('should build where clause for valid filter params', () => {
      const result = build({
        filterField: 'name',
        filterOperator: 'eq',
        filterValue: 'GB',
      });
      expect(result.where).toBeDefined();
    });

    it('should return no where clause if no filter params', () => {
      const result = build({});
      expect(result.where).not.toBeDefined();
    });

    it('should return no where clause if missing required filter params', () => {
      const result = build({ filterField: 'name', filterOperator: 'eq' });
      expect(result.where).not.toBeDefined();
    });
  });

  describe('Combined Params', () => {
    it('should handle paging, sorting, and filtering together', () => {
      const result = build({
        pageNumber: 2,
        pageSize: 10,
        sortField: 'name',
        sortOrder: 'asc',
        filterField: 'status',
        filterOperator: 'like',
        filterValue: 'active',
      });
      expect(result.offset).toBe(10);
      expect(result.limit).toBe(10);
      expect(result.order).toStrictEqual([['name', 'asc']]);

      const whereClause = result.where as Record<string, unknown>;
      expect(whereClause.status).toStrictEqual({
        [Symbol.for('like')]: '%active%',
      }); // Symbolic for Op.like
    });
  });
});
