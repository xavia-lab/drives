import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken, getConnectionToken } from '@nestjs/sequelize';
import { NotFoundException } from '@nestjs/common';
import { PhysicalServerService } from './physical-server.service';
import { PhysicalServer } from '../entities/physical-server.entity';
import { PhysicalCpu } from '../../physical-cpu/entities/physical-cpu.entity';
import { CpuModel } from '../../cpu-model/entities/cpu-model.entity';
import { OperatingSystem } from '../../operating-system/entities/operating-system.entity';
import { Rack } from '../../rack/entities/rack.entity';
import { ServerSlot } from '../entities/server-slot.entity';
import { ServerSlotService } from './server-slot.service';
import { PaginationService } from '../../pagination/pagination.service';
import {
  CreatePhysicalServerDto,
  MemoryUnit,
} from '../dto/create-physical-server.dto';
import {
  describe,
  it,
  expect,
  beforeEach,
  vi,
  type Mock,
  type Mocked,
} from 'vitest';

describe('PhysicalServerService', () => {
  let service: PhysicalServerService;

  let mockPhysicalServerModel: Record<string, Mock>;
  let mockPhysicalCpuModel: Record<string, Mock>;
  let mockOsModel: Record<string, Mock>;
  let mockRackModel: Record<string, Mock>;
  let mockPaginationService: Mocked<PaginationService>;
  let mockServerSlotService: { syncForServer: Mock };
  let mockSequelize: { transaction: Mock };

  const readIncludes = [
    ServerSlot,
    { model: PhysicalCpu, include: [CpuModel] },
  ];

  beforeEach(async () => {
    mockPhysicalServerModel = {
      findOne: vi.fn(),
      findByPk: vi.fn(),
      create: vi.fn(),
      destroy: vi.fn(),
    };
    mockPhysicalCpuModel = { findAll: vi.fn(), update: vi.fn() };
    mockOsModel = { findByPk: vi.fn() };
    mockRackModel = { findByPk: vi.fn() };

    mockPaginationService = {
      paginate: vi.fn(),
    };

    mockServerSlotService = { syncForServer: vi.fn() };

    mockSequelize = {
      transaction: vi.fn((callback: (t: unknown) => unknown) =>
        callback('test-transaction'),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PhysicalServerService,
        {
          provide: getModelToken(PhysicalServer),
          useValue: mockPhysicalServerModel,
        },
        { provide: getModelToken(PhysicalCpu), useValue: mockPhysicalCpuModel },
        { provide: getModelToken(OperatingSystem), useValue: mockOsModel },
        { provide: getModelToken(Rack), useValue: mockRackModel },
        { provide: PaginationService, useValue: mockPaginationService },
        { provide: ServerSlotService, useValue: mockServerSlotService },
        { provide: getConnectionToken(), useValue: mockSequelize },
      ],
    }).compile();

    service = module.get<PhysicalServerService>(PhysicalServerService);
    vi.clearAllMocks();
  });

  describe('findAll', () => {
    it('should cleanly delegate pagination logic to PaginationService with children eager-loaded', async () => {
      const mockQuery = { pageNumber: 1, pageSize: 10 };
      const expectedPaginatedOutput = { data: [], meta: {} } as unknown as {
        data: PhysicalServer[];
        meta: Record<string, unknown>;
      };
      mockPaginationService.paginate.mockResolvedValue(expectedPaginatedOutput);

      const result = await service.findAll(mockQuery);

      expect(result).toEqual(expectedPaginatedOutput);
      expect(mockPaginationService.paginate).toHaveBeenCalledWith(
        mockPhysicalServerModel as unknown,
        mockQuery,
        { include: readIncludes },
      );
    });
  });

  describe('create', () => {
    const createDto: CreatePhysicalServerDto = {
      hostname: 'us-east-compute-42.infra',
      memoryValue: 512,
      memoryUnit: MemoryUnit.GiB,
      operatingSystemId: 'os-uuid',
      rackId: 'rack-uuid',
      rackUnitPosition: 22,
    };

    beforeEach(() => {
      mockPhysicalServerModel.findOne.mockResolvedValue(null);
      mockOsModel.findByPk.mockResolvedValue({ id: 'os-uuid' });
      mockRackModel.findByPk.mockResolvedValue({ id: 'rack-uuid' });
      mockPhysicalServerModel.create.mockResolvedValue({ id: 'srv-uuid' });
      mockPhysicalServerModel.findByPk.mockResolvedValue({
        id: 'srv-uuid',
        cpus: [],
        slots: [],
      });
    });

    it('should create a server inside a transaction and reload it with children', async () => {
      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(mockPhysicalServerModel.create).toHaveBeenCalledWith(createDto, {
        transaction: 'test-transaction',
      });
      expect(mockServerSlotService.syncForServer).not.toHaveBeenCalled();
      expect(mockPhysicalCpuModel.update).not.toHaveBeenCalled();
      expect(mockPhysicalServerModel.findByPk).toHaveBeenCalledWith(
        'srv-uuid',
        { include: readIncludes, transaction: 'test-transaction' },
      );
    });

    it('should persist nested slots within the same transaction', async () => {
      const slots = [
        {
          slotLabel: 'Bay 0',
          supportedInterfaceId: 'iface-uuid',
        },
      ];
      const dtoWithSlots: CreatePhysicalServerDto = { ...createDto, slots };

      await service.create(dtoWithSlots);

      expect(mockPhysicalServerModel.create).toHaveBeenCalledWith(createDto, {
        transaction: 'test-transaction',
      });
      expect(mockServerSlotService.syncForServer).toHaveBeenCalledWith(
        'srv-uuid',
        slots,
        'test-transaction',
      );
    });

    it('should assign the provided physical CPUs within the same transaction', async () => {
      mockPhysicalCpuModel.findAll.mockResolvedValue([
        { id: 'cpu-1', physicalServerId: null },
        { id: 'cpu-2', physicalServerId: null },
      ]);
      mockPhysicalCpuModel.update.mockResolvedValue([2]);

      const dtoWithCpus: CreatePhysicalServerDto = {
        ...createDto,
        cpuIds: ['cpu-1', 'cpu-2'],
      };

      await service.create(dtoWithCpus);

      expect(mockPhysicalServerModel.create).toHaveBeenCalledWith(createDto, {
        transaction: 'test-transaction',
      });
      expect(mockPhysicalCpuModel.update).toHaveBeenCalledWith(
        { physicalServerId: 'srv-uuid' },
        {
          where: { id: ['cpu-1', 'cpu-2'] },
          transaction: 'test-transaction',
        },
      );
    });

    it('should aggregate multiple concurrently missing foreign keys into a single multiline NotFoundException', async () => {
      mockOsModel.findByPk.mockResolvedValue(null);
      mockRackModel.findByPk.mockResolvedValue(null);

      const expectedErrorMessage = [
        'OperatingSystem with ID os-uuid not found',
        'Rack with ID rack-uuid not found',
      ].join('\n');

      await expect(service.create(createDto)).rejects.toThrow(
        new NotFoundException(expectedErrorMessage),
      );
      expect(mockSequelize.transaction).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should reconcile slots within the server transaction when slots are provided', async () => {
      const slots = [
        { id: 'slot-uuid', slotLabel: 'Bay 0', supportedInterfaceId: 'iface' },
      ];
      mockPhysicalServerModel.findByPk
        .mockResolvedValueOnce({ id: 'srv-uuid', update: vi.fn() })
        .mockResolvedValueOnce({ id: 'srv-uuid', cpus: [], slots });
      mockPhysicalServerModel.findOne.mockResolvedValue(null);

      const updateDto = { hostname: 'renamed.infra', slots };

      await service.update('srv-uuid', updateDto);

      expect(mockServerSlotService.syncForServer).toHaveBeenCalledWith(
        'srv-uuid',
        slots,
        'test-transaction',
      );
    });

    it('should leave slots untouched when the update payload omits them', async () => {
      mockPhysicalServerModel.findByPk
        .mockResolvedValueOnce({ id: 'srv-uuid', update: vi.fn() })
        .mockResolvedValueOnce({ id: 'srv-uuid', cpus: [], slots: [] });
      mockPhysicalServerModel.findOne.mockResolvedValue(null);

      await service.update('srv-uuid', { hostname: 'renamed.infra' });

      expect(mockServerSlotService.syncForServer).not.toHaveBeenCalled();
    });
  });
});
