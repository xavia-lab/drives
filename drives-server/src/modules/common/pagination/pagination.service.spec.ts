import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'sequelize-typescript'; // 🚀 Core model definition for formal signature casting
import { PaginationService } from './pagination.service';
import { QueryBuilderService } from '../query-builder/query-builder.service';
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
    } as unknown as Mocked<QueryBuilderService>;

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
});
