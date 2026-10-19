import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { BusProtocolService } from './bus-protocol.service';
import { BusProtocol } from './entities/bus-protocol.entity';
import { PaginationService } from '../pagination/pagination.service';
import { CreateBusProtocolDto } from './dto/create-bus-protocol.dto';
import { UpdateBusProtocolDto } from './dto/update-bus-protocol.dto';
import {
  describe,
  it,
  expect,
  beforeEach,
  vi,
  type Mock,
  type Mocked,
} from 'vitest'; // 🚀 Pure ESM imports from Vitest

describe('BusProtocolService', () => {
  let service: BusProtocolService;

  // 🚀 Explicit Vitest mock types replace legacy configuration definitions
  let mockBusProtocolModel: Record<string, Mock>;
  let mockPaginationService: Mocked<PaginationService>;

  beforeEach(async () => {
    // 1. Mock the Sequelize Model Static Methods using vi.fn()
    mockBusProtocolModel = {
      findOne: vi.fn(), // 🚀 Swapped out legacy jest.fn() with vitest vi.fn()
      findByPk: vi.fn(),
      create: vi.fn(),
      destroy: vi.fn(),
    };

    // 2. Mock the PaginationService using clear type boundaries
    mockPaginationService = {
      paginate: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BusProtocolService,
        {
          provide: getModelToken(BusProtocol),
          useValue: mockBusProtocolModel,
        },
        {
          provide: PaginationService,
          useValue: mockPaginationService,
        },
      ],
    }).compile();

    service = module.get<BusProtocolService>(BusProtocolService);
    vi.clearAllMocks(); // 🚀 Using Vitest native mock reset pipeline utilities
  });

  describe('createBusProtocol', () => {
    const createDto: CreateBusProtocolDto = {
      name: 'NVMe',
      commandSet: 'NVMe',
      supportsHotPlug: true,
    };

    it('should successfully create a bus protocol if the name is unique', async () => {
      mockBusProtocolModel.findOne.mockResolvedValue(null);
      mockBusProtocolModel.create.mockResolvedValue({
        id: '019f4fa1-57db-72d7-b037-2f35d54f2794',
        ...createDto,
      });

      const result = await service.createBusProtocol(createDto);

      expect(result).toBeDefined();
      expect(mockBusProtocolModel.create).toHaveBeenCalledWith({
        ...createDto,
      });
    });

    it('should throw ConflictException if bus protocol name already exists', async () => {
      mockBusProtocolModel.findOne.mockResolvedValue({
        id: 'existing-id',
        name: 'NVMe',
      });

      await expect(service.createBusProtocol(createDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockBusProtocolModel.create).not.toHaveBeenCalled();
    });
  });

  describe('updateBusProtocol', () => {
    const updateDto: UpdateBusProtocolDto = {
      name: 'NVMe-oF',
      commandSet: 'NVMe',
      supportsHotPlug: true,
    };

    it('should successfully update a non-managed bus protocol', async () => {
      const mockInstance = {
        id: 'uuid-1',
        managed: false,
        update: vi.fn().mockResolvedValue({
          id: 'uuid-1',
          name: 'NVMe-oF',
          commandSet: 'NVMe',
          supportsHotPlug: true,
        }),
      };
      mockBusProtocolModel.findByPk.mockResolvedValue(mockInstance);
      mockBusProtocolModel.findOne.mockResolvedValue(null);

      await service.updateBusProtocol('uuid-1', updateDto);

      expect(mockInstance.update).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'NVMe-oF',
          commandSet: 'NVMe',
          supportsHotPlug: true,
        }),
      );
    });

    it('should throw ConflictException when trying to update a system-managed bus protocol', async () => {
      const mockInstance = { id: 'uuid-1', managed: true };
      mockBusProtocolModel.findByPk.mockResolvedValue(mockInstance);

      await expect(
        service.updateBusProtocol('uuid-1', updateDto),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('deleteBusProtocol', () => {
    it('should successfully delete a bus protocol if it is not managed', async () => {
      const mockInstance = { id: 'uuid-1', managed: false };
      mockBusProtocolModel.findByPk.mockResolvedValue(mockInstance);
      mockBusProtocolModel.destroy.mockResolvedValue(1);

      const result = await service.deleteBusProtocol('uuid-1');

      expect(result).toBe(true);
      expect(mockBusProtocolModel.destroy).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
      });
    });

    it('should throw NotFoundException if bus protocol to delete does not exist', async () => {
      mockBusProtocolModel.findByPk.mockResolvedValue(null);

      await expect(service.deleteBusProtocol('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('should cleanly delegate pagination logic to PaginationService', async () => {
      const mockQuery = { pageNumber: 1, pageSize: 10 };
      const expectedPaginatedOutput = { data: [], meta: {} } as unknown as {
        data: unknown[];
        meta: Record<string, unknown>;
      };
      mockPaginationService.paginate.mockResolvedValue(expectedPaginatedOutput);

      const result = await service.findAll(mockQuery);

      expect(result).toEqual(expectedPaginatedOutput);
      expect(mockPaginationService.paginate).toHaveBeenCalledWith(
        mockBusProtocolModel as unknown,
        mockQuery,
      );
    });
  });
});
