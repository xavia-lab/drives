import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { NotFoundException } from '@nestjs/common';
import { WarrantyClaimService } from './warranty-claim.service';
import {
  WarrantyClaim,
  WarrantyClaimStatus,
} from './entities/warranty-claim.entity';
import { WarrantyClaimEventService } from './warranty-claim-event.service';
import { WarrantyClaimEventType } from './entities/warranty-claim-event.entity';
import { PhysicalDrive } from '../physical-drive/entities/physical-drive.entity';
import { DriveLifecycleEvent } from '../drive-lifecycle-event/entities/drive-lifecycle-event.entity';
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
  let mockWarrantyClaimEventService: { getStatusMap: Mock };
  let mockPaginationService: { paginate: Mock };

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

    mockWarrantyClaimEventService = {
      getStatusMap: vi.fn((ids: string[]) => {
        const map = new Map();
        for (const id of ids) {
          map.set(id, { status: WarrantyClaimStatus.SUBMITTED });
        }
        return Promise.resolve(map);
      }),
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
          provide: WarrantyClaimEventService,
          useValue: mockWarrantyClaimEventService,
        },
        { provide: PaginationService, useValue: mockPaginationService },
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
