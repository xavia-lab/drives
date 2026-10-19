import { BadRequestException } from '@nestjs/common';
import { Op } from 'sequelize';
import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { QueryBuilderService } from './query-builder.service';

describe('QueryBuilderService', () => {
  let service: QueryBuilderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QueryBuilderService],
    }).compile();

    service = module.get(QueryBuilderService);
  });

  it('returns an empty ordering for an empty query', () => {
    expect(service.buildQueryOptions({})).toEqual({ order: [] });
  });

  it('builds paging, sorting and a single filter', () => {
    expect(
      service.buildQueryOptions({
        pageNumber: 1,
        pageSize: 10,
        sortField: 'name',
        sortOrder: 'asc',
        filters: [{ field: 'name', operator: 'like', value: 'GB' }],
      }),
    ).toEqual({
      offset: 0,
      limit: 10,
      order: [['name', 'asc']],
      where: { name: { [Op.like]: '%GB%' } },
    });
  });

  it('builds an AND of multiple structured filters', () => {
    expect(
      service.buildQueryOptions({
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

  it('builds an id IN filter', () => {
    expect(service.buildQueryOptions({ id: ['a', 'b'] })).toEqual({
      order: [],
      where: { id: { [Op.in]: ['a', 'b'] } },
    });
  });

  it('propagates invalid filters as BadRequestException', () => {
    expect(() =>
      service.buildQueryOptions({
        filters: [
          // Bypass the DTO type to exercise the runtime guard.
          { field: 'name', operator: 'regex' as never, value: 'x' },
        ],
      }),
    ).toThrow(BadRequestException);
  });
});
