import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { BusProtocolService } from './bus-protocol.service';
import { BusProtocol } from './entities/bus-protocol.entity';
import { PaginationService } from '../common/pagination/pagination.service';
import { CreateBusProtocolDto } from './dto/create-bus-protocol.dto';
import { UpdateBusProtocolDto } from './dto/update-bus-protocol.dto';

describe('BusProtocolService', () => {
  let service: BusProtocolService;
  let mockBusProtocolModel: any;
  let mockPaginationService: jest.Mocked<PaginationService>;

  beforeEach(async () => {
    // 1. Mock the Sequelize Model Static Methods
    mockBusProtocolModel = {
      findOne: jest.fn(),
      findByPk: jest.fn(),
      create: jest.fn(),
      destroy: jest.fn(),
    };

    // 2. Mock the PaginationService
    mockPaginationService = {
      paginate: jest.fn(),
    } as any;

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
    jest.clearAllMocks();
  });

  describe('createBusProtocol', () => {
    const createDto: CreateBusProtocolDto = {
      name: 'NVMe',
      commandSet: 'NVMe',
      supportsHotPlug: true,
    };

    it('should successfully create a bus protocol if the name is unique', async () => {
      mockBusProtocolModel.findOne.mockResolvedValue(null); // No naming collision
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
        update: jest.fn().mockResolvedValue({
          id: 'uuid-1',
          name: 'NVMe-oF',
          commandSet: 'NVMe',
          supportsHotPlug: true,
        }),
      };
      mockBusProtocolModel.findByPk.mockResolvedValue(mockInstance);
      mockBusProtocolModel.findOne.mockResolvedValue(null); // No renaming conflict

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
      mockBusProtocolModel.destroy.mockResolvedValue(1); // 1 row removed

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
      const expectedPaginatedOutput = { data: [], meta: {} } as any;
      mockPaginationService.paginate.mockResolvedValue(expectedPaginatedOutput);

      const result = await service.findAll(mockQuery);

      expect(result).toEqual(expectedPaginatedOutput);
      expect(mockPaginationService.paginate).toHaveBeenCalledWith(
        mockBusProtocolModel,
        mockQuery,
      );
    });
  });
});
