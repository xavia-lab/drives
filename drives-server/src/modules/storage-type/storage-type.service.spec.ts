import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { StorageTypeService } from './storage-type.service';
import { StorageType } from './entities/storage-type.entity';
import { PaginationService } from '../common/pagination/pagination.service';
import { CreateStorageTypeDto } from './dto/create-storage-type.dto';
import { UpdateStorageTypeDto } from './dto/update-storage-type.dto';
import {
  describe,
  it,
  expect,
  beforeEach,
  vi,
  type Mock,
  type Mocked,
} from 'vitest'; // 🚀 Pure ESM imports from Vitest

describe('StorageTypeService', () => {
  let service: StorageTypeService;

  // 🚀 Explicit Vitest mock types replace legacy configuration definitions
  let mockStorageTypeModel: Record<string, Mock>;
  let mockPaginationService: Mocked<PaginationService>;

  beforeEach(async () => {
    // 1. Mock the Sequelize Model Static Methods using vi.fn()
    mockStorageTypeModel = {
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
    vi.clearAllMocks(); // 🚀 Using Vitest native mock reset pipeline utilities
  });

  describe('createStorageType', () => {
    const createDto: CreateStorageTypeDto = {
      name: 'SSD',
      wearTrackable: true,
    };

    it('should successfully create a storage type if the name is unique', async () => {
      mockStorageTypeModel.findOne.mockResolvedValue(null);
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
        name: 'SSD',
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
        update: vi.fn().mockResolvedValue({
          id: 'uuid-1',
          name: 'NVMe SSD',
          wearTrackable: true,
        }),
      };
      mockStorageTypeModel.findByPk.mockResolvedValue(mockInstance);
      mockStorageTypeModel.findOne.mockResolvedValue(null);

      await service.updateStorageType('uuid-1', updateDto);

      expect(mockInstance.update).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'NVMe SSD',
          wearTrackable: true,
        }),
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
      mockStorageTypeModel.destroy.mockResolvedValue(1);

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
      const expectedPaginatedOutput = { data: [], meta: {} } as unknown as {
        data: StorageType[];
        meta: Record<string, unknown>;
      };
      mockPaginationService.paginate.mockResolvedValue(expectedPaginatedOutput);

      const result = await service.findAll(mockQuery);

      expect(result).toEqual(expectedPaginatedOutput);
      expect(mockPaginationService.paginate).toHaveBeenCalledWith(
        mockStorageTypeModel as unknown,
        mockQuery,
      );
    });
  });
});
