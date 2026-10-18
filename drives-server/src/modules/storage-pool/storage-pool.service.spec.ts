import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { StoragePoolService } from './storage-pool.service';
import { StoragePool } from './entities/storage-pool.entity';
import { PhysicalServer } from '../physical-server/entities/physical-server.entity';
import { VirtualServer } from '../virtual-server/entities/virtual-server.entity';
import { PoolType } from '../pool-type/entities/pool-type.entity';
import { PaginationService } from '../common/pagination/pagination.service';
import { CreateStoragePoolDto } from './dto/create-storage-pool.dto';
import { UpdateStoragePoolDto } from './dto/update-storage-pool.dto';
import {
  describe,
  it,
  expect,
  beforeEach,
  vi,
  type Mock,
  type Mocked,
} from 'vitest'; // 🚀 Pure ESM imports from Vitest

describe('StoragePoolService', () => {
  let service: StoragePoolService;

  // 🚀 Explicit Vitest mock types replace legacy configuration definitions
  let mockStoragePoolModel: Record<string, Mock>;
  let mockPhysicalServerModel: Record<string, Mock>;
  let mockVirtualServerModel: Record<string, Mock>;
  let mockPoolTypeModel: Record<string, Mock>;
  let mockPaginationService: Mocked<PaginationService>;

  beforeEach(async () => {
    mockStoragePoolModel = {
      findOne: vi.fn(), // 🚀 Swapped out legacy jest.fn() with vitest vi.fn()
      findByPk: vi.fn(),
      create: vi.fn(),
      destroy: vi.fn(),
    };
    mockPhysicalServerModel = { findByPk: vi.fn() };
    mockVirtualServerModel = { findByPk: vi.fn() };
    mockPoolTypeModel = { findByPk: vi.fn() };

    mockPaginationService = {
      paginate: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoragePoolService,
        {
          provide: getModelToken(StoragePool),
          useValue: mockStoragePoolModel,
        },
        {
          provide: getModelToken(PhysicalServer),
          useValue: mockPhysicalServerModel,
        },
        {
          provide: getModelToken(VirtualServer),
          useValue: mockVirtualServerModel,
        },
        {
          provide: getModelToken(PoolType),
          useValue: mockPoolTypeModel,
        },
        { provide: PaginationService, useValue: mockPaginationService },
      ],
    }).compile();

    service = module.get<StoragePoolService>(StoragePoolService);
    vi.clearAllMocks(); // 🚀 Using Vitest native mock reset pipeline utilities
  });

  describe('findAll', () => {
    it('should cleanly delegate pagination logic to PaginationService with correct relation inclusions', async () => {
      const mockQuery = { pageNumber: 1, pageSize: 10 };
      const expectedPaginatedOutput = { data: [], meta: {} } as unknown as {
        data: StoragePool[];
        meta: Record<string, unknown>;
      };
      mockPaginationService.paginate.mockResolvedValue(expectedPaginatedOutput);

      const result = await service.findAll(mockQuery);

      expect(result).toEqual(expectedPaginatedOutput);
      expect(mockPaginationService.paginate).toHaveBeenCalledWith(
        mockStoragePoolModel as unknown,
        mockQuery,
        { include: [PhysicalServer, VirtualServer] },
      );
    });
  });

  describe('create', () => {
    const createDto: CreateStoragePoolDto = {
      poolName: 'tank',
      poolTypeId: 'pooltype-uuid',
      encryptionEnabled: true,
      serverId: 'server-uuid',
    };

    it('should successfully create and reload a storage pool if XOR target check passes and parent exists', async () => {
      const mockReload = vi
        .fn()
        .mockResolvedValue({ id: 'pool-uuid', ...createDto });
      mockPhysicalServerModel.findByPk.mockResolvedValue({ id: 'server-uuid' });
      mockPoolTypeModel.findByPk.mockResolvedValue({ id: 'pooltype-uuid' });
      mockStoragePoolModel.create.mockResolvedValue({
        id: 'pool-uuid',
        reload: mockReload,
      });

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(mockStoragePoolModel.create).toHaveBeenCalledWith(createDto);
      expect(mockReload).toHaveBeenCalledWith({
        include: [PhysicalServer, VirtualServer],
      });
    });

    it('should throw BadRequestException if both serverId and virtualServerId are assigned', async () => {
      const invalidDto: CreateStoragePoolDto = {
        ...createDto,
        virtualServerId: 'vm-uuid',
      };

      await expect(service.create(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if neither serverId nor virtualServerId is assigned', async () => {
      const invalidDto: CreateStoragePoolDto = {
        poolName: 'tank',
        poolTypeId: 'pooltype-uuid',
        encryptionEnabled: true,
      };

      await expect(service.create(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockStoragePoolModel.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if targeted physical server does not exist', async () => {
      mockPhysicalServerModel.findByPk.mockResolvedValue(null);
      mockPoolTypeModel.findByPk.mockResolvedValue({ id: 'pooltype-uuid' });

      await expect(service.create(createDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateDto: UpdateStoragePoolDto = {
      poolName: 'tank-updated',
    };

    it('should successfully update a storage pool when parent constraint targets exist', async () => {
      const mockInstance = {
        id: 'pool-uuid',
        serverId: 'server-uuid',
        virtualServerId: null,
        update: vi.fn().mockResolvedValue(true),
        reload: vi
          .fn()
          .mockResolvedValue({ id: 'pool-uuid', poolName: 'tank-updated' }),
      };
      mockStoragePoolModel.findByPk.mockResolvedValue(mockInstance);

      await service.update('pool-uuid', updateDto);

      expect(mockInstance.update).toHaveBeenCalledWith(
        expect.objectContaining({
          poolName: 'tank-updated',
        }),
      );
    });

    it('should allow moving a pool from a physical server to a virtual server', async () => {
      const mockInstance = {
        id: 'pool-uuid',
        serverId: 'server-uuid',
        virtualServerId: null,
        update: vi.fn().mockResolvedValue(true),
        reload: vi.fn().mockResolvedValue({ id: 'pool-uuid' }),
      };
      mockStoragePoolModel.findByPk.mockResolvedValue(mockInstance);
      mockVirtualServerModel.findByPk.mockResolvedValue({ id: 'vm-uuid' });

      await service.update('pool-uuid', {
        serverId: null,
        virtualServerId: 'vm-uuid',
      });

      expect(mockInstance.update).toHaveBeenCalledWith(
        expect.objectContaining({
          serverId: null,
          virtualServerId: 'vm-uuid',
        }),
      );
    });

    it('should allow moving a pool from a virtual server to a physical server', async () => {
      const mockInstance = {
        id: 'pool-uuid',
        serverId: null,
        virtualServerId: 'vm-uuid',
        update: vi.fn().mockResolvedValue(true),
        reload: vi.fn().mockResolvedValue({ id: 'pool-uuid' }),
      };
      mockStoragePoolModel.findByPk.mockResolvedValue(mockInstance);
      mockPhysicalServerModel.findByPk.mockResolvedValue({
        id: 'server-uuid',
      });

      await service.update('pool-uuid', {
        virtualServerId: null,
        serverId: 'server-uuid',
      });

      expect(mockInstance.update).toHaveBeenCalledWith(
        expect.objectContaining({
          serverId: 'server-uuid',
          virtualServerId: null,
        }),
      );
    });

    it('should throw BadRequestException when an update would assign both targets', async () => {
      const mockInstance = {
        id: 'pool-uuid',
        serverId: null,
        virtualServerId: 'vm-uuid',
        update: vi.fn().mockResolvedValue(true),
        reload: vi.fn().mockResolvedValue({ id: 'pool-uuid' }),
      };
      mockStoragePoolModel.findByPk.mockResolvedValue(mockInstance);

      await expect(
        service.update('pool-uuid', { serverId: 'server-uuid' }),
      ).rejects.toThrow(BadRequestException);
      expect(mockInstance.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when an update would remove both targets', async () => {
      const mockInstance = {
        id: 'pool-uuid',
        serverId: 'server-uuid',
        virtualServerId: null,
        update: vi.fn().mockResolvedValue(true),
        reload: vi.fn().mockResolvedValue({ id: 'pool-uuid' }),
      };
      mockStoragePoolModel.findByPk.mockResolvedValue(mockInstance);

      await expect(
        service.update('pool-uuid', { serverId: null }),
      ).rejects.toThrow(BadRequestException);
      expect(mockInstance.update).not.toHaveBeenCalled();
    });
  });
});
