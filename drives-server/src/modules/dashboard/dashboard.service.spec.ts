import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DashboardService } from './dashboard.service';
import { PhysicalDrive } from '../physical-drive/entities/physical-drive.entity';
import { PhysicalServer } from '../physical-server/entities/physical-server.entity';
import { Datacenter } from '../datacenter/entities/datacenter.entity';
import { Currency } from '../currency/entities/currency.entity';
import { WarrantyClaim } from '../warranty-claim/entities/warranty-claim.entity';
import { WarrantyClaimEvent } from '../warranty-claim/entities/warranty-claim-event.entity';
import { DriveLifecycleEvent } from '../drive-lifecycle-event/entities/drive-lifecycle-event.entity';
import { PhysicalDriveService } from '../physical-drive/physical-drive.service';
import { DriveLifecycleEventService } from '../drive-lifecycle-event/drive-lifecycle-event.service';
import { WarrantyClaimEventService } from '../warranty-claim/warranty-claim-event.service';
import { ServerSlotAllocationService } from '../server-slot-allocation/server-slot-allocation.service';
import { ExchangeRateService } from '../exchange-rate/exchange-rate.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let physicalDriveModel: { findAll: ReturnType<typeof vi.fn> };
  let physicalServerModel: { findAll: ReturnType<typeof vi.fn> };
  let datacenterModel: { findAll: ReturnType<typeof vi.fn> };
  let currencyModel: { findAll: ReturnType<typeof vi.fn> };
  let warrantyClaimModel: { findAll: ReturnType<typeof vi.fn> };
  let warrantyClaimEventModel: { findAll: ReturnType<typeof vi.fn> };
  let driveLifecycleEventModel: { findAll: ReturnType<typeof vi.fn> };
  let physicalDriveService: {
    getCurrentLocationMap: ReturnType<typeof vi.fn>;
  };
  let lifecycleService: {
    getCurrentLifecycleMap: ReturnType<typeof vi.fn>;
  };
  let warrantyEventService: { getStatusMap: ReturnType<typeof vi.fn> };
  let allocationService: {
    getCurrentAssignmentsForDrives: ReturnType<typeof vi.fn>;
  };
  let exchangeRateService: { getLatestRates: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-20T12:00:00.000Z'));

    physicalDriveModel = { findAll: vi.fn() };
    physicalServerModel = { findAll: vi.fn() };
    datacenterModel = { findAll: vi.fn() };
    currencyModel = { findAll: vi.fn() };
    warrantyClaimModel = { findAll: vi.fn() };
    warrantyClaimEventModel = { findAll: vi.fn() };
    driveLifecycleEventModel = { findAll: vi.fn() };
    physicalDriveService = { getCurrentLocationMap: vi.fn() };
    lifecycleService = { getCurrentLifecycleMap: vi.fn() };
    warrantyEventService = { getStatusMap: vi.fn() };
    allocationService = { getCurrentAssignmentsForDrives: vi.fn() };
    exchangeRateService = { getLatestRates: vi.fn() };

    physicalDriveModel.findAll.mockResolvedValue([
      {
        id: 'drive-1',
        serialNumber: 'SN-1',
        label: 'LABEL-1',
        acquisitionCost: '100.50',
        purchaseDate: '2024-01-01',
        warrantyExpiryDate: '2026-11-01',
        currencyId: 'usd',
      },
      {
        id: 'drive-2',
        serialNumber: 'SN-2',
        label: 'LABEL-2',
        acquisitionCost: '200',
        purchaseDate: '2020-01-01',
        warrantyExpiryDate: '2025-01-01',
        currencyId: 'eur',
      },
      {
        id: 'drive-3',
        serialNumber: 'SN-3',
        label: 'LABEL-3',
        acquisitionCost: '300',
        purchaseDate: '2021-06-01',
        warrantyExpiryDate: '2027-01-01',
        currencyId: 'usd',
      },
    ]);
    physicalDriveService.getCurrentLocationMap.mockResolvedValue(
      new Map([
        [
          'drive-1',
          { datacenterId: 'dc-1', code: 'VA-ASH-1', name: 'Ashburn' },
        ],
        [
          'drive-2',
          { datacenterId: 'dc-1', code: 'VA-ASH-1', name: 'Ashburn' },
        ],
        ['drive-3', null],
      ]),
    );
    lifecycleService.getCurrentLifecycleMap.mockResolvedValue(
      new Map([
        ['drive-1', { state: 'IN_SERVICE' }],
        ['drive-2', { state: 'FAILED' }],
        ['drive-3', { state: 'IN_RMA' }],
      ]),
    );
    allocationService.getCurrentAssignmentsForDrives.mockResolvedValue(
      new Map([
        [
          'drive-1',
          {
            allocationId: 'a-1',
            slotId: 'slot-1',
            slotLabel: 'Bay 1',
            serverId: 'server-1',
            serverHostname: 'host-1',
            assignedAt: new Date(),
          },
        ],
      ]),
    );
    currencyModel.findAll.mockResolvedValue([
      { id: 'usd', code: 'USD', symbol: '$' },
      { id: 'eur', code: 'EUR', symbol: '€' },
    ]);
    exchangeRateService.getLatestRates.mockResolvedValue(
      new Map([
        [
          'usd',
          {
            currencyId: 'usd',
            rateToUsd: 1,
            effectiveAt: new Date('2026-10-01T00:00:00.000Z'),
            source: 'seed',
          },
        ],
        [
          'eur',
          {
            currencyId: 'eur',
            rateToUsd: 1.08,
            effectiveAt: new Date('2026-10-01T00:00:00.000Z'),
            source: 'seed',
          },
        ],
      ]),
    );
    datacenterModel.findAll.mockResolvedValue([
      { id: 'dc-1', code: 'VA-ASH-1', name: 'Ashburn' },
      { id: 'dc-2', code: 'GB-SLO-1', name: 'Slough' },
    ]);
    physicalServerModel.findAll.mockResolvedValue([
      {
        id: 'server-1',
        hostname: 'host-1',
        rack: { datacenterId: 'dc-1' },
        slots: [{ id: 'slot-1' }, { id: 'slot-2' }],
      },
      {
        id: 'server-2',
        hostname: 'host-2',
        rack: { datacenterId: 'dc-2' },
        slots: [{ id: 'slot-3' }],
      },
    ]);
    warrantyClaimModel.findAll.mockResolvedValue([
      {
        id: 'claim-1',
        physicalDriveId: 'drive-2',
        rmaTrackingNumber: 'RMA-1',
        createdAt: new Date('2026-09-01T00:00:00.000Z'),
      },
      {
        id: 'claim-2',
        physicalDriveId: 'drive-3',
        rmaTrackingNumber: 'RMA-2',
        createdAt: new Date('2026-08-01T00:00:00.000Z'),
      },
    ]);
    warrantyEventService.getStatusMap.mockResolvedValue(
      new Map([
        [
          'claim-1',
          {
            status: 'SHIPPED_TO_VENDOR',
            eventTimestamp: new Date('2026-10-01T00:00:00.000Z'),
          },
        ],
        [
          'claim-2',
          {
            status: 'CLOSED',
            eventTimestamp: new Date('2026-10-10T00:00:00.000Z'),
          },
        ],
      ]),
    );
    driveLifecycleEventModel.findAll.mockResolvedValue([
      {
        id: 'event-drive',
        eventType: 'FAIL',
        eventTimestamp: new Date('2026-10-15T00:00:00.000Z'),
        triggeredBy: 'tester',
        physicalDriveId: 'drive-2',
        physicalDrive: {
          id: 'drive-2',
          serialNumber: 'SN-2',
          label: 'LABEL-2',
        },
      },
    ]);
    warrantyClaimEventModel.findAll.mockResolvedValue([
      {
        id: 'event-claim',
        eventType: 'SHIPPED_TO_VENDOR',
        eventTimestamp: new Date('2026-10-19T00:00:00.000Z'),
        notes: 'Sent to vendor',
        warrantyClaimId: 'claim-1',
        warrantyClaim: {
          id: 'claim-1',
          rmaTrackingNumber: 'RMA-1',
          physicalDriveId: 'drive-2',
          physicalDrive: {
            id: 'drive-2',
            serialNumber: 'SN-2',
            label: 'LABEL-2',
          },
        },
      },
    ]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: getModelToken(PhysicalDrive),
          useValue: physicalDriveModel,
        },
        {
          provide: getModelToken(PhysicalServer),
          useValue: physicalServerModel,
        },
        { provide: getModelToken(Datacenter), useValue: datacenterModel },
        { provide: getModelToken(Currency), useValue: currencyModel },
        { provide: getModelToken(WarrantyClaim), useValue: warrantyClaimModel },
        {
          provide: getModelToken(WarrantyClaimEvent),
          useValue: warrantyClaimEventModel,
        },
        {
          provide: getModelToken(DriveLifecycleEvent),
          useValue: driveLifecycleEventModel,
        },
        { provide: PhysicalDriveService, useValue: physicalDriveService },
        { provide: DriveLifecycleEventService, useValue: lifecycleService },
        { provide: WarrantyClaimEventService, useValue: warrantyEventService },
        { provide: ServerSlotAllocationService, useValue: allocationService },
        { provide: ExchangeRateService, useValue: exchangeRateService },
      ],
    }).compile();

    service = module.get(DashboardService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('aggregates warranty, lifecycle, slot and datacenter health', async () => {
    const summary = await service.getSummary();

    expect(summary.driveDistribution).toEqual({
      total: 3,
      assigned: 2,
      unassigned: 1,
      byDatacenter: [
        {
          datacenterId: 'dc-1',
          code: 'VA-ASH-1',
          name: 'Ashburn',
          count: 2,
        },
      ],
    });

    expect(summary.warrantyWatchlist).toMatchObject({
      activeWarranties: 2,
      expiredWarranties: 1,
      within30Days: 1,
      within60Days: 1,
      within90Days: 2,
      openClaims: 1,
    });
    expect(summary.warrantyWatchlist.nextExpirations[0]).toEqual(
      expect.objectContaining({
        driveId: 'drive-1',
        serialNumber: 'SN-1',
        daysRemaining: 12,
        datacenterCode: 'VA-ASH-1',
      }),
    );

    expect(summary.lifecycleHealth).toEqual({
      total: 3,
      byState: [
        { state: 'IN_SERVICE', count: 1 },
        { state: 'FAILED', count: 1 },
        { state: 'IN_RMA', count: 1 },
      ],
    });

    expect(summary.slotUtilization).toMatchObject({
      totalSlots: 3,
      occupiedSlots: 1,
      freeSlots: 2,
      utilizationPercent: 33,
      unseatedDrives: 2,
      serversWithFreeSlots: 2,
    });
    expect(summary.slotUtilization.topServersByFreeSlots[0]).toMatchObject({
      hostname: 'host-1',
      freeSlots: 1,
    });

    expect(summary.datacenterHealth.unassignedDrives).toBe(1);
    expect(
      summary.datacenterHealth.datacenters.find(
        (row) => row.datacenterId === 'dc-1',
      ),
    ).toMatchObject({
      drives: 2,
      inService: 1,
      failed: 1,
      inRma: 0,
      unseated: 1,
      totalSlots: 2,
      occupiedSlots: 1,
    });
  });

  it('aggregates capital/age and RMA pipeline figures', async () => {
    const summary = await service.getSummary();

    expect(summary.capitalAge.totalDrives).toBe(3);
    expect(summary.capitalAge.totalValueUsd).toBe(616.5);
    expect(summary.capitalAge.convertedDrives).toBe(3);
    expect(summary.capitalAge.unconvertedDrives).toBe(0);
    expect(summary.capitalAge.costByCurrency).toEqual([
      {
        currencyId: 'usd',
        code: 'USD',
        symbol: '$',
        totalCost: 400.5,
        exchangeRateToUsd: 1,
        rateEffectiveAt: '2026-10-01T00:00:00.000Z',
        totalCostUsd: 400.5,
      },
      {
        currencyId: 'eur',
        code: 'EUR',
        symbol: '€',
        totalCost: 200,
        exchangeRateToUsd: 1.08,
        rateEffectiveAt: '2026-10-01T00:00:00.000Z',
        totalCostUsd: 216,
      },
    ]);
    expect(summary.capitalAge.oldestInUseDrives).toHaveLength(1);
    expect(summary.capitalAge.oldestInUseDrives[0]).toMatchObject({
      driveId: 'drive-1',
      serialNumber: 'SN-1',
      datacenterCode: 'VA-ASH-1',
      lifecycleState: 'IN_SERVICE',
    });
    expect(summary.capitalAge.averageAgeYears).toBeGreaterThan(4);
    expect(summary.capitalAge.ageBuckets).toEqual([
      { key: '<1', label: 'Under 1 year', count: 0 },
      { key: '1-3', label: '1–3 years', count: 1 },
      { key: '3-5', label: '3–5 years', count: 0 },
      { key: '5+', label: '5+ years', count: 2 },
    ]);
    expect(summary.capitalAge.byPurchaseYear).toEqual([
      { year: 2024, count: 1 },
      { year: 2021, count: 1 },
      { year: 2020, count: 1 },
    ]);

    expect(summary.rmaPipeline.totalClaims).toBe(2);
    expect(summary.rmaPipeline.openClaims).toBe(1);
    expect(
      summary.rmaPipeline.byStatus.find(
        (row) => row.status === 'SHIPPED_TO_VENDOR',
      ),
    ).toEqual({
      status: 'SHIPPED_TO_VENDOR',
      count: 1,
      averageDaysInStatus: 19,
    });
    expect(
      summary.rmaPipeline.byStatus.find((row) => row.status === 'CLOSED'),
    ).toEqual({
      status: 'CLOSED',
      count: 1,
      averageDaysInStatus: null,
    });
    expect(summary.rmaPipeline.averageResolutionDays).toBe(70);
  });

  it('excludes drives whose currency has no configured USD rate', async () => {
    physicalDriveModel.findAll.mockResolvedValue([
      {
        id: 'drive-1',
        serialNumber: 'SN-1',
        label: 'LABEL-1',
        acquisitionCost: '100',
        purchaseDate: '2024-01-01',
        warrantyExpiryDate: '2026-11-01',
        currencyId: 'gbp',
      },
    ]);
    currencyModel.findAll.mockResolvedValue([
      { id: 'gbp', code: 'GBP', symbol: '£' },
    ]);
    exchangeRateService.getLatestRates.mockResolvedValue(new Map());

    const summary = await service.getSummary();

    expect(summary.capitalAge.totalValueUsd).toBe(0);
    expect(summary.capitalAge.convertedDrives).toBe(0);
    expect(summary.capitalAge.unconvertedDrives).toBe(1);
    expect(summary.capitalAge.costByCurrency[0]).toMatchObject({
      code: 'GBP',
      exchangeRateToUsd: null,
      totalCostUsd: null,
    });
  });

  it('merges the newest lifecycle and warranty events into one feed', async () => {
    const summary = await service.getSummary();

    expect(summary.recentActivity).toHaveLength(2);
    expect(summary.recentActivity[0]).toMatchObject({
      kind: 'WARRANTY',
      eventType: 'SHIPPED_TO_VENDOR',
      driveSerialNumber: 'SN-2',
      warrantyClaimId: 'claim-1',
    });
    expect(summary.recentActivity[1]).toMatchObject({
      kind: 'DRIVE',
      eventType: 'FAIL',
      triggeredBy: 'tester',
    });
  });
});
