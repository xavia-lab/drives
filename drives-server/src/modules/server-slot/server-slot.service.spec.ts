import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ServerSlotService } from './server-slot.service';
import { ServerSlot } from './entities/server-slot.entity';
import { Server } from '../server/entities/server.entity';
import { Interface } from '../interface/entities/interface.entity';
import { PaginationService } from '../common/pagination/pagination.service';
import { CreateServerSlotDto } from './dto/create-server-slot.dto';
import { UpdateServerSlotDto } from './dto/update-warranty-claim.dto'; // or update-server-slot.dto.ts

describe('ServerSlotService', () => {
  let service: ServerSlotService;
  let mockServerSlotModel: any;
  let mockServerModel: any;
  let mockInterfaceModel: any;
  let mockPaginationService: jest.Mocked<PaginationService>;

  beforeEach(async () => {
    mockServerSlotModel = {
      findOne: jest.fn(),
      findByPk: jest.fn(),
      create: jest.fn(),
      destroy: jest.fn(),
    };
    mockServerModel = { findByPk: jest.fn() };
    mockInterfaceModel = { findByPk: jest.fn() };
    mockPaginationService = { paginate: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServerSlotService,
        { provide: getModelToken(ServerSlot), useValue: mockServerSlotModel },
        { provide: getModelToken(Server), useValue: mockServerModel },
        { provide: getModelToken(Interface), useValue: mockInterfaceModel },
        { provide: PaginationService, useValue: mockPaginationService },
      ],
    }).compile();

    service = module.get<ServerSlotService>(ServerSlotService);
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
        mockServerSlotModel,
        mockQuery,
        { include: [Server, Interface] },
      );
    });
  });

  describe('create', () => {
    const createDto: CreateServerSlotDto = {
      serverId: 'server-uuid',
      slotLabel: 'Bay 0',
      supportedInterfaceId: 'interface-uuid',
      pcieBusAddress: '0000:41:00.0',
    };

    it('should successfully create and reload a server slot if scope constraints are valid', async () => {
      const mockReload = jest
        .fn()
        .mockResolvedValue({ id: 'slot-uuid', ...createDto });
      mockServerSlotModel.findOne.mockResolvedValue(null); // No structural label duplicate
      mockServerModel.findByPk.mockResolvedValue({ id: 'server-uuid' });
      mockInterfaceModel.findByPk.mockResolvedValue({ id: 'interface-uuid' });
      mockServerSlotModel.create.mockResolvedValue({
        id: 'slot-uuid',
        reload: mockReload,
      });

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(mockServerSlotModel.create).toHaveBeenCalledWith(createDto);
      expect(mockReload).toHaveBeenCalledWith({ include: [Server, Interface] });
    });

    it('should throw ConflictException if the case faceplate slot label already exists on that server node', async () => {
      mockServerSlotModel.findOne.mockResolvedValue({ id: 'existing-id' });

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should aggregate multiple missing parent foreign keys into a single multiline NotFoundException', async () => {
      mockServerSlotModel.findOne.mockResolvedValue(null);
      mockServerModel.findByPk.mockResolvedValue(null); // Missing
      mockInterfaceModel.findByPk.mockResolvedValue(null); // Missing

      const expectedErrorMessage = [
        'Server with ID server-uuid not found',
        'Interface with ID interface-uuid not found',
      ].join('\n');

      await expect(service.create(createDto)).rejects.toThrow(
        new NotFoundException(expectedErrorMessage),
      );
    });
  });
});
