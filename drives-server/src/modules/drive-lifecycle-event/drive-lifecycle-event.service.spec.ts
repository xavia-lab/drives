import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken, getConnectionToken } from '@nestjs/sequelize';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Op } from 'sequelize';
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';

import { DriveLifecycleEventService } from './drive-lifecycle-event.service';
import {
  DriveLifecycleEvent,
  DriveLifecycleEventType,
  DriveLifecycleState,
} from './entities/drive-lifecycle-event.entity';
import { PhysicalDrive } from '../physical-drive/entities/physical-drive.entity';
import { User } from '../user/entities/user.entity';
import { PaginationService } from '../common/pagination/pagination.service';
import { CreateDriveLifecycleEventDto } from './dto/create-drive-lifecycle-event.dto';

const DRIVE_ID = '019f6a00-0000-7f01-8c00-000000000001';
const REPLACEMENT_ID = '019f6a00-0000-7f02-8c00-000000000002';
const USER_ID = '00000000-0000-0000-0000-000000000000';
const EVENT_ID = '019f6a80-0000-7c00-8c00-000000000001';

describe('DriveLifecycleEventService', () => {
  let service: DriveLifecycleEventService;

  let mockEventModel: Record<string, Mock>;
  let mockDriveModel: Record<string, Mock>;
  let mockUserModel: Record<string, Mock>;
  let mockPaginationService: { paginate: Mock };
  let mockTransaction: Record<string, unknown>;
  let mockSequelize: { transaction: Mock };

  beforeEach(async () => {
    mockEventModel = {
      findAll: vi.fn(),
      findOne: vi.fn(),
      findByPk: vi.fn(),
      create: vi.fn(),
    };
    mockDriveModel = { findByPk: vi.fn() };
    mockUserModel = { findByPk: vi.fn() };
    mockPaginationService = { paginate: vi.fn() };

    mockTransaction = {
      LOCK: { UPDATE: 'UPDATE' },
      commit: vi.fn(),
      rollback: vi.fn(),
    };
    mockSequelize = {
      transaction: vi.fn((cb: (t: unknown) => unknown) => cb(mockTransaction)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DriveLifecycleEventService,
        {
          provide: getModelToken(DriveLifecycleEvent),
          useValue: mockEventModel,
        },
        { provide: getModelToken(PhysicalDrive), useValue: mockDriveModel },
        { provide: getModelToken(User), useValue: mockUserModel },
        { provide: PaginationService, useValue: mockPaginationService },
        { provide: getConnectionToken(), useValue: mockSequelize },
      ],
    }).compile();

    service = module.get(DriveLifecycleEventService);
    vi.clearAllMocks();
  });

  describe('findAll', () => {
    it('translates dedicated filters into a where clause and delegates to pagination', async () => {
      const expected = { data: [], meta: {} };
      mockPaginationService.paginate.mockResolvedValue(expected);

      const query = {
        pageNumber: 1,
        pageSize: 10,
        physicalDriveId: DRIVE_ID,
        eventType: DriveLifecycleEventType.FAIL,
        eventTimestampFrom: '2026-01-01T00:00:00.000Z',
      };

      const result = await service.findAll(query);

      expect(result).toBe(expected);
      const [[model, passedQuery, options]] = mockPaginationService.paginate
        .mock.calls as [
        [
          unknown,
          unknown,
          { where: Record<string, unknown>; include: unknown[] },
        ],
      ];
      expect(model).toBe(mockEventModel);
      expect(passedQuery).toBe(query);
      expect(options.where.physicalDriveId).toBe(DRIVE_ID);
      expect(options.where.eventType).toBe(DriveLifecycleEventType.FAIL);
      expect(options.where.eventTimestamp[Op.gte]).toEqual(
        new Date('2026-01-01T00:00:00.000Z'),
      );
      expect(options.include).toHaveLength(2);
    });
  });

  describe('findOne', () => {
    it('returns the event with its drive associations', async () => {
      const event = { id: EVENT_ID };
      mockEventModel.findByPk.mockResolvedValue(event);

      await expect(service.findOne(EVENT_ID)).resolves.toBe(event);
      expect(mockEventModel.findByPk).toHaveBeenCalledWith(EVENT_ID, {
        include: expect.any(Array) as unknown[],
      });
    });

    it('throws NotFoundException when missing', async () => {
      mockEventModel.findByPk.mockResolvedValue(null);
      await expect(service.findOne(EVENT_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getCurrentLifecycleMap', () => {
    it('derives the latest state-changing event per drive and defaults the rest to UNRECEIVED', async () => {
      mockEventModel.findAll.mockResolvedValue([
        {
          physicalDriveId: DRIVE_ID,
          eventType: DriveLifecycleEventType.PROVISION,
          id: 'e2',
        },
        {
          physicalDriveId: DRIVE_ID,
          eventType: DriveLifecycleEventType.NOTE,
          id: 'e3',
        },
        {
          physicalDriveId: REPLACEMENT_ID,
          eventType: DriveLifecycleEventType.ACQUIRE,
          id: 'e1',
        },
      ]);

      const map = await service.getCurrentLifecycleMap([
        DRIVE_ID,
        REPLACEMENT_ID,
        'missing-drive',
      ]);

      expect(map.get(DRIVE_ID)?.state).toBe(DriveLifecycleState.IN_SERVICE);
      expect(map.get(REPLACEMENT_ID)?.state).toBe(DriveLifecycleState.RECEIVED);
      expect(map.get('missing-drive')?.state).toBe(
        DriveLifecycleState.UNRECEIVED,
      );
      expect(map.get('missing-drive')?.eventId).toBeNull();
    });

    it('returns an empty map without querying when given no drive ids', async () => {
      const map = await service.getCurrentLifecycleMap([]);
      expect(map.size).toBe(0);
      expect(mockEventModel.findAll).not.toHaveBeenCalled();
    });
  });

  describe('getTimeline', () => {
    it('throws NotFoundException when the drive does not exist', async () => {
      mockDriveModel.findByPk.mockResolvedValue(null);
      await expect(service.getTimeline(DRIVE_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns events oldest-first with the derived state', async () => {
      mockDriveModel.findByPk.mockResolvedValue({ id: DRIVE_ID });
      const events = [
        { id: 'e1', eventType: DriveLifecycleEventType.ACQUIRE },
        { id: 'e2', eventType: DriveLifecycleEventType.PROVISION },
      ];
      mockEventModel.findAll.mockResolvedValue(events);

      const timeline = await service.getTimeline(DRIVE_ID);

      expect(timeline.physicalDriveId).toBe(DRIVE_ID);
      expect(timeline.currentState).toBe(DriveLifecycleState.IN_SERVICE);
      expect(timeline.currentEvent).toBe(events[1]);
      expect(timeline.events).toBe(events);
    });
  });

  describe('recordEvent', () => {
    const baseDto: CreateDriveLifecycleEventDto = {
      eventType: DriveLifecycleEventType.PROVISION,
    };

    // The service loads the latest *any* event and the latest *state-changing*
    // event in parallel; the latter is the only query with an eventType filter.
    const stubLatestEvents = (latestState: unknown, latestAny?: unknown) => {
      mockEventModel.findOne.mockImplementation(
        (options: { where?: Record<string, unknown> }) =>
          Promise.resolve(
            options.where?.eventType ? latestState : (latestAny ?? latestState),
          ),
      );
    };

    it('appends the event and returns the refreshed timeline', async () => {
      mockDriveModel.findByPk.mockResolvedValue({ id: DRIVE_ID });
      mockUserModel.findByPk.mockResolvedValue({ id: USER_ID });
      stubLatestEvents({
        id: 'e1',
        eventType: DriveLifecycleEventType.ACQUIRE,
        eventTimestamp: new Date('2026-01-01T00:00:00.000Z'),
      });
      mockEventModel.create.mockResolvedValue({ id: EVENT_ID });
      mockEventModel.findAll.mockResolvedValue([
        { id: 'e1', eventType: DriveLifecycleEventType.ACQUIRE },
        { id: EVENT_ID, eventType: DriveLifecycleEventType.PROVISION },
      ]);

      const timeline = await service.recordEvent(DRIVE_ID, baseDto, {
        performedByUserId: USER_ID,
        triggeredBy: 'operator',
      });

      expect(mockDriveModel.findByPk).toHaveBeenCalledWith(DRIVE_ID, {
        transaction: mockTransaction,
        lock: 'UPDATE',
      });
      expect(mockUserModel.findByPk).toHaveBeenCalledWith(USER_ID, {
        transaction: mockTransaction,
      });
      expect(mockEventModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          physicalDriveId: DRIVE_ID,
          eventType: DriveLifecycleEventType.PROVISION,
          performedByUserId: USER_ID,
          triggeredBy: 'operator',
        }),
        { transaction: mockTransaction },
      );
      expect(timeline.currentState).toBe(DriveLifecycleState.IN_SERVICE);
    });

    it('rejects an illegal transition for the derived state', async () => {
      mockDriveModel.findByPk.mockResolvedValue({ id: DRIVE_ID });
      stubLatestEvents({
        id: 'e1',
        eventType: DriveLifecycleEventType.SCRAP_SHRED,
        eventTimestamp: new Date('2026-01-01T00:00:00.000Z'),
      });

      await expect(service.recordEvent(DRIVE_ID, baseDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockEventModel.create).not.toHaveBeenCalled();
    });

    it('rejects a timestamp that precedes the latest event', async () => {
      mockDriveModel.findByPk.mockResolvedValue({ id: DRIVE_ID });
      stubLatestEvents({
        id: 'e1',
        eventType: DriveLifecycleEventType.ACQUIRE,
        eventTimestamp: new Date('2026-06-01T00:00:00.000Z'),
      });

      await expect(
        service.recordEvent(DRIVE_ID, {
          eventType: DriveLifecycleEventType.PROVISION,
          eventTimestamp: '2026-01-01T00:00:00.000Z',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('requires a replacement drive for RMA_REPLACE', async () => {
      mockDriveModel.findByPk.mockResolvedValue({ id: DRIVE_ID });
      stubLatestEvents({
        id: 'e1',
        eventType: DriveLifecycleEventType.RMA_INITIATE,
        eventTimestamp: new Date('2026-01-01T00:00:00.000Z'),
      });

      await expect(
        service.recordEvent(DRIVE_ID, {
          eventType: DriveLifecycleEventType.RMA_REPLACE,
        }),
      ).rejects.toThrow(/replacementPhysicalDriveId is required/);
    });

    it('rejects a replacement that is already linked to another RMA', async () => {
      mockDriveModel.findByPk.mockImplementation((id: string) =>
        Promise.resolve(id === DRIVE_ID ? { id: DRIVE_ID } : null),
      );
      mockDriveModel.findByPk
        .mockResolvedValueOnce({ id: DRIVE_ID })
        .mockResolvedValueOnce({ id: REPLACEMENT_ID });
      mockEventModel.findOne.mockImplementation(
        (options: { where?: Record<string, unknown> }) => {
          const where = options.where ?? {};
          if (where.eventType === DriveLifecycleEventType.RMA_REPLACE) {
            return Promise.resolve({ id: 'existing' });
          }
          return Promise.resolve({
            id: 'e1',
            eventType: DriveLifecycleEventType.RMA_INITIATE,
            eventTimestamp: new Date('2026-01-01T00:00:00.000Z'),
          });
        },
      );

      await expect(
        service.recordEvent(DRIVE_ID, {
          eventType: DriveLifecycleEventType.RMA_REPLACE,
          replacementPhysicalDriveId: REPLACEMENT_ID,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });
});
