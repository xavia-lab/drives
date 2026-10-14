import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { NotFoundException } from '@nestjs/common'; // Fixed: Removed unused ConflictException
import { ServerService } from './server.service';
import { Server } from './entities/server.entity';
import { CpuModel } from '../cpu-model/entities/cpu-model.entity';
import { OperatingSystem } from '../operating-system/entities/operating-system.entity';
import { Rack } from '../rack/entities/rack.entity';
import { PaginationService } from '../common/pagination/pagination.service';
import { CreateServerDto } from './dto/create-server.dto'; // Fixed: Removed unused UpdateServerDto

describe('ServerService', () => {
  let service: ServerService;

  // Fixed: Swapped loose 'any' definitions for typed mock records
  let mockServerModel: Record<string, jest.Mock>;
  let mockCpuModelModel: Record<string, jest.Mock>;
  let mockOsModel: Record<string, jest.Mock>;
  let mockRackModel: Record<string, jest.Mock>;
  let mockPaginationService: jest.Mocked<PaginationService>;

  beforeEach(async () => {
    // 1. Properly initialize all model instance mock objects
    mockServerModel = {
      findOne: jest.fn(),
      findByPk: jest.fn(),
      create: jest.fn(),
      destroy: jest.fn(),
    };
    mockCpuModelModel = { findByPk: jest.fn() };
    mockOsModel = { findByPk: jest.fn() };
    mockRackModel = { findByPk: jest.fn() };

    // Fixed: Replaced 'as any' with an explicit double-cast constraint
    mockPaginationService = {
      paginate: jest.fn(),
    } as unknown as jest.Mocked<PaginationService>;

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
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should cleanly delegate pagination logic to PaginationService with correct relation inclusions', async () => {
      const mockQuery = { pageNumber: 1, pageSize: 10 };
      // Fixed: Explicit structural type definition to satisfy return assignments
      const expectedPaginatedOutput = { data: [], meta: {} } as unknown as {
        data: (Server & { itemNumber: number })[];
        meta: Record<string, unknown>;
      };
      mockPaginationService.paginate.mockResolvedValue(expectedPaginatedOutput);

      const result = await service.findAll(mockQuery);

      expect(result).toEqual(expectedPaginatedOutput);
      expect(mockPaginationService.paginate).toHaveBeenCalledWith(
        mockServerModel as unknown as typeof Server,
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
      const mockReload = jest
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
      mockCpuModelModel.findByPk.mockResolvedValue(null); // Missing
      mockOsModel.findByPk.mockResolvedValue({ id: 'os-uuid' }); // Exists
      mockRackModel.findByPk.mockResolvedValue(null); // Missing

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
