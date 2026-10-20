import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken, getConnectionToken } from '@nestjs/sequelize';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Op } from 'sequelize';
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';

import { WarrantyClaimEventService } from './warranty-claim-event.service';
import {
  WarrantyClaimEvent,
  WarrantyClaimEventType,
} from './entities/warranty-claim-event.entity';
import {
  WarrantyClaim,
  WarrantyClaimStatus,
} from './entities/warranty-claim.entity';
import { PhysicalDrive } from '../physical-drive/entities/physical-drive.entity';
import { User } from '../user/entities/user.entity';
import { PaginationService } from '../pagination/pagination.service';

const CLAIM_ID = '019f6a90-0000-7d00-8d00-000000000001';
const DRIVE_ID = '019f6a00-0000-7f01-8c00-000000000001';
const REPLACEMENT_ID = '019f6a00-0000-7f02-8c00-000000000002';
const USER_ID = '00000000-0000-0000-0000-000000000000';
const EVENT_ID = '019f6a91-0000-7d00-8d00-000000000001';

describe('WarrantyClaimEventService', () => {
  let service: WarrantyClaimEventService;

  let mockEventModel: Record<string, Mock>;
  let mockClaimModel: Record<string, Mock>;
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
    mockClaimModel = { findByPk: vi.fn(), findAll: vi.fn() };
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
        WarrantyClaimEventService,
        {
          provide: getModelToken(WarrantyClaimEvent),
          useValue: mockEventModel,
        },
        { provide: getModelToken(WarrantyClaim), useValue: mockClaimModel },
        { provide: getModelToken(PhysicalDrive), useValue: mockDriveModel },
        { provide: getModelToken(User), useValue: mockUserModel },
        { provide: PaginationService, useValue: mockPaginationService },
        { provide: getConnectionToken(), useValue: mockSequelize },
      ],
    }).compile();

    service = module.get(WarrantyClaimEventService);
    vi.clearAllMocks();
  });

  describe('getStatusMap', () => {
    it('derives the latest state-changing event per claim and defaults the rest to SUBMITTED', async () => {
      mockEventModel.findAll.mockResolvedValue([
        {
          warrantyClaimId: CLAIM_ID,
          eventType: WarrantyClaimEventType.APPROVED,
          id: 'e2',
        },
        {
          warrantyClaimId: CLAIM_ID,
          eventType: WarrantyClaimEventType.NOTE,
          id: 'e3',
        },
        {
          warrantyClaimId: REPLACEMENT_ID,
          eventType: WarrantyClaimEventType.CLOSED,
          id: 'e1',
        },
      ]);

      const map = await service.getStatusMap([
        CLAIM_ID,
        REPLACEMENT_ID,
        'missing-claim',
      ]);

      expect(map.get(CLAIM_ID)?.status).toBe(WarrantyClaimStatus.APPROVED);
      expect(map.get(REPLACEMENT_ID)?.status).toBe(WarrantyClaimStatus.CLOSED);
      expect(map.get('missing-claim')?.status).toBe(
        WarrantyClaimStatus.SUBMITTED,
      );
      expect(map.get('missing-claim')?.eventId).toBeNull();
    });

    it('returns an empty map without querying when given no claim ids', async () => {
      const map = await service.getStatusMap([]);
      expect(map.size).toBe(0);
      expect(mockEventModel.findAll).not.toHaveBeenCalled();
    });
  });

  describe('getActiveClaimForDrive', () => {
    it('returns null when the drive has no claims', async () => {
      mockClaimModel.findAll.mockResolvedValue([]);

      await expect(
        service.getActiveClaimForDrive('drive-1'),
      ).resolves.toBeNull();
    });

    it('skips CLOSED claims and returns the first open claim', async () => {
      mockClaimModel.findAll.mockResolvedValue([
        { id: 'claim-1' },
        { id: 'claim-2' },
      ]);
      mockEventModel.findAll.mockResolvedValue([
        {
          warrantyClaimId: 'claim-1',
          eventType: WarrantyClaimEventType.CLOSED,
          id: 'e1',
        },
        {
          warrantyClaimId: 'claim-2',
          eventType: WarrantyClaimEventType.SHIPPED_TO_VENDOR,
          id: 'e2',
        },
      ]);

      await expect(service.getActiveClaimForDrive('drive-1')).resolves.toEqual({
        id: 'claim-2',
        status: WarrantyClaimStatus.SHIPPED_TO_VENDOR,
      });
    });

    it('treats a claim with no events as SUBMITTED (open)', async () => {
      mockClaimModel.findAll.mockResolvedValue([{ id: 'claim-1' }]);
      mockEventModel.findAll.mockResolvedValue([]);

      await expect(service.getActiveClaimForDrive('drive-1')).resolves.toEqual({
        id: 'claim-1',
        status: WarrantyClaimStatus.SUBMITTED,
      });
    });

    it('returns null when every claim is CLOSED', async () => {
      mockClaimModel.findAll.mockResolvedValue([{ id: 'claim-1' }]);
      mockEventModel.findAll.mockResolvedValue([
        {
          warrantyClaimId: 'claim-1',
          eventType: WarrantyClaimEventType.CLOSED,
          id: 'e1',
        },
      ]);

      await expect(
        service.getActiveClaimForDrive('drive-1'),
      ).resolves.toBeNull();
    });
  });

  describe('findAll', () => {
    it('translates dedicated filters into a where clause', async () => {
      mockPaginationService.paginate.mockResolvedValue({ data: [], meta: {} });

      const query = {
        pageNumber: 1,
        pageSize: 10,
        warrantyClaimId: CLAIM_ID,
        eventType: WarrantyClaimEventType.APPROVED,
        eventTimestampFrom: '2026-01-01T00:00:00.000Z',
      };

      await service.findAll(query);

      const options = mockPaginationService.paginate.mock.calls[0][2] as {
        where: Record<string, unknown>;
      };
      expect(options.where.warrantyClaimId).toBe(CLAIM_ID);
      expect(options.where.eventType).toBe(WarrantyClaimEventType.APPROVED);
      expect(options.where.eventTimestamp[Op.gte]).toEqual(
        new Date('2026-01-01T00:00:00.000Z'),
      );
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when missing', async () => {
      mockEventModel.findByPk.mockResolvedValue(null);
      await expect(service.findOne(EVENT_ID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getTimeline', () => {
    it('throws NotFoundException when the claim does not exist', async () => {
      mockClaimModel.findByPk.mockResolvedValue(null);
      await expect(service.getTimeline(CLAIM_ID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns events oldest-first with the derived status', async () => {
      mockClaimModel.findByPk.mockResolvedValue({ id: CLAIM_ID });
      const events = [
        { id: 'e1', eventType: WarrantyClaimEventType.SHIPPED_TO_VENDOR },
        { id: 'e2', eventType: WarrantyClaimEventType.APPROVED },
      ];
      mockEventModel.findAll.mockResolvedValue(events);

      const timeline = await service.getTimeline(CLAIM_ID);

      expect(timeline.warrantyClaimId).toBe(CLAIM_ID);
      expect(timeline.currentStatus).toBe(WarrantyClaimStatus.APPROVED);
      expect(timeline.currentEvent).toBe(events[1]);
      expect(timeline.events).toBe(events);
    });
  });

  describe('recordEvent', () => {
    const stubLatestEvents = (latestState: unknown, latestAny?: unknown) => {
      mockEventModel.findOne.mockImplementation(
        (options: { where?: Record<string, unknown> }) =>
          Promise.resolve(
            options.where?.eventType ? latestState : (latestAny ?? latestState),
          ),
      );
    };

    it('appends the event and returns the refreshed timeline', async () => {
      mockClaimModel.findByPk.mockResolvedValue({
        id: CLAIM_ID,
        physicalDriveId: DRIVE_ID,
      });
      mockUserModel.findByPk.mockResolvedValue({ id: USER_ID });
      stubLatestEvents(null);
      mockEventModel.create.mockResolvedValue({ id: EVENT_ID });
      mockEventModel.findAll.mockResolvedValue([
        { id: EVENT_ID, eventType: WarrantyClaimEventType.SHIPPED_TO_VENDOR },
      ]);

      const timeline = await service.recordEvent(
        CLAIM_ID,
        { eventType: WarrantyClaimEventType.SHIPPED_TO_VENDOR },
        { performedByUserId: USER_ID },
      );

      expect(mockClaimModel.findByPk).toHaveBeenCalledWith(CLAIM_ID, {
        transaction: mockTransaction,
        lock: 'UPDATE',
      });
      expect(mockEventModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          warrantyClaimId: CLAIM_ID,
          eventType: WarrantyClaimEventType.SHIPPED_TO_VENDOR,
          performedByUserId: USER_ID,
        }),
        { transaction: mockTransaction },
      );
      expect(timeline.currentStatus).toBe(
        WarrantyClaimStatus.SHIPPED_TO_VENDOR,
      );
    });

    it('rejects an illegal transition for the derived status', async () => {
      mockClaimModel.findByPk.mockResolvedValue({
        id: CLAIM_ID,
        physicalDriveId: DRIVE_ID,
      });
      stubLatestEvents({
        id: 'e1',
        eventType: WarrantyClaimEventType.CLOSED,
        eventTimestamp: new Date('2026-01-01T00:00:00.000Z'),
      });

      await expect(
        service.recordEvent(CLAIM_ID, {
          eventType: WarrantyClaimEventType.APPROVED,
        }),
      ).rejects.toThrow(ConflictException);
      expect(mockEventModel.create).not.toHaveBeenCalled();
    });

    it('rejects a timestamp that precedes the latest event', async () => {
      mockClaimModel.findByPk.mockResolvedValue({
        id: CLAIM_ID,
        physicalDriveId: DRIVE_ID,
      });
      stubLatestEvents({
        id: 'e1',
        eventType: WarrantyClaimEventType.SHIPPED_TO_VENDOR,
        eventTimestamp: new Date('2026-06-01T00:00:00.000Z'),
      });

      await expect(
        service.recordEvent(CLAIM_ID, {
          eventType: WarrantyClaimEventType.APPROVED,
          eventTimestamp: '2026-01-01T00:00:00.000Z',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('requires a replacement drive for REPLACEMENT_RECEIVED', async () => {
      mockClaimModel.findByPk.mockResolvedValue({
        id: CLAIM_ID,
        physicalDriveId: DRIVE_ID,
      });
      stubLatestEvents({
        id: 'e1',
        eventType: WarrantyClaimEventType.APPROVED,
        eventTimestamp: new Date('2026-01-01T00:00:00.000Z'),
      });

      await expect(
        service.recordEvent(CLAIM_ID, {
          eventType: WarrantyClaimEventType.REPLACEMENT_RECEIVED,
        }),
      ).rejects.toThrow(/replacementPhysicalDriveId is required/);
    });

    it('rejects a replacement on a non-replacement event', async () => {
      mockClaimModel.findByPk.mockResolvedValue({
        id: CLAIM_ID,
        physicalDriveId: DRIVE_ID,
      });
      stubLatestEvents(null);

      await expect(
        service.recordEvent(CLAIM_ID, {
          eventType: WarrantyClaimEventType.SHIPPED_TO_VENDOR,
          replacementPhysicalDriveId: REPLACEMENT_ID,
        }),
      ).rejects.toThrow(/only allowed for REPLACEMENT_RECEIVED/);
    });
  });
});
