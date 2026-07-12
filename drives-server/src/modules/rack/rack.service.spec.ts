import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { RackService } from './rack.service';
import { Rack } from './entities/rack.entity';
import { Datacenter } from '../datacenter/entities/datacenter.entity';
import { PaginationService } from '../common/pagination/pagination.service';
import { CreateRackDto } from './dto/create-rack.dto';

describe('RackService', () => {
  let service: RackService;
  let mockRackRepo: any;
  let mockDcRepo: any;
  let mockPaginationService: jest.Mocked<PaginationService>;

  beforeEach(async () => {
    mockRackRepo = {
      findOne: jest.fn(),
      findByPk: jest.fn(),
      create: jest.fn(),
      destroy: jest.fn(),
    };
    mockDcRepo = { findByPk: jest.fn() };
    mockPaginationService = { paginate: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RackService,
        { provide: getModelToken(Rack), useValue: mockRackRepo },
        { provide: getModelToken(Datacenter), useValue: mockDcRepo },
        { provide: PaginationService, useValue: mockPaginationService },
      ],
    }).compile();

    service = module.get<RackService>(RackService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateRackDto = {
      name: 'RACK-B12',
      datacenterId: 'dc-uuid',
      totalRackUnits: 42,
    };

    it('should create and reload a Rack if scope constraints are clear and datacenter exists', async () => {
      const mockReload = jest
        .fn()
        .mockResolvedValue({ id: 'rack-uuid', ...createDto });
      mockRackRepo.findOne.mockResolvedValue(null); // No local facility naming duplicate
      mockDcRepo.findByPk.mockResolvedValue({ id: 'dc-uuid' }); // Parent exists
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
      mockDcRepo.findByPk.mockResolvedValue(null); // Missing target building reference

      await expect(service.create(createDto)).rejects.toThrow(
        new NotFoundException('Datacenter with ID dc-uuid not found'),
      );
    });
  });
});
