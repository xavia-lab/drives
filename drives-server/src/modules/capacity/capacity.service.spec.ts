import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CapacityService } from './capacity.service';
import { Capacity } from './entities/capacity.entity';
import { PaginationService } from '../common/pagination/pagination.service';
import { CreateCapacityDto } from './dto/create-capacity.dto';
import { UpdateCapacityDto } from './dto/update-capacity.dto';

describe('CapacityService', () => {
  let service: CapacityService;
  let mockCapacityModel: any;
  let mockPaginationService: jest.Mocked<PaginationService>;

  beforeEach(async () => {
    // 1. Mock the Sequelize Model Static Methods
    mockCapacityModel = {
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
        CapacityService,
        {
          provide: getModelToken(Capacity),
          useValue: mockCapacityModel,
        },
        {
          provide: PaginationService,
          useValue: mockPaginationService,
        },
      ],
    }).compile();

    service = module.get<CapacityService>(CapacityService);
    jest.clearAllMocks();
  });

  describe('createCapacity', () => {
    const createDto: CreateCapacityDto = { name: '1 TB', value: 1, unit: 'TB' };

    it('should successfully create a capacity if the name is unique', async () => {
      mockCapacityModel.findOne.mockResolvedValue(null); // No naming collision
      mockCapacityModel.create.mockResolvedValue({
        id: '019f4fa1-57db-72d7-b037-2f35d54f2794',
        ...createDto,
      });

      const result = await service.createCapacity(createDto);

      expect(result).toBeDefined();
      expect(mockCapacityModel.create).toHaveBeenCalledWith({ ...createDto });
    });

    it('should throw ConflictException if capacity name already exists', async () => {
      mockCapacityModel.findOne.mockResolvedValue({
        id: 'existing-id',
        name: '1 TB',
      });

      await expect(service.createCapacity(createDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockCapacityModel.create).not.toHaveBeenCalled();
    });
  });

  describe('updateCapacity', () => {
    const updateDto: UpdateCapacityDto = { name: '2 TB', value: 2, unit: 'TB' };

    it('should successfully update a non-managed capacity', async () => {
      const mockInstance = {
        id: 'uuid-1',
        managed: false,
        update: jest.fn().mockResolvedValue({
          id: 'uuid-1',
          name: '2 TB',
          value: 2,
          unit: 'TB',
        }),
      };
      mockCapacityModel.findByPk.mockResolvedValue(mockInstance);
      mockCapacityModel.findOne.mockResolvedValue(null); // No renaming conflict

      await service.updateCapacity('uuid-1', updateDto);

      expect(mockInstance.update).toHaveBeenCalledWith(
        expect.objectContaining({ name: '2 TB', value: 2, unit: 'TB' }),
      );
    });

    it('should throw ConflictException when trying to update a system-managed capacity', async () => {
      const mockInstance = { id: 'uuid-1', managed: true };
      mockCapacityModel.findByPk.mockResolvedValue(mockInstance);

      await expect(service.updateCapacity('uuid-1', updateDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('deleteCapacity', () => {
    it('should successfully delete a capacity if it is not managed', async () => {
      // Arrange
      const mockInstance = { id: 'uuid-1', managed: false };
      mockCapacityModel.findByPk.mockResolvedValue(mockInstance);

      // 🌟 Fix: Set the resolved value cleanly on the capacity mock model
      mockCapacityModel.destroy.mockResolvedValue(1);

      // Act
      const result = await service.deleteCapacity('uuid-1');

      // Assert
      expect(result).toBe(true);
      expect(mockCapacityModel.destroy).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
      });
    });

    it('should throw NotFoundException if capacity to delete does not exist', async () => {
      mockCapacityModel.findByPk.mockResolvedValue(null);

      await expect(service.deleteCapacity('invalid-id')).rejects.toThrow(
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
        mockCapacityModel,
        mockQuery,
      );
    });
  });
});
