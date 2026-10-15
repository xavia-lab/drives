import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ServerSlotService } from './server-slot.service';
import { ServerSlot } from './entities/server-slot.entity';
import { Server } from '../server/entities/server.entity';
import { Interface } from '../interface/entities/interface.entity';
import { PaginationService } from '../common/pagination/pagination.service';
import { CreateServerSlotDto } from './dto/create-server-slot.dto';
import {
  describe,
  it,
  expect,
  beforeEach,
  vi,
  type Mock,
  type Mocked,
} from 'vitest'; // 🚀 Pure ESM imports from Vitest

describe('ServerSlotService', () => {
  let service: ServerSlotService;

  // 🚀 Explicit Vitest mock types replace legacy configuration definitions
  let mockServerSlotModel: Record<string, Mock>;
  let mockServerModel: Record<string, Mock>;
  let mockInterfaceModel: Record<string, Mock>;
  let mockPaginationService: Mocked<PaginationService>;

  beforeEach(async () => {
    mockServerSlotModel = {
      findOne: vi.fn(), // 🚀 Swapped out legacy jest.fn() with vitest vi.fn()
      findByPk: vi.fn(),
      create: vi.fn(),
      destroy: vi.fn(),
    };
    mockServerModel = { findByPk: vi.fn() };
    mockInterfaceModel = { findByPk: vi.fn() };

    mockPaginationService = {
      paginate: vi.fn(),
    };

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
    vi.clearAllMocks(); // 🚀 Using Vitest native mock reset pipeline utilities
  });

  describe('findAll', () => {
    it('should cleanly delegate pagination logic to PaginationService with correct relation inclusions', async () => {
      const mockQuery = { pageNumber: 1, pageSize: 10 };
      const expectedPaginatedOutput = { data: [], meta: {} } as unknown as {
        data: (ServerSlot & { itemNumber: number })[];
        meta: Record<string, unknown>;
      };
      mockPaginationService.paginate.mockResolvedValue(expectedPaginatedOutput);

      const result = await service.findAll(mockQuery);

      expect(result).toEqual(expectedPaginatedOutput);
      expect(mockPaginationService.paginate).toHaveBeenCalledWith(
        mockServerSlotModel as unknown,
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
      const mockReload = vi
        .fn()
        .mockResolvedValue({ id: 'slot-uuid', ...createDto });
      mockServerSlotModel.findOne.mockResolvedValue(null);
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

    it('should throw an aggregated multiline NotFoundException if multiple foreign keys are missing', async () => {
      mockServerSlotModel.findOne.mockResolvedValue(null);
      mockServerModel.findByPk.mockResolvedValue(null);
      mockInterfaceModel.findByPk.mockResolvedValue(null);

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
