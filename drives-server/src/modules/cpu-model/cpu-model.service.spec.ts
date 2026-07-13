import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CpuModelService } from './cpu-model.service';
import { CpuModel, CpuVendor } from './entities/cpu-model.entity';
import { PaginationService } from '../common/pagination/pagination.service';
import { CreateCpuModelDto } from './dto/create-cpu-model.dto';
import { UpdateCpuModelDto } from './dto/update-cpu-model.dto';

describe('CpuModelService', () => {
  let service: CpuModelService;
  let mockCpuModelRepo: any;
  let mockPaginationService: jest.Mocked<PaginationService>;

  beforeEach(async () => {
    mockCpuModelRepo = {
      findOne: jest.fn(),
      findByPk: jest.fn(),
      create: jest.fn(),
      destroy: jest.fn(),
    };

    mockPaginationService = {
      paginate: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CpuModelService,
        {
          provide: getModelToken(CpuModel),
          useValue: mockCpuModelRepo,
        },
        {
          provide: PaginationService,
          useValue: mockPaginationService,
        },
      ],
    }).compile();

    service = module.get<CpuModelService>(CpuModelService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should cleanly delegate pagination logic to PaginationService', async () => {
      const mockQuery = { pageNumber: 1, pageSize: 10 };
      const expectedPaginatedOutput = { data: [], meta: {} } as any;
      mockPaginationService.paginate.mockResolvedValue(expectedPaginatedOutput);

      const result = await service.findAll(mockQuery);

      expect(result).toEqual(expectedPaginatedOutput);
      expect(mockPaginationService.paginate).toHaveBeenCalledWith(
        mockCpuModelRepo,
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
      vendor: CpuVendor.AMD,
      name: 'EPYC 7763',
      physicalCores: 64,
      threads: 128,
      tdpWatts: 280,
    };

    it('should successfully create a cpu model when name is unique', async () => {
      mockCpuModelRepo.findOne.mockResolvedValue(null);
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
        update: jest.fn().mockResolvedValue(true),
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
