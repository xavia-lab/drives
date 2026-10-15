import { Test, TestingModule } from '@nestjs/testing';
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

  it('should calculate sequential item numbers correctly on Page 1', async () => {
    const mockRows = [
      {
        id: '019f4fa1-57db-72d7-b037-2f35d54f2794',
        name: 'USD',
        get: vi.fn().mockReturnValue({
          id: '019f4fa1-57db-72d7-b037-2f35d54f2794',
          name: 'USD',
        }),
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

    const result = await service.paginate(mockModelClass as unknown, {
      pageNumber: 1,
      pageSize: 10,
    });

    expect(result.data[0].itemNumber).toBe(1);
  });
});
