import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { PhysicalCpuService } from './physical-cpu.service';
import { PhysicalCpu } from './entities/physical-cpu.entity';
import { CpuModel } from '../cpu-model/entities/cpu-model.entity';
import { Vendor } from '../vendor/entities/vendor.entity';
import { Currency } from '../currency/entities/currency.entity';
import { PaginationService } from '../common/pagination/pagination.service';
import { CreatePhysicalCpuDto } from './dto/create-physical-cpu.dto';
import { UpdatePhysicalCpuDto } from './dto/update-physical-cpu.dto';
import {
  describe,
  it,
  expect,
  beforeEach,
  vi,
  type Mock,
  type Mocked,
} from 'vitest';

describe('PhysicalCpuService', () => {
  let service: PhysicalCpuService;

  let mockPhysicalCpuRepo: Record<string, Mock>;
  let mockCpuModelRepo: Record<string, Mock>;
  let mockVendorRepo: Record<string, Mock>;
  let mockCurrencyRepo: Record<string, Mock>;
  let mockPaginationService: Mocked<PaginationService>;

  beforeEach(async () => {
    // 1. Mock all 4 required Sequelize models using vi.fn()
    mockPhysicalCpuRepo = {
      findOne: vi.fn(),
      findByPk: vi.fn(),
      create: vi.fn(),
      destroy: vi.fn(),
    };
    mockCpuModelRepo = { findByPk: vi.fn() };
    mockVendorRepo = { findByPk: vi.fn() };
    mockCurrencyRepo = { findByPk: vi.fn() };

    mockPaginationService = {
      paginate: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PhysicalCpuService,
        {
          provide: getModelToken(PhysicalCpu),
          useValue: mockPhysicalCpuRepo,
        },
        {
          provide: getModelToken(CpuModel),
          useValue: mockCpuModelRepo,
        },
        { provide: getModelToken(Vendor), useValue: mockVendorRepo },
        { provide: getModelToken(Currency), useValue: mockCurrencyRepo },
        { provide: PaginationService, useValue: mockPaginationService },
      ],
    }).compile();

    service = module.get<PhysicalCpuService>(PhysicalCpuService);
    vi.clearAllMocks();
  });

  describe('findAll', () => {
    it('should cleanly delegate pagination logic to PaginationService', async () => {
      const mockQuery = { pageNumber: 1, pageSize: 10 };
      const expectedOutput = { data: [], meta: {} } as unknown as {
        data: PhysicalCpu[];
        meta: Record<string, unknown>;
      };
      mockPaginationService.paginate.mockResolvedValue(expectedOutput);

      const result = await service.findAll(mockQuery);

      expect(result).toEqual(expectedOutput);
      expect(mockPaginationService.paginate).toHaveBeenCalledWith(
        mockPhysicalCpuRepo as unknown,
        mockQuery,
      );
    });
  });

  describe('findOne', () => {
    it('should successfully find and return a physical CPU by ID', async () => {
      const mockCpu = { id: 'cpu-1', serialNumber: 'BF2104S00012' };
      mockPhysicalCpuRepo.findByPk.mockResolvedValue(mockCpu);

      const result = await service.findOne('cpu-1');

      expect(result).toEqual(mockCpu);
      expect(mockPhysicalCpuRepo.findByPk).toHaveBeenCalledWith('cpu-1');
    });
  });

  describe('create', () => {
    const createDto: CreatePhysicalCpuDto = {
      serialNumber: 'BF2104S00012',
      acquisitionCost: 150.0,
      purchaseDate: '2026-01-01',
      warrantyExpiryDate: '2031-01-01',
      cpuModelId: 'cpu-model-uuid',
      retailerVendorId: 'vendor-uuid',
      currencyId: 'currency-uuid',
    };

    it('should successfully create a physical CPU when serial number is unique and all keys exist', async () => {
      mockPhysicalCpuRepo.findOne.mockResolvedValue(null);
      mockCpuModelRepo.findByPk.mockResolvedValue({ id: 'cpu-model-uuid' });
      mockVendorRepo.findByPk.mockResolvedValue({ id: 'vendor-uuid' });
      mockCurrencyRepo.findByPk.mockResolvedValue({ id: 'currency-uuid' });
      mockPhysicalCpuRepo.create.mockResolvedValue({
        id: 'cpu-1',
        ...createDto,
      });

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(mockPhysicalCpuRepo.create).toHaveBeenCalledWith({
        ...createDto,
      });
    });

    it('should throw ConflictException if the serial number already exists', async () => {
      mockPhysicalCpuRepo.findOne.mockResolvedValue({ id: 'existing-id' });

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockPhysicalCpuRepo.create).not.toHaveBeenCalled();
    });

    it('should aggregate multiple non-existent foreign keys into a single multiline NotFoundException', async () => {
      mockPhysicalCpuRepo.findOne.mockResolvedValue(null);
      mockCpuModelRepo.findByPk.mockResolvedValue(null);
      mockVendorRepo.findByPk.mockResolvedValue({ id: 'vendor-uuid' });
      mockCurrencyRepo.findByPk.mockResolvedValue(null);

      const expectedErrorMessage = [
        'CpuModel with ID cpu-model-uuid not found',
        'Currency with ID currency-uuid not found',
      ].join('\n');

      await expect(service.create(createDto)).rejects.toThrow(
        new NotFoundException(expectedErrorMessage),
      );
      expect(mockPhysicalCpuRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    const updateDto: UpdatePhysicalCpuDto = {
      serialNumber: 'NEW-SERIAL-123',
      retailerVendorId: 'missing-vendor-uuid',
    };

    it('should successfully update field variables if inputs are unique and exist', async () => {
      const mockInstance = {
        id: 'cpu-1',
        serialNumber: 'BF2104S00012',
        update: vi.fn().mockResolvedValue(true),
      };
      mockPhysicalCpuRepo.findByPk.mockResolvedValue(mockInstance);
      mockPhysicalCpuRepo.findOne.mockResolvedValue(null);
      mockVendorRepo.findByPk.mockResolvedValue({ id: 'missing-vendor-uuid' });

      await service.update('cpu-1', updateDto);

      expect(mockInstance.update).toHaveBeenCalledWith(
        expect.objectContaining({
          serialNumber: 'NEW-SERIAL-123',
          retailerVendorId: 'missing-vendor-uuid',
        }),
      );
    });

    it('should throw a combined exception if updated foreign keys are missing', async () => {
      const mockInstance = { id: 'cpu-1', serialNumber: 'BF2104S00012' };
      mockPhysicalCpuRepo.findByPk.mockResolvedValue(mockInstance);
      mockPhysicalCpuRepo.findOne.mockResolvedValue(null);
      mockVendorRepo.findByPk.mockResolvedValue(null);

      await expect(service.update('cpu-1', updateDto)).rejects.toThrow(
        new NotFoundException(
          'Retailer Vendor with ID missing-vendor-uuid not found',
        ),
      );
    });
  });

  describe('delete', () => {
    it('should successfully delete a physical CPU if it is found', async () => {
      const mockInstance = { id: 'cpu-1' };
      mockPhysicalCpuRepo.findByPk.mockResolvedValue(mockInstance);
      mockPhysicalCpuRepo.destroy.mockResolvedValue(1);

      const result = await service.delete('cpu-1');

      expect(result).toBe(true);
      expect(mockPhysicalCpuRepo.destroy).toHaveBeenCalledWith({
        where: { id: 'cpu-1' },
      });
    });

    it('should throw NotFoundException if the CPU to delete is missing', async () => {
      mockPhysicalCpuRepo.findByPk.mockResolvedValue(null);

      await expect(service.delete('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
