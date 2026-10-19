import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { RackService } from './rack.service';
import { Rack } from './entities/rack.entity';
import { Datacenter } from '../datacenter/entities/datacenter.entity';
import { PaginationService } from '../pagination/pagination.service';
import { CreateRackDto } from './dto/create-rack.dto';
import {
  describe,
  it,
  expect,
  beforeEach,
  vi,
  type Mock,
  type Mocked,
} from 'vitest'; // 🚀 Pure ESM imports from Vitest

describe('RackService', () => {
  let service: RackService;

  // 🚀 Explicit Vitest mock types replace legacy configuration definitions
  let mockRackRepo: Record<string, Mock>;
  let mockDcRepo: Record<string, Mock>;
  let mockPaginationService: Mocked<PaginationService>;

  beforeEach(async () => {
    mockRackRepo = {
      findOne: vi.fn(), // 🚀 Swapped out legacy jest.fn() with vitest vi.fn()
      findByPk: vi.fn(),
      create: vi.fn(),
      destroy: vi.fn(),
    };
    mockDcRepo = { findByPk: vi.fn() };

    mockPaginationService = {
      paginate: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RackService,
        { provide: getModelToken(Rack), useValue: mockRackRepo },
        { provide: getModelToken(Datacenter), useValue: mockDcRepo },
        { provide: PaginationService, useValue: mockPaginationService },
      ],
    }).compile();

    service = module.get<RackService>(RackService);
    vi.clearAllMocks(); // 🚀 Using Vitest native mock reset pipeline utilities
  });

  describe('create', () => {
    const createDto: CreateRackDto = {
      name: 'RACK-B12',
      datacenterId: 'dc-uuid',
      totalRackUnits: 42,
    };

    it('should create and reload a Rack if scope constraints are clear and datacenter exists', async () => {
      const mockReload = vi
        .fn()
        .mockResolvedValue({ id: 'rack-uuid', ...createDto });
      mockRackRepo.findOne.mockResolvedValue(null);
      mockDcRepo.findByPk.mockResolvedValue({ id: 'dc-uuid' });
      mockRackRepo.create.mockResolvedValue({
        id: 'rack-uuid',
        reload: mockReload,
      });

      const result = await service.create(createDto);
      expect(result).toBeDefined();
      expect(mockRackRepo.create).toHaveBeenCalledWith(createDto);
      expect(mockReload).toHaveBeenCalled();
    });

    it('should throw ConflictException if rack name already exists inside the same building context', async () => {
      mockRackRepo.findOne.mockResolvedValue({ id: 'existing-id' });
      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should aggregate missing parent foreign keys into a single multiline NotFoundException', async () => {
      mockRackRepo.findOne.mockResolvedValue(null);
      mockDcRepo.findByPk.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(
        new NotFoundException('Datacenter with ID dc-uuid not found'),
      );
    });
  });
});
