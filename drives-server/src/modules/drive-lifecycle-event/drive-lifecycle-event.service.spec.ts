import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { NotFoundException } from '@nestjs/common';
import { DriveLifecycleEventService } from './drive-lifecycle-event.service';
import {
  DriveLifecycleEvent,
  DriveLifecycleEventType,
} from './entities/drive-lifecycle-event.entity';
import { PhysicalDrive } from '../physical-drive/entities/physical-drive.entity';
import { PaginationService } from '../common/pagination/pagination.service';
import { CreateDriveLifecycleEventDto } from './dto/create-drive-lifecycle-event.dto';
import { UpdateDriveLifecycleEventDto } from './dto/update-drive-lifecycle-event.dto';
import {
  describe,
  it,
  expect,
  beforeEach,
  vi,
  type Mock,
  type Mocked,
} from 'vitest'; // 🚀 Pure ESM imports from Vitest

describe('DriveLifecycleEventService', () => {
  let service: DriveLifecycleEventService;

  // 🚀 Explicit Vitest mock types replace legacy configuration definitions
  let mockEventModel: Record<string, Mock>;
  let mockPhysicalDriveModel: Record<string, Mock>;
  let mockPaginationService: Mocked<PaginationService>;

  beforeEach(async () => {
    // 1. Mock both Sequelize models using vi.fn()
    mockEventModel = {
      findOne: vi.fn(), // 🚀 Swapped out legacy jest.fn() with vitest vi.fn()
      findByPk: vi.fn(),
      create: vi.fn(),
      destroy: vi.fn(),
    };

    mockPhysicalDriveModel = {
      findByPk: vi.fn(),
    };

    // 2. Mock the PaginationService using clear type boundaries
    mockPaginationService = {
      paginate: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DriveLifecycleEventService,
        {
          provide: getModelToken(DriveLifecycleEvent),
          useValue: mockEventModel,
        },
        {
          provide: getModelToken(PhysicalDrive),
          useValue: mockPhysicalDriveModel,
        },
        {
          provide: PaginationService,
          useValue: mockPaginationService,
        },
      ],
    }).compile();

    service = module.get<DriveLifecycleEventService>(
      DriveLifecycleEventService,
    );
    vi.clearAllMocks(); // 🚀 Using Vitest native mock reset pipeline utilities
  });

  describe('findAll', () => {
    it('should cleanly delegate pagination logic to PaginationService', async () => {
      const mockQuery = { pageNumber: 1, pageSize: 10 };
      const expectedPaginatedOutput = { data: [], meta: {} } as unknown as {
        data: DriveLifecycleEvent[];
        meta: Record<string, unknown>;
      };
      mockPaginationService.paginate.mockResolvedValue(expectedPaginatedOutput);

      const result = await service.findAll(mockQuery);

      expect(result).toEqual(expectedPaginatedOutput);
      expect(mockPaginationService.paginate).toHaveBeenCalledWith(
        mockEventModel as unknown,
        mockQuery,
      );
    });
  });

  describe('findOne', () => {
    it('should successfully find and return an event by ID', async () => {
      const mockEvent = {
        id: 'event-uuid',
        eventType: DriveLifecycleEventType.PROVISION,
      };
      mockEventModel.findByPk.mockResolvedValue(mockEvent);

      const result = await service.findOne('event-uuid');

      expect(result).toEqual(mockEvent);
      expect(mockEventModel.findByPk).toHaveBeenCalledWith('event-uuid', {
        include: [PhysicalDrive],
      });
    });

    it('should throw NotFoundException if event is not found', async () => {
      mockEventModel.findByPk.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    const createDto: CreateDriveLifecycleEventDto = {
      eventType: DriveLifecycleEventType.RECEIVE,
      eventTimestamp: new Date(),
      triggeredBy: 'system-agent',
      contextMetadata: { smartStatus: 'OK' },
      physicalDriveId: 'drive-uuid',
    };

    it('should successfully create and reload an event if foreign key exists', async () => {
      const mockReload = vi
        .fn()
        .mockResolvedValue({ id: 'event-uuid', ...createDto });
      mockPhysicalDriveModel.findByPk.mockResolvedValue({ id: 'drive-uuid' });
      mockEventModel.create.mockResolvedValue({
        id: 'event-uuid',
        reload: mockReload,
      });

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(mockEventModel.create).toHaveBeenCalledWith({ ...createDto });
      expect(mockPhysicalDriveModel.findByPk).toHaveBeenCalledWith(
        'drive-uuid',
      );
      expect(mockReload).toHaveBeenCalledWith({ include: [PhysicalDrive] });
    });

    it('should throw NotFoundException if the provided physicalDriveId does not exist', async () => {
      mockPhysicalDriveModel.findByPk.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(
        new NotFoundException('PhysicalDrive with ID drive-uuid not found'),
      );
      expect(mockEventModel.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    const updateDto: UpdateDriveLifecycleEventDto = {
      eventType: DriveLifecycleEventType.FAIL,
      physicalDriveId: 'new-drive-uuid',
    };

    it('should successfully update an event when target items exist', async () => {
      const mockReload = vi.fn().mockResolvedValue({
        id: 'event-uuid',
        eventType: DriveLifecycleEventType.FAIL,
      });
      const mockInstance = {
        id: 'event-uuid',
        update: vi.fn().mockResolvedValue(true),
        reload: mockReload,
      };
      mockEventModel.findByPk.mockResolvedValue(mockInstance);
      mockPhysicalDriveModel.findByPk.mockResolvedValue({
        id: 'new-drive-uuid',
      });

      await service.update('event-uuid', updateDto);

      expect(mockInstance.update).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: DriveLifecycleEventType.FAIL,
          physicalDriveId: 'new-drive-uuid',
        }),
      );
      expect(mockReload).toHaveBeenCalledWith({ include: [PhysicalDrive] });
    });

    it('should throw NotFoundException if the updated physicalDriveId does not exist', async () => {
      const mockInstance = { id: 'event-uuid' };
      mockEventModel.findByPk.mockResolvedValue(mockInstance);
      mockPhysicalDriveModel.findByPk.mockResolvedValue(null);

      await expect(service.update('event-uuid', updateDto)).rejects.toThrow(
        new NotFoundException('PhysicalDrive with ID new-drive-uuid not found'),
      );
    });
  });

  describe('delete', () => {
    it('should successfully delete an event if it is found', async () => {
      const mockInstance = { id: 'event-uuid' };
      mockEventModel.findByPk.mockResolvedValue(mockInstance);
      mockEventModel.destroy.mockResolvedValue(1);

      const result = await service.delete('event-uuid');

      expect(result).toBe(true);
      expect(mockEventModel.destroy).toHaveBeenCalledWith({
        where: { id: 'event-uuid' },
      });
    });

    it('should throw NotFoundException if event to delete does not exist', async () => {
      mockEventModel.findByPk.mockResolvedValue(null);

      await expect(service.delete('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
