import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { StorageModelService } from './storage-model.service';
import { StorageModel } from './entities/storage-model.entity';
import { Capacity } from '../capacity/entities/capacity.entity';
import { FormFactor } from '../form-factor/entities/form-factor.entity';
import { Interface } from '../interface/entities/interface.entity';
import { Vendor } from '../vendor/entities/vendor.entity';
import { StorageType } from '../storage-type/entities/storage-type.entity';
import { PaginationService } from '../common/pagination/pagination.service';
import { CreateStorageModelDto } from './dto/create-storage-model.dto';
import { UpdateStorageModelDto } from './dto/update-storage-model.dto';

describe('StorageModelService', () => {
  let service: StorageModelService;
  let mockStorageModelRepo: any;
  let mockCapacityRepo: any;
  let mockFormFactorRepo: any;
  let mockInterfaceRepo: any;
  let mockVendorRepo: any;
  let mockStorageTypeRepo: any;
  let mockPaginationService: jest.Mocked<PaginationService>;

  beforeEach(async () => {
    // 1. Mock all 6 required Sequelize Models
    mockStorageModelRepo = {
      findOne: jest.fn(),
      findByPk: jest.fn(),
      create: jest.fn(),
      destroy: jest.fn(),
    };
    mockCapacityRepo = { findByPk: jest.fn() };
    mockFormFactorRepo = { findByPk: jest.fn() };
    mockInterfaceRepo = { findByPk: jest.fn() };
    mockVendorRepo = { findByPk: jest.fn() };
    mockStorageTypeRepo = { findByPk: jest.fn() };

    // 2. Mock PaginationService
    mockPaginationService = { paginate: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageModelService,
        {
          provide: getModelToken(StorageModel),
          useValue: mockStorageModelRepo,
        },
        { provide: getModelToken(Capacity), useValue: mockCapacityRepo },
        { provide: getModelToken(FormFactor), useValue: mockFormFactorRepo },
        { provide: getModelToken(Interface), useValue: mockInterfaceRepo },
        { provide: getModelToken(Vendor), useValue: mockVendorRepo },
        { provide: getModelToken(StorageType), useValue: mockStorageTypeRepo },
        { provide: PaginationService, useValue: mockPaginationService },
      ],
    }).compile();

    service = module.get<StorageModelService>(StorageModelService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateStorageModelDto = {
      name: '990 PRO',
      modelNumber: 'MZ-V9P1T0BW',
      maxEnduranceTbw: 600,
      capacityId: 'cap-1',
      formFactorId: 'ff-1',
      interfaceId: 'int-1',
      manufacturerId: 'mfg-1',
      storageTypeId: 'st-1',
    };

    it('should successfully create a storage model when name is unique and all IDs exist', async () => {
      // Arrange
      mockStorageModelRepo.findOne.mockResolvedValue(null); // No name/model duplicate
      mockCapacityRepo.findByPk.mockResolvedValue({ id: 'cap-1' });
      mockFormFactorRepo.findByPk.mockResolvedValue({ id: 'ff-1' });
      mockInterfaceRepo.findByPk.mockResolvedValue({ id: 'int-1' });
      mockVendorRepo.findByPk.mockResolvedValue({ id: 'mfg-1' });
      mockStorageTypeRepo.findByPk.mockResolvedValue({ id: 'st-1' });
      mockStorageModelRepo.create.mockResolvedValue({
        id: 'sm-1',
        ...createDto,
      });

      // Act
      const result = await service.create(createDto);

      // Assert
      expect(result).toBeDefined();
      expect(mockStorageModelRepo.create).toHaveBeenCalledWith({
        ...createDto,
      });
    });

    it('should throw ConflictException if the name and model number combo already exists', async () => {
      // Arrange
      mockStorageModelRepo.findOne.mockResolvedValue({ id: 'existing-id' });

      // Act & Assert
      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockStorageModelRepo.create).not.toHaveBeenCalled();
    });

    it('should aggregate multiple non-existent foreign keys into a single multiline NotFoundException', async () => {
      // Arrange
      mockStorageModelRepo.findOne.mockResolvedValue(null);
      // Simulate that Capacity and Interface do not exist, while others do
      mockCapacityRepo.findByPk.mockResolvedValue(null);
      mockFormFactorRepo.findByPk.mockResolvedValue({ id: 'ff-1' });
      mockInterfaceRepo.findByPk.mockResolvedValue(null);
      mockVendorRepo.findByPk.mockResolvedValue({ id: 'mfg-1' });
      mockStorageTypeRepo.findByPk.mockResolvedValue({ id: 'st-1' });

      // Act & Assert
      const expectedErrorMessage = [
        'Capacity with ID cap-1 not found',
        'Interface with ID int-1 not found',
      ].join('\n');

      await expect(service.create(createDto)).rejects.toThrow(
        new NotFoundException(expectedErrorMessage),
      );
      expect(mockStorageModelRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    const updateDto: UpdateStorageModelDto = {
      name: '990 PRO Evo',
      capacityId: 'cap-missing',
      storageTypeId: 'st-missing',
    };

    it('should throw a combined exception if updated foreign keys are not found', async () => {
      // Arrange
      const mockInstance = {
        id: 'sm-1',
        name: '990 PRO',
        modelNumber: 'MZ-V9P1T0BW',
        update: jest.fn(),
      };
      mockStorageModelRepo.findByPk.mockResolvedValue(mockInstance);
      mockStorageModelRepo.findOne.mockResolvedValue(null); // No name combo collision

      // Simulate missing entities for the update values
      mockCapacityRepo.findByPk.mockResolvedValue(null);
      mockStorageTypeRepo.findByPk.mockResolvedValue(null);

      // Act & Assert
      const expectedErrorMessage = [
        'Capacity with ID cap-missing not found',
        'StorageType with ID st-missing not found',
      ].join('\n');

      await expect(service.update('sm-1', updateDto)).rejects.toThrow(
        new NotFoundException(expectedErrorMessage),
      );
      expect(mockInstance.update).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should successfully delete a storage model if it is not managed', async () => {
      // Arrange
      const mockInstance = { id: 'sm-1' };
      mockStorageModelRepo.findByPk.mockResolvedValue(mockInstance);
      mockStorageModelRepo.destroy.mockResolvedValue(1);

      // Act
      const result = await service.delete('sm-1');

      // Assert
      expect(result).toBe(true);
      expect(mockStorageModelRepo.destroy).toHaveBeenCalledWith({
        where: { id: 'sm-1' },
      });
    });
  });

  describe('findAll', () => {
    it('should cleanly delegate pagination logic to PaginationService', async () => {
      // Arrange
      const mockQuery = { pageNumber: 1, pageSize: 10 };
      const expectedOutput = { data: [], meta: {} } as any;
      mockPaginationService.paginate.mockResolvedValue(expectedOutput);

      // Act
      const result = await service.findAll(mockQuery);

      // Assert
      expect(result).toEqual(expectedOutput);
      expect(mockPaginationService.paginate).toHaveBeenCalledWith(
        mockStorageModelRepo,
        mockQuery,
      );
    });
  });
});
