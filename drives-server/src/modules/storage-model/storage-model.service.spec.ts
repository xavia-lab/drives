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

describe('StorageModelService', () => {
  let service: StorageModelService;

  // Fixed: Swapped loose 'any' definitions for typed mock records
  let mockStorageModelModel: Record<string, jest.Mock>;
  let mockCapacityModel: Record<string, jest.Mock>;
  let mockFormFactorModel: Record<string, jest.Mock>;
  let mockInterfaceModel: Record<string, jest.Mock>;
  let mockVendorModel: Record<string, jest.Mock>;
  let mockStorageTypeModel: Record<string, jest.Mock>;
  let mockPaginationService: jest.Mocked<PaginationService>;

  beforeEach(async () => {
    mockStorageModelModel = {
      findOne: jest.fn(),
      findByPk: jest.fn(),
      create: jest.fn(),
      destroy: jest.fn(),
    };
    mockCapacityModel = { findByPk: jest.fn() };
    mockFormFactorModel = { findByPk: jest.fn() };
    mockInterfaceModel = { findByPk: jest.fn() };
    mockVendorModel = { findByPk: jest.fn() };
    mockStorageTypeModel = { findByPk: jest.fn() };

    // Fixed: Replaced 'as any' with an explicit double-cast constraint
    mockPaginationService = {
      paginate: jest.fn(),
    } as unknown as jest.Mocked<PaginationService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageModelService,
        {
          provide: getModelToken(StorageModel),
          useValue: mockStorageModelModel,
        },
        { provide: getModelToken(Capacity), useValue: mockCapacityModel },
        { provide: getModelToken(FormFactor), useValue: mockFormFactorModel },
        { provide: getModelToken(Interface), useValue: mockInterfaceModel },
        { provide: getModelToken(Vendor), useValue: mockVendorModel },
        { provide: getModelToken(StorageType), useValue: mockStorageTypeModel },
        { provide: PaginationService, useValue: mockPaginationService },
      ],
    }).compile();

    service = module.get<StorageModelService>(StorageModelService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateStorageModelDto = {
      name: 'FireCuda 530',
      modelNumber: 'ZP2000GM3A013',
      maxEnduranceTbw: 2550,
      capacityId: 'capacity-uuid',
      formFactorId: 'formfactor-uuid',
      interfaceId: 'interface-uuid',
      manufacturerId: 'vendor-uuid',
      storageTypeId: 'storagetype-uuid',
    };

    it('should successfully create a storage model if unique checks and foreign keys pass', async () => {
      mockStorageModelModel.findOne.mockResolvedValue(null);
      mockCapacityModel.findByPk.mockResolvedValue({ id: 'capacity-uuid' });
      mockFormFactorModel.findByPk.mockResolvedValue({ id: 'formfactor-uuid' });
      mockInterfaceModel.findByPk.mockResolvedValue({ id: 'interface-uuid' });
      mockVendorModel.findByPk.mockResolvedValue({ id: 'vendor-uuid' });
      mockStorageTypeModel.findByPk.mockResolvedValue({
        id: 'storagetype-uuid',
      });

      mockStorageModelModel.create.mockResolvedValue({
        id: 'model-uuid',
        ...createDto,
      });

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(mockStorageModelModel.create).toHaveBeenCalledWith(createDto);
    });

    it('should throw ConflictException if model name and number combo already exists', async () => {
      mockStorageModelModel.findOne.mockResolvedValue({ id: 'existing-id' });

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockStorageModelModel.create).not.toHaveBeenCalled();
    });

    it('should aggregate missing relation references into a single NotFoundException', async () => {
      mockStorageModelModel.findOne.mockResolvedValue(null);
      mockCapacityModel.findByPk.mockResolvedValue(null); // Missing
      mockFormFactorModel.findByPk.mockResolvedValue({ id: 'formfactor-uuid' });
      mockInterfaceModel.findByPk.mockResolvedValue(null); // Missing
      mockVendorModel.findByPk.mockResolvedValue({ id: 'vendor-uuid' });
      mockStorageTypeModel.findByPk.mockResolvedValue({
        id: 'storagetype-uuid',
      });

      const expectedErrorMessage = [
        'Capacity with ID capacity-uuid not found',
        'Interface with ID interface-uuid not found',
      ].join('\n');

      await expect(service.create(createDto)).rejects.toThrow(
        new NotFoundException(expectedErrorMessage),
      );
    });
  });
});
