import { Op } from 'sequelize';
import { describe, it, expect } from 'vitest';
import { build } from './find-options.builder';

describe('pagination query builder', () => {
  describe('paging', () => {
    it('calculates offset and limit', () => {
      expect(build({ pageNumber: 5, pageSize: 25 })).toEqual({
        offset: 100,
        limit: 25,
        order: [],
      });
    });

    it('omits paging when no page params are supplied', () => {
      expect(build({})).toEqual({ order: [] });
    });

    it('omits paging when only one page param is supplied', () => {
      expect(build({ pageNumber: 2 })).toEqual({ order: [] });
      expect(build({ pageSize: 10 })).toEqual({ order: [] });
    });

    it('omits paging for invalid values', () => {
      expect(build({ pageNumber: 0, pageSize: 10 })).toEqual({ order: [] });
      expect(build({ pageNumber: 1, pageSize: 0 })).toEqual({ order: [] });
    });
  });

  describe('sorting', () => {
    it('builds a single sort', () => {
      expect(build({ sortField: 'name', sortOrder: 'desc' })).toEqual({
        order: [['name', 'desc']],
      });
    });

    it('defaults the direction to ascending', () => {
      expect(build({ sortField: 'name' })).toEqual({
        order: [['name', 'asc']],
      });
    });

    it('pairs multiple fields with multiple orders', () => {
      expect(
        build({ sortField: 'name, createdAt', sortOrder: 'asc,desc' }),
      ).toEqual({
        order: [
          ['name', 'asc'],
          ['createdAt', 'desc'],
        ],
      });
    });

    it('broadcasts a single order across multiple fields', () => {
      expect(build({ sortField: 'name,createdAt', sortOrder: 'desc' })).toEqual(
        {
          order: [
            ['name', 'desc'],
            ['createdAt', 'desc'],
          ],
        },
      );
    });

    it('falls back to ascending for unknown directions', () => {
      expect(build({ sortField: 'name', sortOrder: 'sideways' })).toEqual({
        order: [['name', 'asc']],
      });
    });
  });

  describe('filtering', () => {
    it('builds a single structured filter', () => {
      expect(
        build({
          filters: [{ field: 'name', operator: 'like', value: 'GB' }],
        }),
      ).toEqual({
        order: [],
        where: { name: { [Op.like]: '%GB%' } },
      });
    });

    it('builds multiple structured filters as an AND', () => {
      expect(
        build({
          filters: [
            { field: 'name', operator: 'like', value: 'GB' },
            { field: 'createdAt', operator: 'gte', value: '2026-01-01' },
          ],
        }),
      ).toEqual({
        order: [],
        where: {
          [Op.and]: [
            { name: { [Op.like]: '%GB%' } },
            { createdAt: { [Op.gte]: '2026-01-01' } },
          ],
        },
      });
    });

    it('turns an id lookup into an IN filter', () => {
      expect(build({ id: ['a', 'b'] })).toEqual({
        order: [],
        where: { id: { [Op.in]: ['a', 'b'] } },
      });
    });

    it('returns no where clause when there are no filters', () => {
      expect(build({ pageNumber: 1, pageSize: 10 })).not.toHaveProperty(
        'where',
      );
    });
  });

  it('combines paging, sorting and multiple filters', () => {
    expect(
      build({
        pageNumber: 2,
        pageSize: 10,
        sortField: 'displayKey',
        sortOrder: 'desc',
        filters: [
          { field: 'status', operator: 'eq', value: 'active' },
          { field: 'createdAt', operator: 'gte', value: '2026-01-01' },
        ],
      }),
    ).toEqual({
      offset: 10,
      limit: 10,
      order: [['displayKey', 'desc']],
      where: {
        [Op.and]: [
          { status: { [Op.eq]: 'active' } },
          { createdAt: { [Op.gte]: '2026-01-01' } },
        ],
      },
    });
  });
});
