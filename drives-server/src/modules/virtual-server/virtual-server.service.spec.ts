import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken, getConnectionToken } from '@nestjs/sequelize';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { VirtualServerService } from './virtual-server.service';
import { PassthroughSlotService } from './passthrough-slot.service';
import {
  MemoryUnit,
  VirtualServer,
  VirtualServerType,
} from './entities/virtual-server.entity';
import { PassthroughSlot } from './entities/passthrough-slot.entity';
import { PhysicalServer } from '../physical-server/entities/physical-server.entity';
import { ServerSlot } from '../physical-server/entities/server-slot.entity';
import { OperatingSystem } from '../operating-system/entities/operating-system.entity';
import { PaginationService } from '../pagination/pagination.service';
import { CreateVirtualServerDto } from './dto/create-virtual-server.dto';
import {
  describe,
  it,
  expect,
  beforeEach,
  vi,
  type Mock,
  type Mocked,
} from 'vitest'; // 🚀 Pure ESM imports from Vitest

const GIB = 1024 ** 3;

describe('VirtualServerService', () => {
  let service: VirtualServerService;

  // 🚀 Explicit Vitest mock types replace loose legacy configurations
  let mockVirtualServerModel: Record<string, Mock>;
  let mockPhysicalServerModel: Record<string, Mock>;
  let mockOsModel: Record<string, Mock>;
  let mockPaginationService: Mocked<PaginationService>;
  let mockPassthroughSlotService: Mocked<PassthroughSlotService>;
  let mockTransaction: { LOCK: { UPDATE: string } };
  let mockSequelize: { transaction: Mock };

  beforeEach(async () => {
    mockVirtualServerModel = {
      findOne: vi.fn(), // 🚀 Swapped out legacy jest.fn() with vitest vi.fn()
      findByPk: vi.fn(),
      create: vi.fn(),
      destroy: vi.fn(),
      sum: vi.fn(),
    };
    mockPhysicalServerModel = { findByPk: vi.fn() };
    mockOsModel = { findByPk: vi.fn() };

    mockPaginationService = {
      paginate: vi.fn(),
    };

    mockPassthroughSlotService = {
      syncForVirtualServer: vi.fn(),
    } as unknown as Mocked<PassthroughSlotService>;

    mockTransaction = { LOCK: { UPDATE: 'UPDATE' } };
    mockSequelize = {
      transaction: vi.fn((cb: (t: unknown) => unknown) => cb(mockTransaction)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VirtualServerService,
        {
          provide: getModelToken(VirtualServer),
          useValue: mockVirtualServerModel,
        },
        {
          provide: getModelToken(PhysicalServer),
          useValue: mockPhysicalServerModel,
        },
        { provide: getModelToken(OperatingSystem), useValue: mockOsModel },
        { provide: PaginationService, useValue: mockPaginationService },
        {
          provide: PassthroughSlotService,
          useValue: mockPassthroughSlotService,
        },
        { provide: getConnectionToken(), useValue: mockSequelize },
      ],
    }).compile();

    service = module.get<VirtualServerService>(VirtualServerService);
    vi.clearAllMocks(); // 🚀 Using Vitest native mock reset pipeline utilities
  });

  describe('findAll', () => {
    it('should cleanly delegate pagination logic to PaginationService with correct relation inclusions', async () => {
      const mockQuery = { pageNumber: 1, pageSize: 10 };
      const expectedPaginatedOutput = { data: [], meta: {} } as unknown as {
        data: VirtualServer[];
        meta: Record<string, unknown>;
      };
      mockPaginationService.paginate.mockResolvedValue(expectedPaginatedOutput);

      const result = await service.findAll(mockQuery);

      expect(result).toEqual(expectedPaginatedOutput);
      expect(mockPaginationService.paginate).toHaveBeenCalledWith(
        mockVirtualServerModel as unknown,
        mockQuery,
        {
          include: [
            PhysicalServer,
            OperatingSystem,
            {
              model: PassthroughSlot,
              include: [ServerSlot],
            },
          ],
        },
      );
    });
  });

  describe('create', () => {
    const createDto: CreateVirtualServerDto = {
      hostServerId: 'server-uuid',
      vmid: 101,
      hostname: 'truenas-core.local',
      type: VirtualServerType.VM,
      operatingSystemId: 'os-uuid',
      allocatedVcpus: 4,
      allocatedMemoryValue: 8,
      allocatedMemoryUnit: MemoryUnit.GiB,
    };

    it('should create inside a transaction, check capacity and reload relations', async () => {
      const reloaded = { id: 'vs-uuid', ...createDto };

      mockVirtualServerModel.findOne.mockResolvedValue(null);
      mockPhysicalServerModel.findByPk.mockResolvedValue({
        id: 'server-uuid',
        absoluteMemory: 32 * GIB,
      });
      mockOsModel.findByPk.mockResolvedValue({ id: 'os-uuid' });
      mockVirtualServerModel.sum.mockResolvedValue(0);
      mockVirtualServerModel.create.mockResolvedValue({ id: 'vs-uuid' });
      mockVirtualServerModel.findByPk.mockResolvedValue(reloaded);

      const result = await service.create(createDto);

      expect(result).toBe(reloaded);
      expect(mockVirtualServerModel.create).toHaveBeenCalledWith(createDto, {
        transaction: mockTransaction,
      });
      // Only active guests reserve host RAM.
      expect(mockVirtualServerModel.sum).toHaveBeenCalledWith(
        'absoluteAllocatedMemory',
        {
          where: { hostServerId: 'server-uuid', isActive: true },
          transaction: mockTransaction,
        },
      );
      expect(
        mockPassthroughSlotService.syncForVirtualServer,
      ).not.toHaveBeenCalled();
      expect(mockVirtualServerModel.findByPk).toHaveBeenCalledWith('vs-uuid', {
        include: [
          PhysicalServer,
          OperatingSystem,
          { model: PassthroughSlot, include: [ServerSlot] },
        ],
        transaction: mockTransaction,
      });
    });

    it('should sync passthrough slots when provided', async () => {
      const passthroughSlots = [{ id: 'ps-uuid', serverSlotId: 'slot-uuid' }];
      mockVirtualServerModel.findOne.mockResolvedValue(null);
      mockPhysicalServerModel.findByPk.mockResolvedValue({
        id: 'server-uuid',
        absoluteMemory: 32 * GIB,
      });
      mockOsModel.findByPk.mockResolvedValue({ id: 'os-uuid' });
      mockVirtualServerModel.sum.mockResolvedValue(0);
      mockVirtualServerModel.create.mockResolvedValue({ id: 'vs-uuid' });
      mockVirtualServerModel.findByPk.mockResolvedValue({ id: 'vs-uuid' });

      await service.create({ ...createDto, passthroughSlots });

      expect(mockVirtualServerModel.create).toHaveBeenCalledWith(createDto, {
        transaction: mockTransaction,
      });
      expect(
        mockPassthroughSlotService.syncForVirtualServer,
      ).toHaveBeenCalledWith(
        'vs-uuid',
        'server-uuid',
        passthroughSlots,
        mockTransaction,
      );
    });

    it('should throw ConflictException when the allocation exceeds host capacity', async () => {
      mockVirtualServerModel.findOne.mockResolvedValue(null);
      mockPhysicalServerModel.findByPk.mockResolvedValue({
        id: 'server-uuid',
        absoluteMemory: 32 * GIB,
      });
      mockOsModel.findByPk.mockResolvedValue({ id: 'os-uuid' });
      // Host already fully allocated -> any new request overflows.
      mockVirtualServerModel.sum.mockResolvedValue(32 * GIB);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockVirtualServerModel.create).not.toHaveBeenCalled();
    });

    it('should not count an inactive guest against host capacity', async () => {
      mockVirtualServerModel.findOne.mockResolvedValue(null);
      mockPhysicalServerModel.findByPk.mockResolvedValue({
        id: 'server-uuid',
        absoluteMemory: 32 * GIB,
      });
      mockOsModel.findByPk.mockResolvedValue({ id: 'os-uuid' });
      // Every active byte is spoken for, but the new guest is powered off and
      // therefore reserves nothing.
      mockVirtualServerModel.sum.mockResolvedValue(32 * GIB);
      mockVirtualServerModel.create.mockResolvedValue({ id: 'vs-uuid' });
      mockVirtualServerModel.findByPk.mockResolvedValue({ id: 'vs-uuid' });

      await expect(
        service.create({ ...createDto, isActive: false }),
      ).resolves.toEqual({ id: 'vs-uuid' });
      expect(mockVirtualServerModel.create).toHaveBeenCalled();
    });

    it('should reject passthrough slots for container guests', async () => {
      mockVirtualServerModel.findOne.mockResolvedValue(null);
      mockPhysicalServerModel.findByPk.mockResolvedValue({
        id: 'server-uuid',
        absoluteMemory: 32 * GIB,
      });
      mockOsModel.findByPk.mockResolvedValue({ id: 'os-uuid' });
      mockVirtualServerModel.sum.mockResolvedValue(0);

      await expect(
        service.create({
          ...createDto,
          type: VirtualServerType.CONTAINER,
          passthroughSlots: [{ id: 'ps-uuid', serverSlotId: 'slot-uuid' }],
        }),
      ).rejects.toThrow(BadRequestException);
      expect(mockVirtualServerModel.create).not.toHaveBeenCalled();
    });

    it('should reject a guest with more vCPUs than the host has threads', async () => {
      mockVirtualServerModel.findOne.mockResolvedValue(null);
      // Two 32-thread CPUs = 64 hardware threads.
      mockPhysicalServerModel.findByPk.mockResolvedValue({
        id: 'server-uuid',
        absoluteMemory: 32 * GIB,
        cpus: [{ cpuModel: { threads: 32 } }, { cpuModel: { threads: 32 } }],
      });
      mockOsModel.findByPk.mockResolvedValue({ id: 'os-uuid' });
      mockVirtualServerModel.sum.mockResolvedValue(0);

      await expect(
        service.create({ ...createDto, allocatedVcpus: 65 }),
      ).rejects.toThrow(ConflictException);
      expect(mockVirtualServerModel.create).not.toHaveBeenCalled();
    });

    it('should allow a guest with exactly the host thread count', async () => {
      mockVirtualServerModel.findOne.mockResolvedValue(null);
      mockPhysicalServerModel.findByPk.mockResolvedValue({
        id: 'server-uuid',
        absoluteMemory: 32 * GIB,
        cpus: [{ cpuModel: { threads: 32 } }, { cpuModel: { threads: 32 } }],
      });
      mockOsModel.findByPk.mockResolvedValue({ id: 'os-uuid' });
      mockVirtualServerModel.sum.mockResolvedValue(0);
      mockVirtualServerModel.create.mockResolvedValue({ id: 'vs-uuid' });
      mockVirtualServerModel.findByPk.mockResolvedValue({ id: 'vs-uuid' });

      await expect(
        service.create({ ...createDto, allocatedVcpus: 64 }),
      ).resolves.toEqual({ id: 'vs-uuid' });
    });

    it('should throw ConflictException if hostname already exists', async () => {
      mockVirtualServerModel.findOne.mockResolvedValue({ id: 'existing-id' });

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should aggregate multiple missing parent foreign keys into a single multiline NotFoundException', async () => {
      mockVirtualServerModel.findOne.mockResolvedValue(null);
      mockPhysicalServerModel.findByPk.mockResolvedValue(null);
      mockOsModel.findByPk.mockResolvedValue(null);

      const expectedErrorMessage = [
        'Host PhysicalServer with ID server-uuid not found',
        'OperatingSystem with ID os-uuid not found',
      ].join('\n');

      await expect(service.create(createDto)).rejects.toThrow(
        new NotFoundException(expectedErrorMessage),
      );
    });
  });

  describe('update', () => {
    const existing = {
      id: 'vs-uuid',
      hostServerId: 'server-uuid',
      type: VirtualServerType.VM,
      allocatedMemoryValue: 8,
      allocatedMemoryUnit: MemoryUnit.GiB,
      isActive: true,
      update: vi.fn().mockResolvedValue(undefined),
    };

    beforeEach(() => {
      mockPhysicalServerModel.findByPk.mockResolvedValue({
        id: 'server-uuid',
        absoluteMemory: 32 * GIB,
      });
      mockVirtualServerModel.sum.mockResolvedValue(0);
      mockVirtualServerModel.findByPk.mockResolvedValue(existing);
    });

    it('should reject passthrough slots when converting a guest to a container', async () => {
      await expect(
        service.update('vs-uuid', {
          type: VirtualServerType.CONTAINER,
          passthroughSlots: [{ id: 'ps-uuid', serverSlotId: 'slot-uuid' }],
        }),
      ).rejects.toThrow(BadRequestException);
      expect(existing.update).not.toHaveBeenCalled();
    });

    it('should clear passthrough slots when converting a guest to a container', async () => {
      await service.update('vs-uuid', {
        type: VirtualServerType.CONTAINER,
      });

      expect(
        mockPassthroughSlotService.syncForVirtualServer,
      ).toHaveBeenCalledWith('vs-uuid', 'server-uuid', [], mockTransaction);
    });

    it('should reject an update that exceeds the host thread count', async () => {
      mockVirtualServerModel.findByPk.mockResolvedValue({
        ...existing,
        allocatedVcpus: 4,
      });
      // Two 32-thread CPUs = 64 hardware threads.
      mockPhysicalServerModel.findByPk.mockResolvedValue({
        id: 'server-uuid',
        absoluteMemory: 32 * GIB,
        cpus: [{ cpuModel: { threads: 32 } }, { cpuModel: { threads: 32 } }],
      });

      await expect(
        service.update('vs-uuid', { allocatedVcpus: 65 }),
      ).rejects.toThrow(ConflictException);
      expect(existing.update).not.toHaveBeenCalled();
    });
  });
});
