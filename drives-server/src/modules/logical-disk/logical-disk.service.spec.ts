import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { LogicalDiskService } from './logical-disk.service';
import { LogicalDisk } from './entities/logical-disk.entity';
import { LogicalVdev } from '../logical-vdev/entities/logical-vdev.entity';
import { PhysicalDrive } from '../physical-drive/entities/physical-drive.entity';
import { PaginationService } from '../pagination/pagination.service';
import { CreateLogicalDiskDto } from './dto/create-logical-disk.dto';
import {
  describe,
  it,
  expect,
  beforeEach,
  vi,
  type Mock,
  type Mocked,
} from 'vitest'; // 🚀 Pure ESM imports from Vitest

describe('LogicalDiskService', () => {
  let service: LogicalDiskService;

  // 🚀 Explicit Vitest mock types replace legacy configuration definitions
  let mockLogicalDiskModel: Record<string, Mock>;
  let mockLogicalVdevModel: Record<string, Mock>;
  let mockPhysicalDriveModel: Record<string, Mock>;
  let mockPaginationService: Mocked<PaginationService>;

  beforeEach(async () => {
    mockLogicalDiskModel = {
      findOne: vi.fn(), // 🚀 Swapped out legacy jest.fn() with vitest vi.fn()
      findByPk: vi.fn(),
      create: vi.fn(),
      destroy: vi.fn(),
    };
    mockLogicalVdevModel = { findByPk: vi.fn() };
    mockPhysicalDriveModel = { findByPk: vi.fn() };

    mockPaginationService = {
      paginate: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogicalDiskService,
        { provide: getModelToken(LogicalDisk), useValue: mockLogicalDiskModel },
        { provide: getModelToken(LogicalVdev), useValue: mockLogicalVdevModel },
        {
          provide: getModelToken(PhysicalDrive),
          useValue: mockPhysicalDriveModel,
        },
        { provide: PaginationService, useValue: mockPaginationService },
      ],
    }).compile();

    service = module.get<LogicalDiskService>(LogicalDiskService);
    vi.clearAllMocks(); // 🚀 Using Vitest native mock reset pipeline utilities
  });

  describe('findAll', () => {
    it('should cleanly delegate pagination logic to PaginationService with correct relation inclusions', async () => {
      const mockQuery = { pageNumber: 1, pageSize: 10 };
      const expectedPaginatedOutput = { data: [], meta: {} } as unknown as {
        data: LogicalDisk[];
        meta: Record<string, unknown>;
      };
      mockPaginationService.paginate.mockResolvedValue(expectedPaginatedOutput);

      const result = await service.findAll(mockQuery);

      expect(result).toEqual(expectedPaginatedOutput);
      expect(mockPaginationService.paginate).toHaveBeenCalledWith(
        mockLogicalDiskModel as unknown,
        mockQuery,
        { include: [LogicalVdev, PhysicalDrive] },
      );
    });
  });

  describe('create', () => {
    const createDto: CreateLogicalDiskDto = {
      logicalVdevId: 'vdev-uuid',
      physicalDriveId: 'drive-uuid',
      osDeviceNodePath: '/dev/nvme0n1',
      isSpareDrive: false,
    };

    it('should successfully create and reload a logical disk if assignment constraints pass and parents exist', async () => {
      const mockReload = vi
        .fn()
        .mockResolvedValue({ id: 'disk-uuid', ...createDto });
      mockLogicalDiskModel.findOne.mockResolvedValue(null);
      mockLogicalVdevModel.findByPk.mockResolvedValue({ id: 'vdev-uuid' });
      mockPhysicalDriveModel.findByPk.mockResolvedValue({ id: 'drive-uuid' });
      mockLogicalDiskModel.create.mockResolvedValue({
        id: 'disk-uuid',
        reload: mockReload,
      });

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(mockLogicalDiskModel.create).toHaveBeenCalledWith(createDto);
      expect(mockReload).toHaveBeenCalledWith({
        include: [LogicalVdev, PhysicalDrive],
      });
    });

    it('should throw ConflictException if the physical drive asset is already mapped elsewhere', async () => {
      mockLogicalDiskModel.findOne.mockResolvedValue({ id: 'existing-id' });

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should aggregate multiple missing parent foreign keys into a single multiline NotFoundException', async () => {
      mockLogicalDiskModel.findOne.mockResolvedValue(null);
      mockLogicalVdevModel.findByPk.mockResolvedValue(null);
      mockPhysicalDriveModel.findByPk.mockResolvedValue(null);

      const expectedErrorMessage = [
        'LogicalVdev with ID vdev-uuid not found',
        'PhysicalDrive with ID drive-uuid not found',
      ].join('\n');

      await expect(service.create(createDto)).rejects.toThrow(
        new NotFoundException(expectedErrorMessage),
      );
    });
  });
});
