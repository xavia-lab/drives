import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { VirtualServerService } from './virtual-server.service';
import {
  VirtualServer,
  VirtualServerType,
} from './entities/virtual-server.entity';
import { Server } from '../server/entities/server.entity';
import { OperatingSystem } from '../operating-system/entities/operating-system.entity';
import { PaginationService } from '../common/pagination/pagination.service';
import { CreateVirtualServerDto } from './dto/create-virtual-server.dto';

describe('VirtualServerService', () => {
  let service: VirtualServerService;
  // Fixed: Swapped out loose 'any' definitions for typed mock records
  let mockVirtualServerModel: Record<string, jest.Mock>;
  let mockServerModel: Record<string, jest.Mock>;
  let mockOsModel: Record<string, jest.Mock>;
  let mockPaginationService: jest.Mocked<PaginationService>;

  beforeEach(async () => {
    mockVirtualServerModel = {
      findOne: jest.fn(),
      findByPk: jest.fn(),
      create: jest.fn(),
      destroy: jest.fn(),
    };
    mockServerModel = { findByPk: jest.fn() };
    mockOsModel = { findByPk: jest.fn() };

    // Fixed: Replaced 'as any' with an explicit double-cast constraint
    mockPaginationService = {
      paginate: jest.fn(),
    } as unknown as jest.Mocked<PaginationService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VirtualServerService,
        {
          provide: getModelToken(VirtualServer),
          useValue: mockVirtualServerModel,
        },
        { provide: getModelToken(Server), useValue: mockServerModel },
        { provide: getModelToken(OperatingSystem), useValue: mockOsModel },
        { provide: PaginationService, useValue: mockPaginationService },
      ],
    }).compile();

    service = module.get<VirtualServerService>(VirtualServerService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should cleanly delegate pagination logic to PaginationService with correct relation inclusions', async () => {
      const mockQuery = { pageNumber: 1, pageSize: 10 };
      // Fixed: Explicit structural type definition to satisfy return assignments
      const expectedPaginatedOutput = { data: [], meta: {} } as unknown as {
        data: (VirtualServer & { itemNumber: number })[];
        meta: Record<string, unknown>;
      };
      mockPaginationService.paginate.mockResolvedValue(expectedPaginatedOutput);

      const result = await service.findAll(mockQuery);

      expect(result).toEqual(expectedPaginatedOutput);
      expect(mockPaginationService.paginate).toHaveBeenCalledWith(
        mockVirtualServerModel as unknown as typeof VirtualServer,
        mockQuery,
        { include: [Server, OperatingSystem] },
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
      const mockReload = jest
        .fn()
        .mockResolvedValue({ id: 'vs-uuid', ...createDto });
      mockVirtualServerModel.findOne.mockResolvedValue(null); // No hostname or VMID duplicates
      mockServerModel.findByPk.mockResolvedValue({ id: 'server-uuid' });
      mockOsModel.findByPk.mockResolvedValue({ id: 'os-uuid' });
      mockVirtualServerModel.create.mockResolvedValue({
        id: 'vs-uuid',
        reload: mockReload,
      });

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(mockVirtualServerModel.create).toHaveBeenCalledWith(createDto);
      expect(mockReload).toHaveBeenCalledWith({
        include: [Server, OperatingSystem],
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
      mockServerModel.findByPk.mockResolvedValue(null); // Missing
      mockOsModel.findByPk.mockResolvedValue(null); // Missing

      const expectedErrorMessage = [
        'Host Server with ID server-uuid not found',
        'OperatingSystem with ID os-uuid not found',
      ].join('\n');

      await expect(service.create(createDto)).rejects.toThrow(
        new NotFoundException(expectedErrorMessage),
      );
    });
  });
});
