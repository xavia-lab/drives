import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { PhysicalDriveService } from './physical-drive.service';
import { PhysicalDrive } from './entities/physical-drive.entity';
import { StorageModel } from '../storage-model/entities/storage-model.entity';
import { Vendor } from '../vendor/entities/vendor.entity';
import { Currency } from '../currency/entities/currency.entity';
import { PaginationService } from '../common/pagination/pagination.service';
import { CreatePhysicalDriveDto } from './dto/create-physical-drive.dto';
import { UpdatePhysicalDriveDto } from './dto/update-physical-drive.dto';

describe('PhysicalDriveService', () => {
  let service: PhysicalDriveService;
  let mockPhysicalDriveRepo: any;
  let mockStorageModelRepo: any;
  let mockVendorRepo: any;
  let mockCurrencyRepo: any;
  let mockPaginationService: jest.Mocked<PaginationService>;

  beforeEach(async () => {
    // 1. Mock all 4 required Sequelize models
    mockPhysicalDriveRepo = {
      findOne: jest.fn(),
      findByPk: jest.fn(),
      create: jest.fn(),
      destroy: jest.fn(),
    };
    mockStorageModelRepo = { findByPk: jest.fn() };
    mockVendorRepo = { findByPk: jest.fn() };
    mockCurrencyRepo = { findByPk: jest.fn() };

    // 2. Mock the PaginationService
    mockPaginationService = { paginate: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PhysicalDriveService,
        {
          provide: getModelToken(PhysicalDrive),
          useValue: mockPhysicalDriveRepo,
        },
        {
          provide: getModelToken(StorageModel),
          useValue: mockStorageModelRepo,
        },
        { provide: getModelToken(Vendor), useValue: mockVendorRepo },
        { provide: getModelToken(Currency), useValue: mockCurrencyRepo },
        { provide: PaginationService, useValue: mockPaginationService },
      ],
    }).compile();

    service = module.get<PhysicalDriveService>(PhysicalDriveService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should cleanly delegate pagination logic to PaginationService', async () => {
      const mockQuery = { pageNumber: 1, pageSize: 10 };
      const expectedOutput = { data: [], meta: {} } as any;
      mockPaginationService.paginate.mockResolvedValue(expectedOutput);

      const result = await service.findAll(mockQuery);

      expect(result).toEqual(expectedOutput);
      expect(mockPaginationService.paginate).toHaveBeenCalledWith(
        mockPhysicalDriveRepo,
        mockQuery,
      );
    });
  });

  describe('findOne', () => {
    it('should successfully find and return a physical drive by ID', async () => {
      const mockDrive = { id: 'drive-1', serialNumber: 'S3X0NX0A123456' };
      mockPhysicalDriveRepo.findByPk.mockResolvedValue(mockDrive);

      const result = await service.findOne('drive-1');

      expect(result).toEqual(mockDrive);
      expect(mockPhysicalDriveRepo.findByPk).toHaveBeenCalledWith('drive-1');
    });
  });

  describe('create', () => {
    const createDto: CreatePhysicalDriveDto = {
      serialNumber: 'S3X0NX0A123456',
      worldwideNameWwn: 'wwn-12345',
      acquisitionCost: 150.0,
      purchaseDate: '2026-01-01',
      warrantyExpiryDate: '2031-01-01',
      storageModelId: 'sm-uuid',
      retailerVendorId: 'vendor-uuid',
      currencyId: 'currency-uuid',
    } as any;

    it('should successfully create a physical drive when serial number is unique and all keys exist', async () => {
      mockPhysicalDriveRepo.findOne.mockResolvedValue(null); // No serial number duplicate
      mockStorageModelRepo.findByPk.mockResolvedValue({ id: 'sm-uuid' });
      mockVendorRepo.findByPk.mockResolvedValue({ id: 'vendor-uuid' });
      mockCurrencyRepo.findByPk.mockResolvedValue({ id: 'currency-uuid' });
      mockPhysicalDriveRepo.create.mockResolvedValue({
        id: 'drive-1',
        ...createDto,
      });

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(mockPhysicalDriveRepo.create).toHaveBeenCalledWith({
        ...createDto,
      });
    });

    it('should throw ConflictException if the serial number already exists', async () => {
      mockPhysicalDriveRepo.findOne.mockResolvedValue({ id: 'existing-id' });

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockPhysicalDriveRepo.create).not.toHaveBeenCalled();
    });

    it('should aggregate multiple non-existent foreign keys into a single multiline NotFoundException', async () => {
      mockPhysicalDriveRepo.findOne.mockResolvedValue(null);
      // Simulate that StorageModel and Currency do not exist, while the Retailer Vendor does
      mockStorageModelRepo.findByPk.mockResolvedValue(null);
      mockVendorRepo.findByPk.mockResolvedValue({ id: 'vendor-uuid' });
      mockCurrencyRepo.findByPk.mockResolvedValue(null);

      const expectedErrorMessage = [
        'StorageModel with ID sm-uuid not found',
        'Currency with ID currency-uuid not found',
      ].join('\n');

      await expect(service.create(createDto)).rejects.toThrow(
        new NotFoundException(expectedErrorMessage),
      );
      expect(mockPhysicalDriveRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    const updateDto: UpdatePhysicalDriveDto = {
      serialNumber: 'NEW-SERIAL-123',
      retailerVendorId: 'missing-vendor-uuid',
    } as any;

    it('should successfully update field variables if inputs are unique and exist', async () => {
      const mockInstance = {
        id: 'drive-1',
        serialNumber: 'S3X0NX0A123456',
        update: jest.fn().mockResolvedValue(true),
      };
      mockPhysicalDriveRepo.findByPk.mockResolvedValue(mockInstance);
      mockPhysicalDriveRepo.findOne.mockResolvedValue(null); // No serial match conflict
      mockVendorRepo.findByPk.mockResolvedValue({ id: 'missing-vendor-uuid' });

      await service.update('drive-1', updateDto);

      expect(mockInstance.update).toHaveBeenCalledWith(
        expect.objectContaining({
          serialNumber: 'NEW-SERIAL-123',
          retailerVendorId: 'missing-vendor-uuid',
        }),
      );
    });

    it('should throw a combined exception if updated foreign keys are missing', async () => {
      const mockInstance = { id: 'drive-1', serialNumber: 'S3X0NX0A123456' };
      mockPhysicalDriveRepo.findByPk.mockResolvedValue(mockInstance);
      mockPhysicalDriveRepo.findOne.mockResolvedValue(null);
      mockVendorRepo.findByPk.mockResolvedValue(null); // Simulated missing element

      await expect(service.update('drive-1', updateDto)).rejects.toThrow(
        new NotFoundException(
          'Retailer Vendor with ID missing-vendor-uuid not found',
        ),
      );
    });
  });

  describe('delete', () => {
    it('should successfully delete a physical drive if it is found', async () => {
      const mockInstance = { id: 'drive-1' };
      mockPhysicalDriveRepo.findByPk.mockResolvedValue(mockInstance);
      mockPhysicalDriveRepo.destroy.mockResolvedValue(1);

      const result = await service.delete('drive-1');

      expect(result).toBe(true);
      expect(mockPhysicalDriveRepo.destroy).toHaveBeenCalledWith({
        where: { id: 'drive-1' },
      });
    });

    it('should throw NotFoundException if the drive to delete is missing', async () => {
      mockPhysicalDriveRepo.findByPk.mockResolvedValue(null);

      await expect(service.delete('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
