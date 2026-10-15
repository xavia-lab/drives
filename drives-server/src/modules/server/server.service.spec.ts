import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { NotFoundException } from '@nestjs/common';
import { ServerService } from './server.service';
import { Server } from './entities/server.entity';
import { CpuModel } from '../cpu-model/entities/cpu-model.entity';
import { OperatingSystem } from '../operating-system/entities/operating-system.entity';
import { Rack } from '../rack/entities/rack.entity';
import { PaginationService } from '../common/pagination/pagination.service';
import { CreateServerDto } from './dto/create-server.dto';
import {
  describe,
  it,
  expect,
  beforeEach,
  vi,
  type Mock,
  type Mocked,
} from 'vitest'; // 🚀 Pure ESM imports from Vitest

describe('ServerService', () => {
  let service: ServerService;

  // 🚀 Explicit Vitest mock types replace legacy configuration definitions
  let mockServerModel: Record<string, Mock>;
  let mockCpuModelModel: Record<string, Mock>;
  let mockOsModel: Record<string, Mock>;
  let mockRackModel: Record<string, Mock>;
  let mockPaginationService: Mocked<PaginationService>;

  beforeEach(async () => {
    // 1. Properly initialize all model instance mock objects using vi.fn()
    mockServerModel = {
      findOne: vi.fn(), // 🚀 Swapped out legacy jest.fn() with vitest vi.fn()
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
        ServerService,
        { provide: getModelToken(Server), useValue: mockServerModel },
        { provide: getModelToken(CpuModel), useValue: mockCpuModelModel },
        { provide: getModelToken(OperatingSystem), useValue: mockOsModel },
        { provide: getModelToken(Rack), useValue: mockRackModel },
        { provide: PaginationService, useValue: mockPaginationService },
      ],
    }).compile();

    service = module.get<ServerService>(ServerService);
    vi.clearAllMocks(); // 🚀 Using Vitest native mock reset pipeline utilities
  });

  describe('findAll', () => {
    it('should cleanly delegate pagination logic to PaginationService with correct relation inclusions', async () => {
      const mockQuery = { pageNumber: 1, pageSize: 10 };
      const expectedPaginatedOutput = { data: [], meta: {} } as unknown as {
        data: (Server & { itemNumber: number })[];
        meta: Record<string, unknown>;
      };
      mockPaginationService.paginate.mockResolvedValue(expectedPaginatedOutput);

      const result = await service.findAll(mockQuery);

      expect(result).toEqual(expectedPaginatedOutput);
      expect(mockPaginationService.paginate).toHaveBeenCalledWith(
        mockServerModel as unknown,
        mockQuery,
        { include: [CpuModel, OperatingSystem, Rack] },
      );
    });
  });

  describe('create', () => {
    const createDto: CreateServerDto = {
      hostname: 'us-east-compute-42.infra',
      totalRamMb: 524288,
      cpuModelId: 'cpu-uuid',
      cpuCount: 2,
      operatingSystemId: 'os-uuid',
      rackId: 'rack-uuid',
      rackUnitPosition: 22,
    };

    it('should successfully create and reload a server if input foreign keys exist and are unique', async () => {
      const mockReload = vi
        .fn()
        .mockResolvedValue({ id: 'srv-uuid', ...createDto });
      mockServerModel.findOne.mockResolvedValue(null);
      mockCpuModelModel.findByPk.mockResolvedValue({ id: 'cpu-uuid' });
      mockOsModel.findByPk.mockResolvedValue({ id: 'os-uuid' });
      mockRackModel.findByPk.mockResolvedValue({ id: 'rack-uuid' });
      mockServerModel.create.mockResolvedValue({
        id: 'srv-uuid',
        reload: mockReload,
      });

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(mockServerModel.create).toHaveBeenCalledWith(createDto);
      expect(mockReload).toHaveBeenCalledWith({
        include: [CpuModel, OperatingSystem, Rack],
      });
    });

    it('should aggregate multiple concurrently missing foreign keys into a single multiline NotFoundException', async () => {
      mockServerModel.findOne.mockResolvedValue(null);
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
