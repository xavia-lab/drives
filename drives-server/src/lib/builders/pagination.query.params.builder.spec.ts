import { build } from './pagination.query.params.builder';

describe('PaginationQueryParamsBuilder', () => {
  describe('Paging', () => {
    test('should calculate offset and limit for given pageNumber and pageSize', () => {
      const result = build({ pageNumber: 5, pageSize: 25 });
      expect(result.offset).toBe(100);
      expect(result.limit).toBe(25);
      expect(result.order).toStrictEqual([]);
    });

    test('should return no offset or limit if no paging params', () => {
      const result = build({});
      expect(result.offset).not.toBeDefined();
      expect(result.limit).not.toBeDefined();
      expect(result.order).toStrictEqual([]);
    });
  });

  describe('Sorting', () => {
    test('should build order for multiple sort fields with order', () => {
      const result = build({ sortOrder: 'asc', sortField: 'name,createdAt' });
      expect(result.order).toStrictEqual([
        ['name', 'asc'],
        ['createdAt', 'asc'],
      ]);
    });

    test('should build order for single sort field with order', () => {
      const result = build({ sortOrder: 'desc', sortField: 'name' });
      expect(result.order).toStrictEqual([['name', 'desc']]);
    });

    test('should build order for sort field without order (default asc)', () => {
      const result = build({ sortField: 'name' });
      expect(result.order).toStrictEqual([['name']]);
    });

    test('should return empty order if no sorting params', () => {
      const result = build({});
      expect(result.order).toStrictEqual([]);
    });
  });

  describe('Filtering', () => {
    test('should build where clause for valid filter params', () => {
      const result = build({
        filterField: 'name',
        filterOperator: 'eq',
        filterValue: 'GB',
      });
      expect(result.where).toBeDefined();
    });

    test('should return no where clause if no filter params', () => {
      const result = build({});
      expect(result.where).not.toBeDefined();
    });

    test('should return no where clause if missing required filter params', () => {
      const result = build({ filterField: 'name', filterOperator: 'eq' }); // Missing filterValue, but validation is now in DTO
      expect(result.where).not.toBeDefined();
    });
  });

  describe('Combined Params', () => {
    test('should handle paging, sorting, and filtering together', () => {
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
      expect(result.where.status).toStrictEqual({
        [Symbol.for('like')]: '%active%',
      }); // Symbolic for Op.like
    });
  });
});
