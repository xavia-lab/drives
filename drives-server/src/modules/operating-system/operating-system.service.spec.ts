import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { ConflictException } from '@nestjs/common';
import { OperatingSystemService } from './operating-system.service';
import { OperatingSystem } from './entities/operating-system.entity';
import { PaginationService } from '../pagination/pagination.service';
import { CreateOperatingSystemDto } from './dto/create-operating-system.dto';
import {
  describe,
  it,
  expect,
  beforeEach,
  vi,
  type Mock,
  type Mocked,
} from 'vitest'; // 🚀 Pure ESM imports from Vitest

describe('OperatingSystemService', () => {
  let service: OperatingSystemService;

  // 🚀 Explicit Vitest mock types replace legacy configuration definitions
  let mockOsRepo: Record<string, Mock>;
  let mockPaginationService: Mocked<PaginationService>;

  beforeEach(async () => {
    mockOsRepo = {
      findOne: vi.fn(), // 🚀 Swapped out legacy jest.fn() with vitest vi.fn()
      findByPk: vi.fn(),
      create: vi.fn(),
      destroy: vi.fn(),
    };

    mockPaginationService = {
      paginate: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OperatingSystemService,
        { provide: getModelToken(OperatingSystem), useValue: mockOsRepo },
        { provide: PaginationService, useValue: mockPaginationService },
      ],
    }).compile();

    service = module.get<OperatingSystemService>(OperatingSystemService);
    vi.clearAllMocks(); // 🚀 Using Vitest native mock reset pipeline utilities
  });

  describe('findAll', () => {
    it('should cleanly delegate pagination logic to PaginationService', async () => {
      const mockQuery = { pageNumber: 1, pageSize: 10 };
      const expectedOutput = { data: [], meta: {} } as unknown as {
        data: OperatingSystem[];
        meta: Record<string, unknown>;
      };
      mockPaginationService.paginate.mockResolvedValue(expectedOutput);

      const result = await service.findAll(mockQuery);
      expect(result).toEqual(expectedOutput);
      expect(mockPaginationService.paginate).toHaveBeenCalledWith(
        mockOsRepo as unknown,
        mockQuery,
      );
    });
  });

  describe('create', () => {
    const createDto: CreateOperatingSystemDto = {
      name: 'Proxmox VE 8.x',
      vendor: 'Proxmox',
    };

    it('should successfully create an OS when name is unique', async () => {
      mockOsRepo.findOne.mockResolvedValue(null);
      mockOsRepo.create.mockResolvedValue({ id: 'os-uuid', ...createDto });

      const result = await service.create(createDto);
      expect(result).toBeDefined();
      expect(mockOsRepo.create).toHaveBeenCalledWith(createDto);
    });

    it('should throw ConflictException if OS name already exists', async () => {
      mockOsRepo.findOne.mockResolvedValue({ id: 'existing-id' });
      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
