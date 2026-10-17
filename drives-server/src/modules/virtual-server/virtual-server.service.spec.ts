import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { VirtualServerService } from './virtual-server.service';
import {
  VirtualServer,
  VirtualServerType,
} from './entities/virtual-server.entity';
import { PhysicalServer } from '../physical-server/entities/physical-server.entity';
import { OperatingSystem } from '../operating-system/entities/operating-system.entity';
import { PaginationService } from '../common/pagination/pagination.service';
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

describe('VirtualServerService', () => {
  let service: VirtualServerService;

  // 🚀 Explicit Vitest mock types replace loose legacy configurations
  let mockVirtualServerModel: Record<string, Mock>;
  let mockPhysicalServerModel: Record<string, Mock>;
  let mockOsModel: Record<string, Mock>;
  let mockPaginationService: Mocked<PaginationService>;

  beforeEach(async () => {
    mockVirtualServerModel = {
      findOne: vi.fn(), // 🚀 Swapped out legacy jest.fn() with vitest vi.fn()
      findByPk: vi.fn(),
      create: vi.fn(),
      destroy: vi.fn(),
    };
    mockPhysicalServerModel = { findByPk: vi.fn() };
    mockOsModel = { findByPk: vi.fn() };

    mockPaginationService = {
      paginate: vi.fn(),
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
        { include: [PhysicalServer, OperatingSystem] },
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
      allocatedRamMb: 8192,
    };

    it('should successfully create and reload a virtual server if all constraints pass and parents exist', async () => {
      const mockReload = vi
        .fn()
        .mockResolvedValue({ id: 'vs-uuid', ...createDto });

      mockVirtualServerModel.findOne.mockResolvedValue(null);
      mockPhysicalServerModel.findByPk.mockResolvedValue({ id: 'server-uuid' });
      mockOsModel.findByPk.mockResolvedValue({ id: 'os-uuid' });
      mockVirtualServerModel.create.mockResolvedValue({
        id: 'vs-uuid',
        reload: mockReload,
      });

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(mockVirtualServerModel.create).toHaveBeenCalledWith(createDto);
      expect(mockReload).toHaveBeenCalledWith({
        include: [PhysicalServer, OperatingSystem],
      });
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
});
