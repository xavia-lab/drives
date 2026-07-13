import { Test, TestingModule } from '@nestjs/testing';
import { QueryBuilderService } from './query-builder.service';
import { PaginationQueryDto } from '../dto/pagination-query.dto';

// 1. Mock your external utility modules
jest.mock('../../../lib/utils/objects.util', () => ({
  isEmpty: jest.fn(),
  isObjectEmpty: jest.fn(),
  isNotEmpty: jest.fn(),
}));

jest.mock('../../../lib/builders/id.query.params.builder', () => ({
  build: jest.fn(),
}));

jest.mock('../../../lib/builders/pagination.query.params.builder', () => ({
  build: jest.fn(),
}));

// Import the mocked utilities so we can control their return values in tests
import {
  isEmpty,
  isObjectEmpty,
  isNotEmpty,
} from '../../../lib/utils/objects.util';
import { build as buildById } from '../../../lib/builders/id.query.params.builder';
import { build as buildPagination } from '../../../lib/builders/pagination.query.params.builder';

describe('QueryBuilderService', () => {
  let service: QueryBuilderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QueryBuilderService],
    }).compile();

    service = module.get<QueryBuilderService>(QueryBuilderService);

    // Clear mock histories between individual test runs
    jest.clearAllMocks();
  });

  it('should return an empty object if query is empty or completely null', () => {
    // Arrange: Simulate an empty query scenario
    (isEmpty as jest.Mock).mockReturnValue(true);
    (isObjectEmpty as jest.Mock).mockReturnValue(false);

    const query: PaginationQueryDto = {};

    // Act
    const result = service.buildQueryOptions(query);

    // Assert
    expect(result).toEqual({});
    expect(isEmpty).toHaveBeenCalledWith(query);
    expect(buildById).not.toHaveBeenCalled();
    expect(buildPagination).not.toHaveBeenCalled();
  });

  it('should call buildById when the query payload contains an id parameter', () => {
    // Arrange: Bypass empty checks, but trigger the ID checker conditional branch
    (isEmpty as jest.Mock).mockReturnValue(false);
    (isObjectEmpty as jest.Mock).mockReturnValue(false);
    (isNotEmpty as jest.Mock).mockReturnValue(true);

    const expectedMockedOutput = {
      where: { id: '019f4fa1-57db-72d7-b037-2f35d54f2794' },
    };
    (buildById as jest.Mock).mockReturnValue(expectedMockedOutput);

    const query: PaginationQueryDto = {
      id: '019f4fa1-57db-72d7-b037-2f35d54f2794',
    } as any;

    // Act
    const result = service.buildQueryOptions(query);

    // Assert
    expect(result).toEqual(expectedMockedOutput);
    expect(isNotEmpty).toHaveBeenCalledWith(query.id);
    expect(buildById).toHaveBeenCalledWith(query);
    expect(buildPagination).not.toHaveBeenCalled();
  });

  it('should fallback to buildPagination if query is not empty and lacks an ID parameter', () => {
    // Arrange: Bypass empty checks and bypass the ID validation branch
    (isEmpty as jest.Mock).mockReturnValue(false);
    (isObjectEmpty as jest.Mock).mockReturnValue(false);
    (isNotEmpty as jest.Mock).mockReturnValue(false);

    const expectedMockedOutput = {
      limit: 10,
      offset: 0,
      order: [['id', 'ASC']],
    };
    (buildPagination as jest.Mock).mockReturnValue(expectedMockedOutput);

    const query: PaginationQueryDto = { pageNumber: 1, pageSize: 10 };

    // Act
    const result = service.buildQueryOptions(query);

    // Assert
    expect(result).toEqual(expectedMockedOutput);
    expect(buildPagination).toHaveBeenCalledWith(query);
    expect(buildById).not.toHaveBeenCalled();
  });
});
