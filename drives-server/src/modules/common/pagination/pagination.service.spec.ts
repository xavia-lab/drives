import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'sequelize-typescript'; // 👈 Imported Model for safe structural type-casting
import { PaginationService } from './pagination.service';
import { QueryBuilderService } from '../query-builder/query-builder.service';
// Fixed: Removed the unused 'InternalServerErrorException' token to satisfy the unused-vars check

describe('PaginationService', () => {
  let service: PaginationService;
  // Fixed: Swapped loose 'any' definitions for structured mock records
  let mockQueryBuilder: jest.Mocked<QueryBuilderService>;
  let mockModelClass: Record<string, jest.Mock>;

  beforeEach(async () => {
    // 1. Initialize query builder mock using an unknown double-cast wrapper
    mockQueryBuilder = {
      buildQueryOptions: jest.fn(),
    } as unknown as jest.Mocked<QueryBuilderService>;

    // 2. Initialize the model repository class mock with structured spys
    mockModelClass = {
      name: 'TestModel',
      findAndCountAll: jest.fn(),
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
    jest.clearAllMocks();
  });

  it('should calculate sequential item numbers correctly on Page 1', async () => {
    const mockRows = [
      {
        id: '019f4fa1-57db-72d7-b037-2f35d54f2794',
        name: 'USD',
        get: jest.fn().mockReturnValue({
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

    // Fixed: Cast mockModelClass using unknown instead of any to safely satisfy strict parameter bounds
    const result = await service.paginate(
      mockModelClass as unknown as typeof Model,
      {
        pageNumber: 1,
        pageSize: 10,
      },
    );

    expect(result.data[0].itemNumber).toBe(1);
  });
});
