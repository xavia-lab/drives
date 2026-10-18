import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { PoolTypeService } from './pool-type.service';
import { PoolType } from './entities/pool-type.entity';
import { PaginationService } from '../common/pagination/pagination.service';
import { CreatePoolTypeDto } from './dto/create-pool-type.dto';
import { UpdatePoolTypeDto } from './dto/update-pool-type.dto';
import {
  describe,
  it,
  expect,
  beforeEach,
  vi,
  type Mock,
  type Mocked,
} from 'vitest';

describe('PoolTypeService', () => {
  let service: PoolTypeService;

  let mockPoolTypeModel: Record<string, Mock>;
  let mockPaginationService: Mocked<PaginationService>;

  beforeEach(async () => {
    mockPoolTypeModel = {
      findOne: vi.fn(),
      findByPk: vi.fn(),
      create: vi.fn(),
      destroy: vi.fn(),
    };

    mockPaginationService = {
      paginate: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PoolTypeService,
        {
          provide: getModelToken(PoolType),
          useValue: mockPoolTypeModel,
        },
        {
          provide: PaginationService,
          useValue: mockPaginationService,
        },
      ],
    }).compile();

    service = module.get<PoolTypeService>(PoolTypeService);
    vi.clearAllMocks();
  });

  describe('createPoolType', () => {
    const createDto: CreatePoolTypeDto = {
      name: 'ZFS',
    };

    it('should successfully create a pool type if the name is unique', async () => {
      mockPoolTypeModel.findOne.mockResolvedValue(null);
      mockPoolTypeModel.create.mockResolvedValue({
        id: '019f4fa1-57db-72d7-b037-2f35d54f2794',
        ...createDto,
      });

      const result = await service.createPoolType(createDto);

      expect(result).toBeDefined();
      expect(mockPoolTypeModel.create).toHaveBeenCalledWith({
        ...createDto,
      });
    });

    it('should throw ConflictException if pool type name already exists', async () => {
      mockPoolTypeModel.findOne.mockResolvedValue({
        id: 'existing-id',
        name: 'ZFS',
      });

      await expect(service.createPoolType(createDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockPoolTypeModel.create).not.toHaveBeenCalled();
    });
  });

  describe('updatePoolType', () => {
    const updateDto: UpdatePoolTypeDto = {
      name: 'BTRFS',
    };

    it('should successfully update a non-managed pool type', async () => {
      const mockInstance = {
        id: 'uuid-1',
        managed: false,
        update: vi.fn().mockResolvedValue({
          id: 'uuid-1',
          name: 'BTRFS',
        }),
      };
      mockPoolTypeModel.findByPk.mockResolvedValue(mockInstance);
      mockPoolTypeModel.findOne.mockResolvedValue(null);

      await service.updatePoolType('uuid-1', updateDto);

      expect(mockInstance.update).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'BTRFS',
        }),
      );
    });

    it('should throw ConflictException when trying to update a system-managed pool type', async () => {
      const mockInstance = { id: 'uuid-1', managed: true };
      mockPoolTypeModel.findByPk.mockResolvedValue(mockInstance);

      await expect(service.updatePoolType('uuid-1', updateDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('deletePoolType', () => {
    it('should successfully delete a pool type if it is not managed', async () => {
      const mockInstance = { id: 'uuid-1', managed: false };
      mockPoolTypeModel.findByPk.mockResolvedValue(mockInstance);
      mockPoolTypeModel.destroy.mockResolvedValue(1);

      const result = await service.deletePoolType('uuid-1');

      expect(result).toBe(true);
      expect(mockPoolTypeModel.destroy).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
      });
    });

    it('should throw NotFoundException if pool type to delete does not exist', async () => {
      mockPoolTypeModel.findByPk.mockResolvedValue(null);

      await expect(service.deletePoolType('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('should cleanly delegate pagination logic to PaginationService', async () => {
      const mockQuery = { pageNumber: 1, pageSize: 10 };
      const expectedPaginatedOutput = { data: [], meta: {} } as unknown as {
        data: PoolType[];
        meta: Record<string, unknown>;
      };
      mockPaginationService.paginate.mockResolvedValue(expectedPaginatedOutput);

      const result = await service.findAll(mockQuery);

      expect(result).toEqual(expectedPaginatedOutput);
      expect(mockPaginationService.paginate).toHaveBeenCalledWith(
        mockPoolTypeModel as unknown,
        mockQuery,
      );
    });
  });
});
