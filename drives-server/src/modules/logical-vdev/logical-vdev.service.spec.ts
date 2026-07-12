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
import { UpdateLogicalVdevDto } from './dto/update-logical-vdev.dto';

describe('LogicalVdevService', () => {
  let service: LogicalVdevService;
  let mockLogicalVdevModel: any;
  let mockStoragePoolModel: any;
  let mockPaginationService: jest.Mocked<PaginationService>;

  beforeEach(async () => {
    mockLogicalVdevModel = {
      findOne: jest.fn(),
      findByPk: jest.fn(),
      create: jest.fn(),
      destroy: jest.fn(),
    };
    mockStoragePoolModel = { findByPk: jest.fn() };
    mockPaginationService = { paginate: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogicalVdevService,
        { provide: getModelToken(LogicalVdev), useValue: mockLogicalVdevModel },
        { provide: getModelToken(StoragePool), useValue: mockStoragePoolModel },
        { provide: PaginationService, useValue: mockPaginationService },
      ],
    }).compile();

    service = module.get<LogicalVdevService>(LogicalVdevService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should cleanly delegate pagination logic to PaginationService with correct relation inclusions', async () => {
      const mockQuery = { pageNumber: 1, pageSize: 10 };
      const expectedPaginatedOutput = { data: [], meta: {} } as any;
      mockPaginationService.paginate.mockResolvedValue(expectedPaginatedOutput);

      const result = await service.findAll(mockQuery);

      expect(result).toEqual(expectedPaginatedOutput);
      expect(mockPaginationService.paginate).toHaveBeenCalledWith(
        mockLogicalVdevModel,
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
      const mockReload = jest
        .fn()
        .mockResolvedValue({ id: 'vdev-uuid', ...createDto });
      mockLogicalVdevModel.findOne.mockResolvedValue(null); // No local pool naming duplicate
      mockStoragePoolModel.findByPk.mockResolvedValue({ id: 'pool-uuid' }); // Parent exists
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
      mockStoragePoolModel.findByPk.mockResolvedValue(null); // Simulated missing element

      await expect(service.create(createDto)).rejects.toThrow(
        new NotFoundException('StoragePool with ID pool-uuid not found'),
      );
    });
  });
});
