import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { LogicalVdevService } from './logical-vdev.service';
import {
  LogicalVdev,
  VdevRedundancyProfile,
} from './entities/logical-vdev.entity';
import { StoragePool } from '../storage-pool/entities/storage-pool.entity';
import { PaginationService } from '../common/pagination/pagination.service';
import { CreateLogicalVdevDto } from './dto/create-logical-vdev.dto';
import {
  describe,
  it,
  expect,
  beforeEach,
  vi,
  type Mock,
  type Mocked,
} from 'vitest'; // 🚀 Pure ESM imports from Vitest

describe('LogicalVdevService', () => {
  let service: LogicalVdevService;

  // 🚀 Explicit Vitest mock types replace legacy configuration definitions
  let mockLogicalVdevModel: Record<string, Mock>;
  let mockStoragePoolModel: Record<string, Mock>;
  let mockPaginationService: Mocked<PaginationService>;

  beforeEach(async () => {
    mockLogicalVdevModel = {
      findOne: vi.fn(), // 🚀 Swapped out legacy jest.fn() with vitest vi.fn()
      findByPk: vi.fn(),
      create: vi.fn(),
      destroy: vi.fn(),
    };
    mockStoragePoolModel = { findByPk: vi.fn() };

    mockPaginationService = {
      paginate: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogicalVdevService,
        { provide: getModelToken(LogicalVdev), useValue: mockLogicalVdevModel },
        { provide: getModelToken(StoragePool), useValue: mockStoragePoolModel },
        { provide: PaginationService, useValue: mockPaginationService },
      ],
    }).compile();

    service = module.get<LogicalVdevService>(LogicalVdevService);
    vi.clearAllMocks(); // 🚀 Using Vitest native mock reset pipeline utilities
  });

  describe('findAll', () => {
    it('should cleanly delegate pagination logic to PaginationService with correct relation inclusions', async () => {
      const mockQuery = { pageNumber: 1, pageSize: 10 };
      const expectedPaginatedOutput = { data: [], meta: {} } as unknown as {
        data: (LogicalVdev & { itemNumber: number })[];
        meta: Record<string, unknown>;
      };
      mockPaginationService.paginate.mockResolvedValue(expectedPaginatedOutput);

      const result = await service.findAll(mockQuery);

      expect(result).toEqual(expectedPaginatedOutput);
      expect(mockPaginationService.paginate).toHaveBeenCalledWith(
        mockLogicalVdevModel as unknown,
        mockQuery,
        { include: [StoragePool] },
      );
    });
  });

  describe('create', () => {
    const createDto: CreateLogicalVdevDto = {
      storagePoolId: 'pool-uuid',
      vdevName: 'raidz2-0',
      vdevRedundancyProfile: VdevRedundancyProfile.RAIDZ2,
    };

    it('should successfully create and reload a logical vdev if pool boundary conditions pass', async () => {
      const mockReload = vi
        .fn()
        .mockResolvedValue({ id: 'vdev-uuid', ...createDto });
      mockLogicalVdevModel.findOne.mockResolvedValue(null);
      mockStoragePoolModel.findByPk.mockResolvedValue({ id: 'pool-uuid' });
      mockLogicalVdevModel.create.mockResolvedValue({
        id: 'vdev-uuid',
        reload: mockReload,
      });

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(mockLogicalVdevModel.create).toHaveBeenCalledWith(createDto);
      expect(mockReload).toHaveBeenCalledWith({ include: [StoragePool] });
    });

    it('should throw ConflictException if vdev name already exists inside the same parent storage pool scope', async () => {
      mockLogicalVdevModel.findOne.mockResolvedValue({ id: 'existing-id' });

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw NotFoundException if targeted parent storage pool is missing from the system repository', async () => {
      mockLogicalVdevModel.findOne.mockResolvedValue(null);
      mockStoragePoolModel.findByPk.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(
        new NotFoundException('StoragePool with ID pool-uuid not found'),
      );
    });
  });
});
