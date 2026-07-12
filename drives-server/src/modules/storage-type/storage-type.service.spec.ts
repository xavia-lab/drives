import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { StorageTypeService } from './storage-type.service';
import { StorageType } from './entities/storage-type.entity';
import { PaginationService } from '../common/pagination/pagination.service';
import { CreateStorageTypeDto } from './dto/create-storage-type.dto';
import { UpdateStorageTypeDto } from './dto/update-storage-type.dto';

describe('StorageTypeService', () => {
  let service: StorageTypeService;
  let mockStorageTypeModel: any;
  let mockPaginationService: jest.Mocked<PaginationService>;

  beforeEach(async () => {
    // 1. Mock the Sequelize Model Static Methods
    mockStorageTypeModel = {
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
        StorageTypeService,
        {
          provide: getModelToken(StorageType),
          useValue: mockStorageTypeModel,
        },
        {
          provide: PaginationService,
          useValue: mockPaginationService,
        },
      ],
    }).compile();

    service = module.get<StorageTypeService>(StorageTypeService);
    jest.clearAllMocks();
  });

  describe('createStorageType', () => {
    const createDto: CreateStorageTypeDto = { name: 'NAND Flash' };

    it('should successfully create a storage type if the name is unique', async () => {
      mockStorageTypeModel.findOne.mockResolvedValue(null); // No naming collision
      mockStorageTypeModel.create.mockResolvedValue({
        id: '019f4fa1-57db-72d7-b037-2f35d54f2794',
        ...createDto,
      });

      const result = await service.createStorageType(createDto);

      expect(result).toBeDefined();
      expect(mockStorageTypeModel.create).toHaveBeenCalledWith({
        ...createDto,
      });
    });

    it('should throw ConflictException if storage type name already exists', async () => {
      mockStorageTypeModel.findOne.mockResolvedValue({
        id: 'existing-id',
        name: 'NAND Flash',
      });

      await expect(service.createStorageType(createDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockStorageTypeModel.create).not.toHaveBeenCalled();
    });
  });

  describe('updateStorageType', () => {
    const updateDto: UpdateStorageTypeDto = {
      name: 'NVMe SSD',
      wearTrackable: true,
    };

    it('should successfully update a non-managed storage type', async () => {
      const mockInstance = {
        id: 'uuid-1',
        managed: false,
        update: jest.fn().mockResolvedValue({
          id: 'uuid-1',
          name: 'NVMe SSD',
          wearTrackable: true,
        }),
      };
      mockStorageTypeModel.findByPk.mockResolvedValue(mockInstance);
      mockStorageTypeModel.findOne.mockResolvedValue(null); // No renaming conflict

      await service.updateStorageType('uuid-1', updateDto);

      expect(mockInstance.update).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'NVMe SSD', wearTrackable: true }),
      );
    });

    it('should throw ConflictException when trying to update a system-managed storage type', async () => {
      const mockInstance = { id: 'uuid-1', managed: true };
      mockStorageTypeModel.findByPk.mockResolvedValue(mockInstance);

      await expect(
        service.updateStorageType('uuid-1', updateDto),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('deleteStorageType', () => {
    it('should successfully delete a storage type if it is not managed', async () => {
      const mockInstance = { id: 'uuid-1', managed: false };
      mockStorageTypeModel.findByPk.mockResolvedValue(mockInstance);
      mockStorageTypeModel.destroy.mockResolvedValue(1); // 1 row removed

      const result = await service.deleteStorageType('uuid-1');

      expect(result).toBe(true);
      expect(mockStorageTypeModel.destroy).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
      });
    });

    it('should throw NotFoundException if storage type to delete does not exist', async () => {
      mockStorageTypeModel.findByPk.mockResolvedValue(null);

      await expect(service.deleteStorageType('invalid-id')).rejects.toThrow(
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
        mockStorageTypeModel,
        mockQuery,
      );
    });
  });
});
