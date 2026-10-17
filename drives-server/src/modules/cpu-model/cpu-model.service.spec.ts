import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CpuModelService } from './cpu-model.service';
import { CpuModel, CpuArchitecture } from './entities/cpu-model.entity';
import { Vendor } from '../vendor/entities/vendor.entity';
import { PaginationService } from '../common/pagination/pagination.service';
import { CreateCpuModelDto } from './dto/create-cpu-model.dto';
import { UpdateCpuModelDto } from './dto/update-cpu-model.dto';
import {
  describe,
  it,
  expect,
  beforeEach,
  vi,
  type Mock,
  type Mocked,
} from 'vitest'; // 🚀 Pure ESM imports from Vitest

describe('CpuModelService', () => {
  let service: CpuModelService;

  // 🚀 Explicit Vitest mock types replace legacy configuration definitions
  let mockCpuModelRepo: Record<string, Mock>;
  let mockVendorRepo: Record<string, Mock>;
  let mockPaginationService: Mocked<PaginationService>;

  beforeEach(async () => {
    mockCpuModelRepo = {
      findOne: vi.fn(), // 🚀 Swapped out legacy jest.fn() with vitest vi.fn()
      findByPk: vi.fn(),
      create: vi.fn(),
      destroy: vi.fn(),
    };

    mockVendorRepo = {
      findByPk: vi.fn(),
    };

    mockPaginationService = {
      paginate: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CpuModelService,
        {
          provide: getModelToken(CpuModel),
          useValue: mockCpuModelRepo,
        },
        {
          provide: getModelToken(Vendor),
          useValue: mockVendorRepo,
        },
        {
          provide: PaginationService,
          useValue: mockPaginationService,
        },
      ],
    }).compile();

    service = module.get<CpuModelService>(CpuModelService);
    vi.clearAllMocks(); // 🚀 Using Vitest native mock reset pipeline utilities
  });

  describe('findAll', () => {
    it('should cleanly delegate pagination logic to PaginationService', async () => {
      const mockQuery = { pageNumber: 1, pageSize: 10 };
      const expectedPaginatedOutput = { data: [], meta: {} } as unknown as {
        data: CpuModel[];
        meta: Record<string, unknown>;
      };
      mockPaginationService.paginate.mockResolvedValue(expectedPaginatedOutput);

      const result = await service.findAll(mockQuery);

      expect(result).toEqual(expectedPaginatedOutput);
      expect(mockPaginationService.paginate).toHaveBeenCalledWith(
        mockCpuModelRepo as unknown,
        mockQuery,
      );
    });
  });

  describe('findOne', () => {
    it('should successfully find and return a cpu model by ID', async () => {
      const mockCpu = { id: 'cpu-uuid', name: 'EPYC 7763' };
      mockCpuModelRepo.findByPk.mockResolvedValue(mockCpu);

      const result = await service.findOne('cpu-uuid');

      expect(result).toEqual(mockCpu);
      expect(mockCpuModelRepo.findByPk).toHaveBeenCalledWith('cpu-uuid');
    });

    it('should throw NotFoundException if cpu model is not found', async () => {
      mockCpuModelRepo.findByPk.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    const createDto: CreateCpuModelDto = {
      vendorId: '019f52ee-f450-7484-b126-fed1b64c566e',
      architecture: CpuArchitecture.X86_64,
      name: 'EPYC 7763',
      physicalCores: 64,
      threads: 128,
      tdpWatts: 280,
    };

    it('should successfully create a cpu model when name is unique', async () => {
      mockCpuModelRepo.findOne.mockResolvedValue(null);
      mockVendorRepo.findByPk.mockResolvedValue({ id: createDto.vendorId });
      mockCpuModelRepo.create.mockResolvedValue({
        id: 'cpu-uuid',
        ...createDto,
      });

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(mockCpuModelRepo.create).toHaveBeenCalledWith(createDto);
    });

    it('should throw ConflictException if CPU name already exists', async () => {
      mockCpuModelRepo.findOne.mockResolvedValue({
        id: 'existing-id',
        name: 'EPYC 7763',
      });

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockCpuModelRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    const updateDto: UpdateCpuModelDto = {
      name: 'EPYC 7763 v2',
      tdpWatts: 300,
    };

    it('should successfully update a cpu model when name variation is valid', async () => {
      const mockInstance = {
        id: 'cpu-uuid',
        update: vi.fn().mockResolvedValue(true),
      };
      mockCpuModelRepo.findByPk.mockResolvedValue(mockInstance);
      mockCpuModelRepo.findOne.mockResolvedValue(null);

      await service.update('cpu-uuid', updateDto);

      expect(mockInstance.update).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'EPYC 7763 v2', tdpWatts: 300 }),
      );
    });

    it('should throw ConflictException if the updated name already exists on another row', async () => {
      const mockInstance = { id: 'cpu-uuid' };
      mockCpuModelRepo.findByPk.mockResolvedValue(mockInstance);
      mockCpuModelRepo.findOne.mockResolvedValue({
        id: 'other-id',
        name: 'EPYC 7763 v2',
      });

      await expect(service.update('cpu-uuid', updateDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('delete', () => {
    it('should successfully delete a cpu model if it is found', async () => {
      const mockInstance = { id: 'cpu-uuid' };
      mockCpuModelRepo.findByPk.mockResolvedValue(mockInstance);
      mockCpuModelRepo.destroy.mockResolvedValue(1);

      const result = await service.delete('cpu-uuid');

      expect(result).toBe(true);
      expect(mockCpuModelRepo.destroy).toHaveBeenCalledWith({
        where: { id: 'cpu-uuid' },
      });
    });
  });
});
