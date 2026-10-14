import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { ConflictException } from '@nestjs/common'; // Fixed: Removed unused NotFoundException
import { OperatingSystemService } from './operating-system.service';
import { OperatingSystem } from './entities/operating-system.entity';
import { PaginationService } from '../common/pagination/pagination.service';
import { CreateOperatingSystemDto } from './dto/create-operating-system.dto'; // Fixed: Removed unused UpdateOperatingSystemDto import

describe('OperatingSystemService', () => {
  let service: OperatingSystemService;
  // Fixed: Swapped loose 'any' definitions for typed mock records
  let mockOsRepo: Record<string, jest.Mock>;
  let mockPaginationService: jest.Mocked<PaginationService>;

  beforeEach(async () => {
    mockOsRepo = {
      findOne: jest.fn(),
      findByPk: jest.fn(),
      create: jest.fn(),
      destroy: jest.fn(),
    };

    // Fixed: Replaced 'as any' with an explicit double-cast constraint
    mockPaginationService = {
      paginate: jest.fn(),
    } as unknown as jest.Mocked<PaginationService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OperatingSystemService,
        { provide: getModelToken(OperatingSystem), useValue: mockOsRepo },
        { provide: PaginationService, useValue: mockPaginationService },
      ],
    }).compile();

    service = module.get<OperatingSystemService>(OperatingSystemService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should cleanly delegate pagination logic to PaginationService', async () => {
      const mockQuery = { pageNumber: 1, pageSize: 10 };
      // Fixed: Explicit structural type definition to satisfy return assignments safely
      const expectedOutput = { data: [], meta: {} } as unknown as {
        data: (OperatingSystem & { itemNumber: number })[];
        meta: Record<string, unknown>;
      };
      mockPaginationService.paginate.mockResolvedValue(expectedOutput);

      const result = await service.findAll(mockQuery);
      expect(result).toEqual(expectedOutput);
      expect(mockPaginationService.paginate).toHaveBeenCalledWith(
        mockOsRepo as unknown as typeof OperatingSystem,
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
