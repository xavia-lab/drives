import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { DriveModelService } from './drive-model.service';
import { DriveModel } from './entities/drive-model.entity';
import { Capacity } from '../capacity/entities/capacity.entity';
import { FormFactor } from '../form-factor/entities/form-factor.entity';
import { Interface } from '../interface/entities/interface.entity';
import { Vendor } from '../vendor/entities/vendor.entity';
import { StorageType } from '../storage-type/entities/storage-type.entity';
import { PaginationService } from '../pagination/pagination.service';
import { CreateDriveModelDto } from './dto/create-drive-model.dto';
import {
  describe,
  it,
  expect,
  beforeEach,
  vi,
  type Mock,
  type Mocked,
} from 'vitest'; // 🚀 Pure ESM imports from Vitest

describe('DriveModelService', () => {
  let service: DriveModelService;

  // 🚀 Swapped loose jest.Mock definitions for Vitest Mock records
  let mockDriveModelModel: Record<string, Mock>;
  let mockCapacityModel: Record<string, Mock>;
  let mockFormFactorModel: Record<string, Mock>;
  let mockInterfaceModel: Record<string, Mock>;
  let mockVendorModel: Record<string, Mock>;
  let mockStorageTypeModel: Record<string, Mock>;
  let mockPaginationService: Mocked<PaginationService>;

  beforeEach(async () => {
    mockDriveModelModel = {
      findOne: vi.fn(), // 🚀 Using Vitest vi.fn() mock engine trackers
      findByPk: vi.fn(),
      create: vi.fn(),
      destroy: vi.fn(),
    };
    mockCapacityModel = { findByPk: vi.fn() };
    mockFormFactorModel = { findByPk: vi.fn() };
    mockInterfaceModel = { findByPk: vi.fn() };
    mockVendorModel = { findByPk: vi.fn() };
    mockStorageTypeModel = { findByPk: vi.fn() };

    mockPaginationService = {
      paginate: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DriveModelService,
        {
          provide: getModelToken(DriveModel),
          useValue: mockDriveModelModel,
        },
        { provide: getModelToken(Capacity), useValue: mockCapacityModel },
        { provide: getModelToken(FormFactor), useValue: mockFormFactorModel },
        { provide: getModelToken(Interface), useValue: mockInterfaceModel },
        { provide: getModelToken(Vendor), useValue: mockVendorModel },
        { provide: getModelToken(StorageType), useValue: mockStorageTypeModel },
        { provide: PaginationService, useValue: mockPaginationService },
      ],
    }).compile();

    service = module.get<DriveModelService>(DriveModelService);
    vi.clearAllMocks(); // 🚀 Clean call history tracking using Vitest clear hook
  });

  describe('create', () => {
    const createDto: CreateDriveModelDto = {
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
      mockDriveModelModel.findOne.mockResolvedValue(null);
      mockCapacityModel.findByPk.mockResolvedValue({ id: 'capacity-uuid' });
      mockFormFactorModel.findByPk.mockResolvedValue({ id: 'formfactor-uuid' });
      mockInterfaceModel.findByPk.mockResolvedValue({ id: 'interface-uuid' });
      mockVendorModel.findByPk.mockResolvedValue({ id: 'vendor-uuid' });
      mockStorageTypeModel.findByPk.mockResolvedValue({
        id: 'storagetype-uuid',
      });

      mockDriveModelModel.create.mockResolvedValue({
        id: 'model-uuid',
        ...createDto,
      });

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(mockDriveModelModel.create).toHaveBeenCalledWith(createDto);
    });

    it('should throw ConflictException if model name and number combo already exists', async () => {
      mockDriveModelModel.findOne.mockResolvedValue({ id: 'existing-id' });

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockDriveModelModel.create).not.toHaveBeenCalled();
    });

    it('should aggregate missing relation references into a single NotFoundException', async () => {
      mockDriveModelModel.findOne.mockResolvedValue(null);
      mockCapacityModel.findByPk.mockResolvedValue(null);
      mockFormFactorModel.findByPk.mockResolvedValue({ id: 'formfactor-uuid' });
      mockInterfaceModel.findByPk.mockResolvedValue(null);
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
