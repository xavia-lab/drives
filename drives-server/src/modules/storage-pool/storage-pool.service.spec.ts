import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { StoragePoolService } from './storage-pool.service';
import { StoragePool } from './entities/storage-pool.entity';
import { Server } from '../server/entities/server.entity';
import { VirtualServer } from '../virtual-server/entities/virtual-server.entity';
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
  let mockServerModel: Record<string, Mock>;
  let mockVirtualServerModel: Record<string, Mock>;
  let mockPaginationService: Mocked<PaginationService>;

  beforeEach(async () => {
    mockStoragePoolModel = {
      findOne: vi.fn(), // 🚀 Swapped out legacy jest.fn() with vitest vi.fn()
      findByPk: vi.fn(),
      create: vi.fn(),
      destroy: vi.fn(),
    };
    mockServerModel = { findByPk: vi.fn() };
    mockVirtualServerModel = { findByPk: vi.fn() };

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
        { provide: getModelToken(Server), useValue: mockServerModel },
        {
          provide: getModelToken(VirtualServer),
          useValue: mockVirtualServerModel,
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
        data: (StoragePool & { itemNumber: number })[];
        meta: Record<string, unknown>;
      };
      mockPaginationService.paginate.mockResolvedValue(expectedPaginatedOutput);

      const result = await service.findAll(mockQuery);

      expect(result).toEqual(expectedPaginatedOutput);
      expect(mockPaginationService.paginate).toHaveBeenCalledWith(
        mockStoragePoolModel as unknown,
        mockQuery,
        { include: [Server, VirtualServer] },
      );
    });
  });

  describe('create', () => {
    const createDto: CreateStoragePoolDto = {
      poolName: 'tank',
      poolType: 'zfs',
      encryptionEnabled: true,
      serverId: 'server-uuid',
    };

    it('should successfully create and reload a storage pool if XOR target check passes and parent exists', async () => {
      const mockReload = vi
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
      expect(mockReload).toHaveBeenCalledWith({
        include: [Server, VirtualServer],
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

    it('should throw NotFoundException if targeted physical server does not exist', async () => {
      mockServerModel.findByPk.mockResolvedValue(null);

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
  });
});
