import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { NotFoundException } from '@nestjs/common';
import { PhysicalServerService } from './physical-server.service';
import { PhysicalServer } from './entities/physical-server.entity';
import { CpuModel } from '../cpu-model/entities/cpu-model.entity';
import { OperatingSystem } from '../operating-system/entities/operating-system.entity';
import { Rack } from '../rack/entities/rack.entity';
import { PaginationService } from '../common/pagination/pagination.service';
import {
  CreatePhysicalServerDto,
  MemoryUnit,
} from './dto/create-physical-server.dto';
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
  let mockCpuModelModel: Record<string, Mock>;
  let mockOsModel: Record<string, Mock>;
  let mockRackModel: Record<string, Mock>;
  let mockPaginationService: Mocked<PaginationService>;

  beforeEach(async () => {
    mockPhysicalServerModel = {
      findOne: vi.fn(),
      findByPk: vi.fn(),
      create: vi.fn(),
      destroy: vi.fn(),
    };
    mockCpuModelModel = { findByPk: vi.fn() };
    mockOsModel = { findByPk: vi.fn() };
    mockRackModel = { findByPk: vi.fn() };

    mockPaginationService = {
      paginate: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PhysicalServerService,
        {
          provide: getModelToken(PhysicalServer),
          useValue: mockPhysicalServerModel,
        },
        { provide: getModelToken(CpuModel), useValue: mockCpuModelModel },
        { provide: getModelToken(OperatingSystem), useValue: mockOsModel },
        { provide: getModelToken(Rack), useValue: mockRackModel },
        { provide: PaginationService, useValue: mockPaginationService },
      ],
    }).compile();

    service = module.get<PhysicalServerService>(PhysicalServerService);
    vi.clearAllMocks();
  });

  describe('findAll', () => {
    it('should cleanly delegate pagination logic to PaginationService', async () => {
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
      );
    });
  });

  describe('create', () => {
    const createDto: CreatePhysicalServerDto = {
      hostname: 'us-east-compute-42.infra',
      memoryValue: 512,
      memoryUnit: MemoryUnit.GiB,
      cpuModelId: 'cpu-uuid',
      cpuCount: 2,
      operatingSystemId: 'os-uuid',
      rackId: 'rack-uuid',
      rackUnitPosition: 22,
    };

    it('should successfully create a physical server if input foreign keys exist and are unique', async () => {
      mockPhysicalServerModel.findOne.mockResolvedValue(null);
      mockCpuModelModel.findByPk.mockResolvedValue({ id: 'cpu-uuid' });
      mockOsModel.findByPk.mockResolvedValue({ id: 'os-uuid' });
      mockRackModel.findByPk.mockResolvedValue({ id: 'rack-uuid' });
      mockPhysicalServerModel.create.mockResolvedValue({
        id: 'srv-uuid',
        ...createDto,
      });

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(mockPhysicalServerModel.create).toHaveBeenCalledWith(createDto);
    });

    it('should aggregate multiple concurrently missing foreign keys into a single multiline NotFoundException', async () => {
      mockPhysicalServerModel.findOne.mockResolvedValue(null);
      mockCpuModelModel.findByPk.mockResolvedValue(null);
      mockOsModel.findByPk.mockResolvedValue({ id: 'os-uuid' });
      mockRackModel.findByPk.mockResolvedValue(null);

      const expectedErrorMessage = [
        'CpuModel with ID cpu-uuid not found',
        'Rack with ID rack-uuid not found',
      ].join('\n');

      await expect(service.create(createDto)).rejects.toThrow(
        new NotFoundException(expectedErrorMessage),
      );
    });
  });
});
