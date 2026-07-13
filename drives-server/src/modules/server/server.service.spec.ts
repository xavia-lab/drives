import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ServerService } from './server.service';
import { Server } from './entities/server.entity';
import { CpuModel } from '../cpu-model/entities/cpu-model.entity';
import { OperatingSystem } from '../operating-system/entities/operating-system.entity';
import { Rack } from '../rack/entities/rack.entity';
import { PaginationService } from '../common/pagination/pagination.service';
import { CreateServerDto } from './dto/create-server.dto';
import { UpdateServerDto } from './dto/update-server.dto';

describe('ServerService', () => {
  let service: ServerService;
  let mockServerModel: any;
  let mockCpuModelModel: any;
  let mockOsModel: any;
  let mockRackModel: any;
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
    mockOsModel = { findByPk: jest.fn() }; // 🌟 This is the defined reference variable
    mockRackModel = { findByPk: jest.fn() };
    mockPaginationService = { paginate: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServerService,
        { provide: getModelToken(Server), useValue: mockServerModel },
        { provide: getModelToken(CpuModel), useValue: mockCpuModelModel },
        {
          provide: getModelToken(OperatingSystem),
          useValue: mockOsModel, // 🌟 Fix: Use the clean mock model variable reference
        },
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
      const expectedPaginatedOutput = { data: [], meta: {} } as any;
      mockPaginationService.paginate.mockResolvedValue(expectedPaginatedOutput);

      const result = await service.findAll(mockQuery);

      expect(result).toEqual(expectedPaginatedOutput);
      expect(mockPaginationService.paginate).toHaveBeenCalledWith(
        mockServerModel,
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

  describe('update', () => {
    const updateDto: UpdateServerDto = {
      hostname: 'new-host.infra',
      operatingSystemId: 'missing-os-uuid',
      rackId: 'missing-rack-uuid',
    };

    it('should throw an aggregated exception if updated foreign keys are not found', async () => {
      const mockInstance = {
        id: 'srv-uuid',
        hostname: 'us-east-compute-42.infra',
      };
      mockServerModel.findByPk.mockResolvedValue(mockInstance);
      mockServerModel.findOne.mockResolvedValue(null);
      mockOsModel.findByPk.mockResolvedValue(null); // Missing
      mockRackModel.findByPk.mockResolvedValue(null); // Missing

      const expectedErrorMessage = [
        'OperatingSystem with ID missing-os-uuid not found',
        'Rack with ID missing-rack-uuid not found',
      ].join('\n');

      await expect(service.update('srv-uuid', updateDto)).rejects.toThrow(
        new NotFoundException(expectedErrorMessage),
      );
    });
  });
});
