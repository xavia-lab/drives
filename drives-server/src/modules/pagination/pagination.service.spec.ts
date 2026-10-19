import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'sequelize-typescript'; // 🚀 Core model definition for formal signature casting
import { Op } from 'sequelize';
import { PaginationService } from './pagination.service';
import { QueryBuilderService } from './query-builder.service';
import {
  describe,
  it,
  expect,
  beforeEach,
  vi,
  type Mock,
  type Mocked,
} from 'vitest'; // 🚀 Pure ESM imports from Vitest

// 🌟 FIX: Declare a local type interface representing the returned row structure
interface TestModelAttributes extends Model {
  id: string;
  displayKey: number;
  name: string;
}

describe('PaginationService', () => {
  let service: PaginationService;

  // 🚀 Explicit Vitest mock types replace legacy configuration definitions
  let mockQueryBuilder: Mocked<QueryBuilderService>;
  let mockModelClass: Record<string, Mock> & { name: string };

  beforeEach(async () => {
    // 1. Initialize query builder mock using clear type boundaries
    mockQueryBuilder = {
      buildQueryOptions: vi.fn(),
    };

    // 2. Initialize the model repository class mock with structured spys using vi.fn()
    mockModelClass = {
      name: 'TestModel',
      findAndCountAll: vi.fn(), // 🚀 Swapped out legacy jest.fn() with vitest vi.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaginationService,
        {
          provide: QueryBuilderService,
          useValue: mockQueryBuilder,
        },
      ],
    }).compile();

    service = module.get<PaginationService>(PaginationService);
    vi.clearAllMocks(); // 🚀 Using Vitest native mock reset pipeline utilities
  });

  it('should cleanly deliver database models in the pagination payload', async () => {
    const mockRows = [
      {
        id: '019f4fa1-57db-72d7-b037-2f35d54f2794',
        displayKey: 1,
        name: 'USD',
      },
    ];

    mockQueryBuilder.buildQueryOptions.mockReturnValue({
      limit: 10,
      offset: 0,
    });

    mockModelClass.findAndCountAll.mockResolvedValue({
      count: 1,
      rows: mockRows,
    });

    // 🌟 FIX: Replaced <any> with <TestModelAttributes> to satisfy member access boundaries safely
    const result = await service.paginate<TestModelAttributes>(
      mockModelClass as unknown as typeof Model,
      {
        pageNumber: 1,
        pageSize: 10,
      },
    );

    // 🌟 Assertions updated to focus on the structure and presence of the DB model data
    expect(result.data).toBeDefined();
    expect(result.data.length).toBe(1);
    expect(result.data[0].id).toBe('019f4fa1-57db-72d7-b037-2f35d54f2794');
    expect(result.data[0].displayKey).toBe(1);
    expect(result.data[0].name).toBe('USD');
  });

  it('ANDs query filters with custom service filters', async () => {
    mockQueryBuilder.buildQueryOptions.mockReturnValue({
      where: { [Op.and]: [{ status: { [Op.eq]: 'active' } }] },
      order: [],
    });
    mockModelClass.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await service.paginate(
      mockModelClass as unknown as typeof Model,
      { pageNumber: 1, pageSize: 10 },
      { where: { id: { [Op.in]: ['a'] } } },
    );

    const options = mockModelClass.findAndCountAll.mock.calls[0][0] as {
      where: unknown;
      order: unknown;
    };
    expect(options.where).toEqual({
      [Op.and]: [
        { [Op.and]: [{ status: { [Op.eq]: 'active' } }] },
        { id: { [Op.in]: ['a'] } },
      ],
    });
    // No explicit order from the builder -> default displayKey ordering.
    expect(options.order).toEqual([['displayKey', 'ASC']]);
  });

  it('rethrows BadRequestException from the query builder', async () => {
    mockQueryBuilder.buildQueryOptions.mockImplementation(() => {
      throw new BadRequestException('bad filter');
    });

    await expect(
      service.paginate(mockModelClass as unknown as typeof Model, {}),
    ).rejects.toThrow(BadRequestException);
  });

  it('maps unknown-column database errors to BadRequestException', async () => {
    mockQueryBuilder.buildQueryOptions.mockReturnValue({ order: [] });
    mockModelClass.findAndCountAll.mockRejectedValue({
      message: 'column "nope" does not exist',
      original: { code: '42703' },
    });

    await expect(
      service.paginate(mockModelClass as unknown as typeof Model, {}),
    ).rejects.toThrow(BadRequestException);
  });
});
