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

describe('DriveLifecycleEventService', () => {
  let service: DriveLifecycleEventService;
  let mockEventModel: any;
  let mockPhysicalDriveModel: any;
  let mockPaginationService: jest.Mocked<PaginationService>;

  beforeEach(async () => {
    // 1. Mock both Sequelize models
    mockEventModel = {
      findOne: jest.fn(),
      findByPk: jest.fn(),
      create: jest.fn(),
      destroy: jest.fn(),
    };

    mockPhysicalDriveModel = {
      findByPk: jest.fn(),
    };

    // 2. Mock the PaginationService
    mockPaginationService = {
      paginate: jest.fn(),
    } as any;

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
        mockEventModel,
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
      const mockReload = jest
        .fn()
        .mockResolvedValue({ id: 'event-uuid', ...createDto });
      mockPhysicalDriveModel.findByPk.mockResolvedValue({ id: 'drive-uuid' }); // Physical drive exists
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
      mockPhysicalDriveModel.findByPk.mockResolvedValue(null); // Physical drive missing

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
      const mockReload = jest.fn().mockResolvedValue({
        id: 'event-uuid',
        eventType: DriveLifecycleEventType.FAIL,
      });
      const mockInstance = {
        id: 'event-uuid',
        update: jest.fn().mockResolvedValue(true),
        reload: mockReload,
      };
      mockEventModel.findByPk.mockResolvedValue(mockInstance);
      mockPhysicalDriveModel.findByPk.mockResolvedValue({
        id: 'new-drive-uuid',
      }); // New drive exists

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
      mockPhysicalDriveModel.findByPk.mockResolvedValue(null); // New drive is missing

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
