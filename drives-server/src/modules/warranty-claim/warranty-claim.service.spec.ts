import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken, getConnectionToken } from '@nestjs/sequelize';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { WarrantyClaimService } from './warranty-claim.service';
import {
  WarrantyClaim,
  WarrantyClaimStatus,
} from './entities/warranty-claim.entity';
import { WarrantyClaimEventService } from './warranty-claim-event.service';
import { WarrantyClaimEventType } from './entities/warranty-claim-event.entity';
import { PhysicalDrive } from '../physical-drive/entities/physical-drive.entity';
import { PhysicalDriveLocation } from '../physical-drive/entities/physical-drive-location.entity';
import {
  DriveLifecycleEvent,
  DriveLifecycleEventType,
  DriveLifecycleState,
} from '../drive-lifecycle-event/entities/drive-lifecycle-event.entity';
import { DriveLifecycleEventService } from '../drive-lifecycle-event/drive-lifecycle-event.service';
import { ServerSlotAllocationService } from '../server-slot-allocation/server-slot-allocation.service';
import { Vendor } from '../vendor/entities/vendor.entity';
import { PaginationService } from '../pagination/pagination.service';
import { CreateWarrantyClaimDto } from './dto/create-warranty-claim.dto';
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';

describe('WarrantyClaimService', () => {
  let service: WarrantyClaimService;

  let mockWarrantyClaimModel: Record<string, Mock>;
  let mockPhysicalDriveModel: Record<string, Mock>;
  let mockEventModel: Record<string, Mock>;
  let mockVendorModel: Record<string, Mock>;
  let mockLocationModel: Record<string, Mock>;
  let mockWarrantyClaimEventService: {
    getStatusMap: Mock;
    getActiveClaimForDrive: Mock;
    recordEventInTransaction: Mock;
  };
  let mockLifecycleService: {
    recordEventInTransaction: Mock;
    getCurrentLifecycleMap: Mock;
  };
  let mockAllocationService: { getCurrentAssignmentsForDrives: Mock };
  let mockSequelize: { transaction: Mock };
  let mockPaginationService: { paginate: Mock };

  const mockTransaction = { LOCK: { UPDATE: 'UPDATE' } };

  beforeEach(async () => {
    mockWarrantyClaimModel = {
      findOne: vi.fn(),
      findByPk: vi.fn(),
      create: vi.fn(),
      destroy: vi.fn(),
    };
    mockPhysicalDriveModel = { findByPk: vi.fn() };
    mockEventModel = { findByPk: vi.fn() };
    mockVendorModel = { findByPk: vi.fn() };
    mockLocationModel = { findOne: vi.fn() };

    mockWarrantyClaimEventService = {
      getStatusMap: vi.fn((ids: string[]) => {
        const map = new Map();
        for (const id of ids) {
          map.set(id, { status: WarrantyClaimStatus.SUBMITTED });
        }
        return Promise.resolve(map);
      }),
      getActiveClaimForDrive: vi.fn().mockResolvedValue(null),
      recordEventInTransaction: vi.fn().mockResolvedValue({}),
    };

    mockLifecycleService = {
      recordEventInTransaction: vi
        .fn()
        .mockResolvedValue({ currentEvent: { id: 'rma-event' } }),
      getCurrentLifecycleMap: vi.fn().mockResolvedValue(new Map()),
    };

    mockAllocationService = {
      getCurrentAssignmentsForDrives: vi.fn().mockResolvedValue(new Map()),
    };

    mockSequelize = {
      transaction: vi.fn((cb: (transaction: unknown) => unknown) =>
        Promise.resolve(cb(mockTransaction)),
      ),
    };

    mockPaginationService = { paginate: vi.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WarrantyClaimService,
        {
          provide: getModelToken(WarrantyClaim),
          useValue: mockWarrantyClaimModel,
        },
        {
          provide: getModelToken(PhysicalDrive),
          useValue: mockPhysicalDriveModel,
        },
        {
          provide: getModelToken(DriveLifecycleEvent),
          useValue: mockEventModel,
        },
        { provide: getModelToken(Vendor), useValue: mockVendorModel },
        {
          provide: getModelToken(PhysicalDriveLocation),
          useValue: mockLocationModel,
        },
        {
          provide: WarrantyClaimEventService,
          useValue: mockWarrantyClaimEventService,
        },
        {
          provide: DriveLifecycleEventService,
          useValue: mockLifecycleService,
        },
        {
          provide: ServerSlotAllocationService,
          useValue: mockAllocationService,
        },
        { provide: PaginationService, useValue: mockPaginationService },
        { provide: getConnectionToken(), useValue: mockSequelize },
      ],
    }).compile();

    service = module.get<WarrantyClaimService>(WarrantyClaimService);
    vi.clearAllMocks();
  });

  describe('findAll', () => {
    it('delegates pagination and stamps the derived status onto each claim', async () => {
      const claim = {
        id: 'claim-1',
        createdAt: new Date('2026-02-01T00:00:00.000Z'),
        setDataValue: vi.fn(),
      };
      mockPaginationService.paginate.mockResolvedValue({
        data: [claim],
        meta: {},
      });
      mockWarrantyClaimEventService.getStatusMap.mockResolvedValue(
        new Map([
          [
            'claim-1',
            {
              status: WarrantyClaimStatus.CLOSED,
              eventId: 'event-9',
              eventType: WarrantyClaimEventType.CLOSED,
              eventTimestamp: new Date('2026-03-01T00:00:00.000Z'),
              performedByUserId: null,
            },
          ],
        ]),
      );

      const result = await service.findAll({ pageNumber: 1, pageSize: 10 });

      expect(result.data).toEqual([claim]);
      expect(mockWarrantyClaimEventService.getStatusMap).toHaveBeenCalledWith([
        'claim-1',
      ]);
      expect(claim.setDataValue).toHaveBeenCalledWith(
        'currentStatus',
        WarrantyClaimStatus.CLOSED,
      );
      expect(claim.setDataValue).toHaveBeenCalledWith(
        'resolvedAt',
        new Date('2026-03-01T00:00:00.000Z'),
      );
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when the claim does not exist', async () => {
      mockWarrantyClaimModel.findByPk.mockResolvedValue(null);
      await expect(service.findOne('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    const createDto: CreateWarrantyClaimDto = {
      physicalDriveId: 'drive-uuid',
      triggeringEventId: 'event-uuid',
      handledByVendorId: 'vendor-uuid',
      rmaTrackingNumber: 'RMA123456',
      notes: 'Drive failing SMART test',
    };

    it('creates and reloads a warranty claim if all foreign keys exist', async () => {
      const reloaded = {
        id: 'claim-uuid',
        createdAt: new Date(),
        setDataValue: vi.fn(),
      };
      const mockReload = vi.fn().mockResolvedValue(reloaded);

      mockPhysicalDriveModel.findByPk.mockResolvedValue({ id: 'drive-uuid' });
      mockEventModel.findByPk.mockResolvedValue({ id: 'event-uuid' });
      mockVendorModel.findByPk.mockResolvedValue({ id: 'vendor-uuid' });
      mockWarrantyClaimModel.create.mockResolvedValue({
        id: 'claim-uuid',
        reload: mockReload,
      });

      const result = await service.create(createDto);

      expect(result).toBe(reloaded);
      expect(mockWarrantyClaimModel.create).toHaveBeenCalledWith(createDto);
      expect(mockReload).toHaveBeenCalledWith({
        include: [PhysicalDrive, DriveLifecycleEvent, Vendor],
      });
    });

    it('aggregates multiple missing foreign keys into one NotFoundException', async () => {
      mockPhysicalDriveModel.findByPk.mockResolvedValue(null);
      mockEventModel.findByPk.mockResolvedValue({ id: 'event-uuid' });
      mockVendorModel.findByPk.mockResolvedValue(null);

      const expectedErrorMessage = [
        'PhysicalDrive with ID drive-uuid not found',
        'Vendor with ID vendor-uuid not found',
      ].join('\n');

      await expect(service.create(createDto)).rejects.toThrow(
        new NotFoundException(expectedErrorMessage),
      );
    });
  });

  describe('openClaim', () => {
    const dto = {
      datacenterId: 'dc-1',
      physicalDriveId: 'drive-1',
      handledByVendorId: 'vendor-1',
      rmaTrackingNumber: 'RMA-1',
      notes: 'n',
    };
    const drive = { id: 'drive-1' };
    const claim = { id: 'claim-1', setDataValue: vi.fn() };

    const setup = (state: DriveLifecycleState) => {
      mockPhysicalDriveModel.findByPk.mockResolvedValue(drive);
      mockWarrantyClaimModel.findByPk.mockResolvedValue(claim);
      mockVendorModel.findByPk.mockResolvedValue({ id: 'vendor-1' });
      mockAllocationService.getCurrentAssignmentsForDrives.mockResolvedValue(
        new Map(),
      );
      mockLocationModel.findOne.mockResolvedValue({ datacenterId: 'dc-1' });
      mockLifecycleService.getCurrentLifecycleMap.mockResolvedValue(
        new Map([['drive-1', { state }]]),
      );
      mockWarrantyClaimModel.create.mockResolvedValue(claim);
    };

    it('deprovisions an IN_SERVICE drive, initiates RMA and creates the claim', async () => {
      setup(DriveLifecycleState.IN_SERVICE);

      const result = await service.openClaim(dto, 'user-1');

      expect(result).toBe(claim);
      expect(
        (
          mockLifecycleService.recordEventInTransaction.mock
            .calls as unknown[][]
        ).map(
          (call) =>
            (call[1] as { eventType: DriveLifecycleEventType }).eventType,
        ),
      ).toEqual([
        DriveLifecycleEventType.DEPROVISION,
        DriveLifecycleEventType.RMA_INITIATE,
      ]);
      expect(mockWarrantyClaimModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          physicalDriveId: 'drive-1',
          triggeringEventId: 'rma-event',
          handledByVendorId: 'vendor-1',
          rmaTrackingNumber: 'RMA-1',
          notes: 'n',
        }),
        { transaction: mockTransaction },
      );
      expect(
        mockWarrantyClaimEventService.recordEventInTransaction,
      ).toHaveBeenCalledWith(
        'claim-1',
        expect.objectContaining({
          eventType: WarrantyClaimEventType.NOTE,
        }),
        { performedByUserId: 'user-1' },
        mockTransaction,
      );
    });

    it('sends a FAILED drive directly to RMA', async () => {
      setup(DriveLifecycleState.FAILED);

      await service.openClaim(dto, 'user-1');

      const calls = mockLifecycleService.recordEventInTransaction.mock
        .calls as unknown[][];
      expect(calls).toHaveLength(1);
      expect(
        (calls[0][1] as { eventType: DriveLifecycleEventType }).eventType,
      ).toBe(DriveLifecycleEventType.RMA_INITIATE);
    });

    it('rejects a drive that already has an open warranty claim', async () => {
      setup(DriveLifecycleState.IN_SERVICE);
      mockWarrantyClaimEventService.getActiveClaimForDrive.mockResolvedValue({
        id: 'claim-existing',
        status: WarrantyClaimStatus.SHIPPED_TO_VENDOR,
      });

      await expect(service.openClaim(dto, 'user-1')).rejects.toThrow(
        ConflictException,
      );
      expect(mockWarrantyClaimModel.create).not.toHaveBeenCalled();
    });

    it('rejects a drive whose warranty has expired', async () => {
      setup(DriveLifecycleState.IN_SERVICE);
      mockPhysicalDriveModel.findByPk.mockResolvedValue({
        id: 'drive-1',
        warrantyExpiryDate: '2000-01-01',
      });

      await expect(service.openClaim(dto, 'user-1')).rejects.toThrow(
        ConflictException,
      );
      expect(mockWarrantyClaimModel.create).not.toHaveBeenCalled();
    });

    it('rejects a drive that is still seated in a server', async () => {
      setup(DriveLifecycleState.IN_SERVICE);
      mockAllocationService.getCurrentAssignmentsForDrives.mockResolvedValue(
        new Map([['drive-1', { serverHostname: 'host-1', slotLabel: 'S1' }]]),
      );

      await expect(service.openClaim(dto, 'user-1')).rejects.toThrow(
        ConflictException,
      );
      expect(mockWarrantyClaimModel.create).not.toHaveBeenCalled();
    });

    it('rejects a drive outside the selected datacenter', async () => {
      setup(DriveLifecycleState.IN_SERVICE);
      mockLocationModel.findOne.mockResolvedValue({ datacenterId: 'dc-2' });

      await expect(service.openClaim(dto, 'user-1')).rejects.toThrow(
        ConflictException,
      );
      expect(mockWarrantyClaimModel.create).not.toHaveBeenCalled();
    });

    it('rejects a lifecycle state that cannot enter RMA', async () => {
      setup(DriveLifecycleState.RETIRED);

      await expect(service.openClaim(dto, 'user-1')).rejects.toThrow(
        ConflictException,
      );
      expect(mockWarrantyClaimModel.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('throws NotFoundException if an updated foreign key is not found', async () => {
      const mockInstance = { id: 'claim-uuid' };
      mockWarrantyClaimModel.findByPk.mockResolvedValue(mockInstance);
      mockVendorModel.findByPk.mockResolvedValue(null);

      await expect(
        service.update('claim-uuid', { handledByVendorId: 'missing-vendor' }),
      ).rejects.toThrow(
        new NotFoundException('Vendor with ID missing-vendor not found'),
      );
    });
  });
});
