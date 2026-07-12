import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { StoragePoolService } from './storage-pool.service';
import { StoragePool, StoragePoolType } from './entities/storage-pool.entity';
import { Server } from '../server/entities/server.entity';
import { VirtualServer } from '../virtual-server/entities/virtual-server.entity';
import { PaginationService } from '../common/pagination/pagination.service';
import { CreateStoragePoolDto } from './dto/create-storage-pool.dto';
import { UpdateStoragePoolDto } from './dto/update-storage-pool.dto';

describe('StoragePoolService', () => {
  let service: StoragePoolService;
  let mockStoragePoolModel: any;
  let mockServerModel: any;
  let mockVirtualServerModel: any;
  let mockPaginationService: jest.Mocked<PaginationService>;

  beforeEach(async () => {
    mockStoragePoolModel = {
      findOne: jest.fn(),
      findByPk: jest.fn(),
      create: jest.fn(),
      destroy: jest.fn(),
    };
    mockServerModel = { findByPk: jest.fn() };
    mockVirtualServerModel = { findByPk: jest.fn() };
    mockPaginationService = { paginate: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoragePoolService,
        { provide: getModelToken(StoragePool), useValue: mockStoragePoolModel },
        { provide: getModelToken(Server), useValue: mockServerModel },
        {
          provide: getModelToken(VirtualServer),
          useValue: mockVirtualServerModel,
        },
        { provide: PaginationService, useValue: mockPaginationService },
      ],
    }).compile();

    service = module.get<StoragePoolService>(StoragePoolService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should cleanly delegate pagination logic to PaginationService', async () => {
      const mockQuery = { pageNumber: 1, pageSize: 10 };
      const expectedOutput = { data: [], meta: {} } as any;
      mockPaginationService.paginate.mockResolvedValue(expectedOutput);

      const result = await service.findAll(mockQuery);

      expect(result).toEqual(expectedOutput);
      expect(mockPaginationService.paginate).toHaveBeenCalledWith(
        mockStoragePoolModel,
        mockQuery,
        { include: [Server, VirtualServer] },
      );
    });
  });

  describe('create', () => {
    it('should successfully create a pool assigned cleanly to a physical server context', async () => {
      const createDto: CreateStoragePoolDto = {
        poolName: 'tank-nvme-cache',
        poolType: StoragePoolType.ZFS,
        serverId: 'server-uuid',
      };
      const mockReload = jest
        .fn()
        .mockResolvedValue({ id: 'pool-uuid', ...createDto });
      mockServerModel.findByPk.mockResolvedValue({ id: 'server-uuid' });
      mockStoragePoolModel.create.mockResolvedValue({
        id: 'pool-uuid',
        reload: mockReload,
      });

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(mockStoragePoolModel.create).toHaveBeenCalledWith(createDto);
    });

    it('should throw BadRequestException if target exclusivity violations occur (both present)', async () => {
      const invalidDto: CreateStoragePoolDto = {
        poolName: 'invalid-pool',
        poolType: StoragePoolType.BTRFS,
        serverId: 'server-uuid',
        virtualServerId: 'vs-uuid',
      };

      await expect(service.create(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if target exclusivity violations occur (both missing)', async () => {
      const invalidDto: CreateStoragePoolDto = {
        poolName: 'invalid-pool',
        poolType: StoragePoolType.BTRFS,
      };

      await expect(service.create(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if targeted physical server asset is missing', async () => {
      const createDto: CreateStoragePoolDto = {
        poolName: 'tank-nvme-cache',
        poolType: StoragePoolType.ZFS,
        serverId: 'missing-server-uuid',
      };
      mockServerModel.findByPk.mockResolvedValue(null); // Missing

      await expect(service.create(createDto)).rejects.toThrow(
        new NotFoundException('Server with ID missing-server-uuid not found'),
      );
    });
  });

  describe('update', () => {
    it('should throw BadRequestException if update actions attempt to assign both reference variables', async () => {
      const mockInstance = {
        id: 'pool-uuid',
        serverId: 'server-uuid',
        virtualServerId: null,
      };
      mockStoragePoolModel.findByPk.mockResolvedValue(mockInstance);

      const updateDto: UpdateStoragePoolDto = { virtualServerId: 'vs-uuid' }; // Attempting to add both

      await expect(service.update('pool-uuid', updateDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
