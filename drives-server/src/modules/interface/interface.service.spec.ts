import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { InterfaceService } from './interface.service';
import { Interface } from './entities/interface.entity';
import { BusProtocol } from '../bus-protocol/entities/bus-protocol.entity';
import { PaginationService } from '../common/pagination/pagination.service';
import { CreateInterfaceDto } from './dto/create-interface.dto';
import { UpdateInterfaceDto } from './dto/update-interface.dto';

describe('InterfaceService', () => {
  let service: InterfaceService;
  let mockInterfaceModel: any;
  let mockBusProtocolModel: any;
  let mockPaginationService: jest.Mocked<PaginationService>;

  beforeEach(async () => {
    // 1. Mock both Sequelize models
    mockInterfaceModel = {
      findOne: jest.fn(),
      findByPk: jest.fn(),
      create: jest.fn(),
      destroy: jest.fn(),
    };

    mockBusProtocolModel = {
      findByPk: jest.fn(),
    };

    // 2. Mock the PaginationService
    mockPaginationService = {
      paginate: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InterfaceService,
        {
          provide: getModelToken(Interface),
          useValue: mockInterfaceModel,
        },
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

    service = module.get<InterfaceService>(InterfaceService);
    jest.clearAllMocks();
  });

  describe('createInterface', () => {
    const createDto: CreateInterfaceDto = {
      name: 'PCIe Gen 4 x4',
      linkGeneration: 4,
      throughput: 64,
      busProtocolId: 'bus-proto-uuid',
    };

    it('should successfully create an interface if the name is unique and foreign key exists', async () => {
      mockInterfaceModel.findOne.mockResolvedValue(null); // No naming collision
      mockBusProtocolModel.findByPk.mockResolvedValue({ id: 'bus-proto-uuid' }); // Foreign key exists
      mockInterfaceModel.create.mockResolvedValue({
        id: 'interface-uuid',
        ...createDto,
      });

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(mockInterfaceModel.create).toHaveBeenCalledWith({ ...createDto });
      expect(mockBusProtocolModel.findByPk).toHaveBeenCalledWith(
        'bus-proto-uuid',
      );
    });

    it('should throw ConflictException if interface name already exists', async () => {
      mockInterfaceModel.findOne.mockResolvedValue({
        id: 'existing-id',
        name: 'PCIe Gen 4 x4',
      });

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockInterfaceModel.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if the provided busProtocolId does not exist', async () => {
      mockInterfaceModel.findOne.mockResolvedValue(null);
      mockBusProtocolModel.findByPk.mockResolvedValue(null); // Simulated missing key

      await expect(service.create(createDto)).rejects.toThrow(
        new NotFoundException('BusProtocol with ID bus-proto-uuid not found'),
      );
      expect(mockInterfaceModel.create).not.toHaveBeenCalled();
    });
  });

  describe('updateInterface', () => {
    const updateDto: UpdateInterfaceDto = {
      name: 'PCIe Gen 5 x4',
      busProtocolId: 'new-bus-proto-uuid',
    };

    it('should successfully update a non-managed interface when target items exist', async () => {
      const mockInstance = {
        id: 'interface-uuid',
        managed: false,
        update: jest
          .fn()
          .mockResolvedValue({ id: 'interface-uuid', name: 'PCIe Gen 5 x4' }),
      };
      mockInterfaceModel.findByPk.mockResolvedValue(mockInstance);
      mockInterfaceModel.findOne.mockResolvedValue(null); // No name naming conflict
      mockBusProtocolModel.findByPk.mockResolvedValue({
        id: 'new-bus-proto-uuid',
      }); // New key exists

      await service.update('interface-uuid', updateDto);

      expect(mockInstance.update).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'PCIe Gen 5 x4',
          busProtocolId: 'new-bus-proto-uuid',
        }),
      );
    });

    it('should throw NotFoundException if the updated busProtocolId does not exist', async () => {
      const mockInstance = { id: 'interface-uuid', managed: false };
      mockInterfaceModel.findByPk.mockResolvedValue(mockInstance);
      mockInterfaceModel.findOne.mockResolvedValue(null);
      mockBusProtocolModel.findByPk.mockResolvedValue(null); // New key is missing

      await expect(service.update('interface-uuid', updateDto)).rejects.toThrow(
        new NotFoundException(
          'BusProtocol with ID new-bus-proto-uuid not found',
        ),
      );
    });

    it('should throw ConflictException when trying to update a system-managed interface', async () => {
      const mockInstance = { id: 'interface-uuid', managed: true };
      mockInterfaceModel.findByPk.mockResolvedValue(mockInstance);

      await expect(service.update('interface-uuid', updateDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('deleteInterface', () => {
    it('should successfully delete an interface if it is not managed', async () => {
      const mockInstance = { id: 'interface-uuid', managed: false };
      mockInterfaceModel.findByPk.mockResolvedValue(mockInstance);
      mockInterfaceModel.destroy.mockResolvedValue(1);

      const result = await service.delete('interface-uuid');

      expect(result).toBe(true);
      expect(mockInterfaceModel.destroy).toHaveBeenCalledWith({
        where: { id: 'interface-uuid' },
      });
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
        mockInterfaceModel,
        mockQuery,
      );
    });
  });
});
