import { Test, TestingModule } from '@nestjs/testing';
import { QueryBuilderService } from './query-builder.service';
import { PaginationQueryDto } from '../dto/pagination-query.dto';
import { describe, it, expect, beforeEach, vi } from 'vitest'; // 🚀 Pure ESM imports from Vitest

// 1. Mock your external utility modules using clean Vitest factory architecture
vi.mock('../../../lib/utils/objects.util', () => ({
  isEmpty: vi.fn(),
  isObjectEmpty: vi.fn(),
  isNotEmpty: vi.fn(),
}));

vi.mock('./id.query.params.builder', () => ({
  build: vi.fn(),
}));

vi.mock('./pagination.query.params.builder', () => ({
  build: vi.fn(),
}));

// Import the mocked utilities so we can control their return values in tests
import {
  isEmpty,
  isObjectEmpty,
  isNotEmpty,
} from '../../../lib/utils/objects.util';
import { build as buildById } from './id.query.params.builder';
import { build as buildPagination } from './pagination.query.params.builder';

describe('QueryBuilderService', () => {
  let service: QueryBuilderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QueryBuilderService],
    }).compile();

    service = module.get<QueryBuilderService>(QueryBuilderService);

    // 🚀 Clear mock histories between individual test runs natively
    vi.clearAllMocks();
  });

  it('should return an empty object if query is empty or completely null', () => {
    // Arrange: Simulate an empty query scenario using vi.mocked for clean types
    vi.mocked(isEmpty).mockReturnValue(true);
    vi.mocked(isObjectEmpty).mockReturnValue(false);

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
    vi.mocked(isEmpty).mockReturnValue(false);
    vi.mocked(isObjectEmpty).mockReturnValue(false);
    vi.mocked(isNotEmpty).mockReturnValue(true);

    const expectedMockedOutput = {
      where: { id: '019f4fa1-57db-72d7-b037-2f35d54f2794' },
    };

    // 🚀 Clean, type-safe mocking wrapper without double-casting workarounds
    vi.mocked(buildById).mockReturnValue(expectedMockedOutput);

    const query: PaginationQueryDto = {
      id: '019f4fa1-57db-72d7-b037-2f35d54f2794',
    };

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
    vi.mocked(isEmpty).mockReturnValue(false);
    vi.mocked(isObjectEmpty).mockReturnValue(false);
    vi.mocked(isNotEmpty).mockReturnValue(false);

    const expectedMockedOutput = {
      limit: 10,
      offset: 0,
      order: [['id', 'ASC']],
    };

    vi.mocked(buildPagination).mockReturnValue(expectedMockedOutput);

    const query: PaginationQueryDto = { pageNumber: 1, pageSize: 10 };

    // Act
    const result = service.buildQueryOptions(query);

    // Assert
    expect(result).toEqual(expectedMockedOutput);
    expect(buildPagination).toHaveBeenCalledWith(query);
    expect(buildById).not.toHaveBeenCalled();
  });
});
