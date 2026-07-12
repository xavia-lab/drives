import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { PaginationService } from './pagination.service';
import { QueryBuilderService } from '../query-builder/query-builder.service';

describe('PaginationService', () => {
  let service: PaginationService;
  let mockQueryBuilder: jest.Mocked<QueryBuilderService>;
  let mockModelClass: any;

  beforeEach(async () => {
    // Define the mock query builder functions
    mockQueryBuilder = {
      buildQueryOptions: jest.fn(),
    } as any;

    mockModelClass = {
      name: 'TestModel',
      findAndCountAll: jest.fn(),
    };

    // 🌟 Fix: Register BOTH the service and the mocked dependency token together
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaginationService,
        {
          provide: QueryBuilderService,
          useValue: mockQueryBuilder, // Tells NestJS to inject our mock instead of the real class
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

    const result = await service.paginate(mockModelClass, {
      pageNumber: 1,
      pageSize: 10,
    });
    expect(result.data[0].itemNumber).toBe(1);
  });
});
