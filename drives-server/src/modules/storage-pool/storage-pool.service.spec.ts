import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken, getConnectionToken } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { StoragePoolService } from './storage-pool.service';
import { StoragePool } from './entities/storage-pool.entity';
import { StoragePoolHost } from './entities/storage-pool-host.entity';
import { PhysicalServer } from '../physical-server/entities/physical-server.entity';
import { VirtualServer } from '../virtual-server/entities/virtual-server.entity';
import { PoolType } from '../pool-type/entities/pool-type.entity';
import { PaginationService } from '../pagination/pagination.service';
import { LogicalVdevService } from '../logical-vdev/logical-vdev.service';
import { StorageTopologyService } from '../storage-topology/storage-topology.service';
import { CreateStoragePoolDto } from './dto/create-storage-pool.dto';
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
  let mockStoragePoolHostModel: Record<string, Mock>;
  let mockPhysicalServerModel: Record<string, Mock>;
  let mockVirtualServerModel: Record<string, Mock>;
  let mockPoolTypeModel: Record<string, Mock>;
  let mockPaginationService: Mocked<PaginationService>;
  let mockLogicalVdevService: { getPoolMemberDriveIds: Mock };
  let mockStorageTopology: { getAccessibleDriveIdsForHost: Mock };
  let mockTransaction: { LOCK: { UPDATE: string } };
  let mockSequelize: { transaction: Mock };

  beforeEach(async () => {
    mockStoragePoolModel = {
      findOne: vi.fn(),
      findByPk: vi.fn(),
      findAll: vi.fn(),
      create: vi.fn(),
      destroy: vi.fn(),
    };
    mockStoragePoolHostModel = {
      findOne: vi.fn(),
      findAll: vi.fn(),
      create: vi.fn(),
    };
    mockPhysicalServerModel = { findByPk: vi.fn() };
    mockVirtualServerModel = { findByPk: vi.fn() };
    mockPoolTypeModel = { findByPk: vi.fn() };

    mockPaginationService = {
      paginate: vi.fn(),
    };
    mockLogicalVdevService = {
      getPoolMemberDriveIds: vi.fn().mockResolvedValue([]),
    };
    mockStorageTopology = {
      getAccessibleDriveIdsForHost: vi.fn().mockResolvedValue(new Set()),
    };

    mockTransaction = { LOCK: { UPDATE: 'UPDATE' } };
    mockSequelize = {
      transaction: vi.fn((cb: (t: unknown) => unknown) => cb(mockTransaction)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoragePoolService,
        {
          provide: getModelToken(StoragePool),
          useValue: mockStoragePoolModel,
        },
        {
          provide: getModelToken(StoragePoolHost),
          useValue: mockStoragePoolHostModel,
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
        {
          provide: getConnectionToken(),
          useValue: mockSequelize,
        },
        { provide: PaginationService, useValue: mockPaginationService },
        { provide: LogicalVdevService, useValue: mockLogicalVdevService },
        { provide: StorageTopologyService, useValue: mockStorageTopology },
      ],
    }).compile();

    service = module.get<StoragePoolService>(StoragePoolService);
    vi.clearAllMocks(); // 🚀 Using Vitest native mock reset pipeline utilities
  });

  const hostEvent = (overrides: Record<string, unknown> = {}) => ({
    id: 'event-uuid',
    displayKey: 1,
    storagePoolId: 'pool-uuid',
    eventType: 'IMPORT',
    eventTimestamp: new Date('2026-07-01T00:00:00.000Z'),
    notes: null,
    physicalServerId: 'server-uuid',
    virtualServerId: null,
    physicalServer: { hostname: 'ash-storage-01' },
    virtualServer: null,
    ...overrides,
  });

  describe('findAll', () => {
    it('derives the current host for every page row', async () => {
      const rowOne = { id: 'pool-1', setDataValue: vi.fn() };
      const rowTwo = { id: 'pool-2', setDataValue: vi.fn() };
      mockPaginationService.paginate.mockResolvedValue({
        data: [rowOne, rowTwo],
        meta: {},
      });
      mockStoragePoolHostModel.findAll.mockResolvedValue([
        hostEvent({ storagePoolId: 'pool-1' }),
      ]);

      await service.findAll({ pageNumber: 1, pageSize: 10 });

      expect(mockPaginationService.paginate).toHaveBeenCalledWith(
        mockStoragePoolModel as unknown,
        { pageNumber: 1, pageSize: 10 },
        {},
      );
      expect(rowOne.setDataValue).toHaveBeenCalledWith('currentHost', {
        type: 'PHYSICAL',
        serverId: 'server-uuid',
        hostname: 'ash-storage-01',
      });
      expect(rowTwo.setDataValue).toHaveBeenCalledWith('currentHost', null);
    });
  });

  describe('findOne', () => {
    it('derives currentHost from the chronologically latest event even when returned unordered', async () => {
      const setDataValue = vi.fn();
      const newestImport = hostEvent({
        id: 'event-newest',
        displayKey: 5,
        eventTimestamp: new Date('2026-07-02T11:00:00.000Z'),
        physicalServerId: 'compute-uuid',
        physicalServer: { hostname: 'ash-compute-01' },
      });
      const exportEvent = hostEvent({
        id: 'event-export',
        displayKey: 4,
        eventType: 'EXPORT',
        eventTimestamp: new Date('2026-07-02T10:00:00.000Z'),
      });
      const olderImport = hostEvent({
        id: 'event-oldest',
        displayKey: 3,
        eventTimestamp: new Date('2026-07-02T08:00:00.000Z'),
      });
      // Deliberately unordered, mirroring the bug where Sequelize ignored the
      // include-level `order`.
      mockStoragePoolModel.findByPk.mockResolvedValue({
        id: 'pool-uuid',
        hosts: [newestImport, exportEvent, olderImport],
        setDataValue,
      });

      await service.findOne('pool-uuid');

      expect(setDataValue).toHaveBeenCalledWith('currentHost', {
        type: 'PHYSICAL',
        serverId: 'compute-uuid',
        hostname: 'ash-compute-01',
      });
      expect(setDataValue).toHaveBeenCalledWith('hosts', [
        olderImport,
        exportEvent,
        newestImport,
      ]);
    });
  });

  describe('create', () => {
    const createDto: CreateStoragePoolDto = {
      poolName: 'tank',
      poolTypeId: 'pooltype-uuid',
      encryptionEnabled: true,
    };

    beforeEach(() => {
      mockPoolTypeModel.findByPk.mockResolvedValue({ id: 'pooltype-uuid' });
      mockStoragePoolModel.create.mockResolvedValue({ id: 'pool-uuid' });
      mockStoragePoolModel.findByPk.mockResolvedValue({
        id: 'pool-uuid',
        hosts: [],
        setDataValue: vi.fn(),
      });
    });

    it('creates a detached pool without any host event', async () => {
      await service.create(createDto);

      expect(mockStoragePoolModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          poolName: 'tank',
          poolTypeId: 'pooltype-uuid',
          encryptionEnabled: true,
        }),
        { transaction: mockTransaction },
      );
      expect(mockStoragePoolHostModel.create).not.toHaveBeenCalled();
    });

    it('records an initial IMPORT when a host is supplied', async () => {
      mockPhysicalServerModel.findByPk.mockResolvedValue({ id: 'server-uuid' });

      await service.create({ ...createDto, serverId: 'server-uuid' });

      expect(mockStoragePoolHostModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          storagePoolId: 'pool-uuid',
          physicalServerId: 'server-uuid',
          virtualServerId: null,
          eventType: 'IMPORT',
        }),
        { transaction: mockTransaction },
      );
    });

    it('rejects a duplicate pool name regardless of case', async () => {
      mockStoragePoolModel.findOne.mockResolvedValue({ id: 'other-pool' });

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockStoragePoolModel.create).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when both host kinds are supplied', async () => {
      await expect(
        service.create({
          ...createDto,
          serverId: 'server-uuid',
          virtualServerId: 'vm-uuid',
        }),
      ).rejects.toThrow(BadRequestException);
      expect(mockStoragePoolModel.create).not.toHaveBeenCalled();
    });

    it('throws NotFoundException if the targeted physical server does not exist', async () => {
      mockPhysicalServerModel.findByPk.mockResolvedValue(null);

      await expect(
        service.create({ ...createDto, serverId: 'server-uuid' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates scalar columns and reloads the timeline', async () => {
      const mockInstance = {
        id: 'pool-uuid',
        update: vi.fn().mockResolvedValue(true),
      };
      mockStoragePoolModel.findByPk
        .mockResolvedValueOnce(mockInstance)
        .mockResolvedValueOnce({
          id: 'pool-uuid',
          hosts: [],
          setDataValue: vi.fn(),
        });

      await service.update('pool-uuid', {
        poolName: 'tank-updated',
      });

      expect(mockInstance.update).toHaveBeenCalledWith(
        expect.objectContaining({ poolName: 'tank-updated' }),
      );
    });
  });

  describe('importPool', () => {
    it('appends an IMPORT event when the pool is detached', async () => {
      mockStoragePoolModel.findByPk.mockResolvedValue({ id: 'pool-uuid' });
      mockPhysicalServerModel.findByPk.mockResolvedValue({ id: 'server-uuid' });
      mockStoragePoolHostModel.findOne.mockResolvedValue(null);
      mockStoragePoolHostModel.create.mockResolvedValue({});
      mockStoragePoolModel.findByPk
        .mockResolvedValueOnce({ id: 'pool-uuid' })
        .mockResolvedValueOnce({
          id: 'pool-uuid',
          hosts: [],
          setDataValue: vi.fn(),
        });

      await service.importPool('pool-uuid', { serverId: 'server-uuid' });

      expect(mockStoragePoolHostModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          storagePoolId: 'pool-uuid',
          physicalServerId: 'server-uuid',
          eventType: 'IMPORT',
        }),
        { transaction: mockTransaction },
      );
    });

    it('throws ConflictException when the pool is already attached', async () => {
      mockStoragePoolModel.findByPk.mockResolvedValue({ id: 'pool-uuid' });
      mockStoragePoolHostModel.findOne.mockResolvedValue(
        hostEvent({ storagePoolId: 'pool-uuid' }),
      );

      await expect(
        service.importPool('pool-uuid', { serverId: 'server-uuid' }),
      ).rejects.toThrow(ConflictException);
      expect(mockStoragePoolHostModel.create).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when no host is provided', async () => {
      mockStoragePoolModel.findByPk.mockResolvedValue({ id: 'pool-uuid' });

      await expect(service.importPool('pool-uuid', {})).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('exportPool', () => {
    it('appends an EXPORT event for the current host', async () => {
      mockStoragePoolModel.findByPk.mockResolvedValue({ id: 'pool-uuid' });
      mockStoragePoolHostModel.findOne.mockResolvedValue(
        hostEvent({ storagePoolId: 'pool-uuid' }),
      );
      mockStoragePoolHostModel.create.mockResolvedValue({});
      mockStoragePoolModel.findByPk
        .mockResolvedValueOnce({ id: 'pool-uuid' })
        .mockResolvedValueOnce({
          id: 'pool-uuid',
          hosts: [],
          setDataValue: vi.fn(),
        });

      await service.exportPool('pool-uuid', {});

      expect(mockStoragePoolHostModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          storagePoolId: 'pool-uuid',
          physicalServerId: 'server-uuid',
          eventType: 'EXPORT',
        }),
        { transaction: mockTransaction },
      );
    });

    it('throws ConflictException when the pool is detached', async () => {
      mockStoragePoolModel.findByPk.mockResolvedValue({ id: 'pool-uuid' });
      mockStoragePoolHostModel.findOne.mockResolvedValue({
        eventType: 'EXPORT',
      });

      await expect(service.exportPool('pool-uuid', {})).rejects.toThrow(
        ConflictException,
      );
      expect(mockStoragePoolHostModel.create).not.toHaveBeenCalled();
    });
  });

  describe('findAttached', () => {
    it('returns only pools whose latest event attaches them to the host', async () => {
      // First call: candidate pool ids that ever referenced the host.
      mockStoragePoolHostModel.findAll.mockResolvedValueOnce([
        { storagePoolId: 'pool-1' },
        { storagePoolId: 'pool-2' },
      ]);
      // Second call (getCurrentHostMap): the current host per candidate.
      mockStoragePoolHostModel.findAll.mockResolvedValueOnce([
        hostEvent({ storagePoolId: 'pool-1' }),
        hostEvent({
          storagePoolId: 'pool-2',
          eventType: 'EXPORT',
        }),
      ]);
      const poolOne = { id: 'pool-1', setDataValue: vi.fn() };
      mockStoragePoolModel.findAll.mockResolvedValue([poolOne]);

      const result = await service.findAttached({
        physicalServerId: 'server-uuid',
      });

      expect(mockStoragePoolHostModel.findAll).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          where: { physicalServerId: 'server-uuid' },
          attributes: ['storagePoolId'],
        }),
      );
      expect(mockStoragePoolModel.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: { [Op.in]: ['pool-1'] } },
        }),
      );
      expect(result).toEqual([poolOne]);
    });

    it('throws BadRequestException when no host id is provided', async () => {
      await expect(service.findAttached({})).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('delete', () => {
    it('destroys the pool when it exists', async () => {
      mockStoragePoolModel.findByPk.mockResolvedValue({ id: 'pool-uuid' });
      mockStoragePoolModel.destroy.mockResolvedValue(1);

      await expect(service.delete('pool-uuid')).resolves.toBe(true);
    });

    it('throws NotFoundException when the pool does not exist', async () => {
      mockStoragePoolModel.findByPk.mockResolvedValue(null);

      await expect(service.delete('pool-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
