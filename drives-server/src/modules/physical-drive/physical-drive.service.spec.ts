import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { PhysicalDriveService } from './physical-drive.service';
import { PhysicalDrive } from './entities/physical-drive.entity';
import { DriveModel } from '../drive-model/entities/drive-model.entity';
import { Vendor } from '../vendor/entities/vendor.entity';
import { Currency } from '../currency/entities/currency.entity';
import { PaginationService } from '../common/pagination/pagination.service';
import { CreatePhysicalDriveDto } from './dto/create-physical-drive.dto';
import { UpdatePhysicalDriveDto } from './dto/update-physical-drive.dto';
import {
  describe,
  it,
  expect,
  beforeEach,
  vi,
  type Mock,
  type Mocked,
} from 'vitest'; // 🚀 Pure ESM imports from Vitest

describe('PhysicalDriveService', () => {
  let service: PhysicalDriveService;

  // 🚀 Explicit Vitest mock types replace legacy configuration definitions
  let mockPhysicalDriveRepo: Record<string, Mock>;
  let mockDriveModelRepo: Record<string, Mock>;
  let mockVendorRepo: Record<string, Mock>;
  let mockCurrencyRepo: Record<string, Mock>;
  let mockPaginationService: Mocked<PaginationService>;

  beforeEach(async () => {
    // 1. Mock all 4 required Sequelize models using vi.fn()
    mockPhysicalDriveRepo = {
      findOne: vi.fn(), // 🚀 Swapped out legacy jest.fn() with vitest vi.fn()
      findByPk: vi.fn(),
      create: vi.fn(),
      destroy: vi.fn(),
    };
    mockDriveModelRepo = { findByPk: vi.fn() };
    mockVendorRepo = { findByPk: vi.fn() };
    mockCurrencyRepo = { findByPk: vi.fn() };

    // 2. Mock the PaginationService using clear type boundaries
    mockPaginationService = {
      paginate: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PhysicalDriveService,
        {
          provide: getModelToken(PhysicalDrive),
          useValue: mockPhysicalDriveRepo,
        },
        {
          provide: getModelToken(DriveModel),
          useValue: mockDriveModelRepo,
        },
        { provide: getModelToken(Vendor), useValue: mockVendorRepo },
        { provide: getModelToken(Currency), useValue: mockCurrencyRepo },
        { provide: PaginationService, useValue: mockPaginationService },
      ],
    }).compile();

    service = module.get<PhysicalDriveService>(PhysicalDriveService);
    vi.clearAllMocks(); // 🚀 Using Vitest native mock reset pipeline utilities
  });

  describe('findAll', () => {
    it('should cleanly delegate pagination logic to PaginationService', async () => {
      const mockQuery = { pageNumber: 1, pageSize: 10 };
      const expectedOutput = { data: [], meta: {} } as unknown as {
        data: PhysicalDrive[];
        meta: Record<string, unknown>;
      };
      mockPaginationService.paginate.mockResolvedValue(expectedOutput);

      const result = await service.findAll(mockQuery);

      expect(result).toEqual(expectedOutput);
      expect(mockPaginationService.paginate).toHaveBeenCalledWith(
        mockPhysicalDriveRepo as unknown,
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
      driveModelId: 'sm-uuid',
      retailerVendorId: 'vendor-uuid',
      currencyId: 'currency-uuid',
    };

    it('should successfully create a physical drive when serial number is unique and all keys exist', async () => {
      mockPhysicalDriveRepo.findOne.mockResolvedValue(null);
      mockDriveModelRepo.findByPk.mockResolvedValue({ id: 'sm-uuid' });
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
      mockDriveModelRepo.findByPk.mockResolvedValue(null);
      mockVendorRepo.findByPk.mockResolvedValue({ id: 'vendor-uuid' });
      mockCurrencyRepo.findByPk.mockResolvedValue(null);

      const expectedErrorMessage = [
        'DriveModel with ID sm-uuid not found',
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
    };

    it('should successfully update field variables if inputs are unique and exist', async () => {
      const mockInstance = {
        id: 'drive-1',
        serialNumber: 'S3X0NX0A123456',
        update: vi.fn().mockResolvedValue(true),
      };
      mockPhysicalDriveRepo.findByPk.mockResolvedValue(mockInstance);
      mockPhysicalDriveRepo.findOne.mockResolvedValue(null);
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
      mockVendorRepo.findByPk.mockResolvedValue(null);

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
