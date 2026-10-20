import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { PhysicalDrive } from '../physical-drive/entities/physical-drive.entity';
import { PhysicalDriveService } from '../physical-drive/physical-drive.service';
import { PhysicalServer } from '../physical-server/entities/physical-server.entity';
import { ServerSlot } from '../physical-server/entities/server-slot.entity';
import { Rack } from '../rack/entities/rack.entity';
import { Datacenter } from '../datacenter/entities/datacenter.entity';
import { Currency } from '../currency/entities/currency.entity';
import {
  WarrantyClaim,
  WarrantyClaimStatus,
} from '../warranty-claim/entities/warranty-claim.entity';
import { WarrantyClaimEvent } from '../warranty-claim/entities/warranty-claim-event.entity';
import { WarrantyClaimEventService } from '../warranty-claim/warranty-claim-event.service';
import {
  DriveLifecycleEvent,
  DriveLifecycleState,
} from '../drive-lifecycle-event/entities/drive-lifecycle-event.entity';
import { DriveLifecycleEventService } from '../drive-lifecycle-event/drive-lifecycle-event.service';
import { ServerSlotAllocationService } from '../server-slot-allocation/server-slot-allocation.service';
import {
  ExchangeRateService,
  type LatestExchangeRate,
} from '../exchange-rate/exchange-rate.service';
import {
  DashboardSummaryResponseDto,
  DatacenterHealthDto,
  DriveDistributionDto,
  LifecycleHealthDto,
  RmaPipelineDto,
  RecentActivityDto,
  SlotUtilizationDto,
  WarrantyWatchlistDto,
  CapitalAgeDto,
} from './dto/response/dashboard-summary-response.dto';

const MS_PER_DAY = 86_400_000;
const MS_PER_YEAR = MS_PER_DAY * 365.25;
const ACTIVITY_LIMIT = 8;

const LIFECYCLE_STATE_ORDER: DriveLifecycleState[] = [
  DriveLifecycleState.UNRECEIVED,
  DriveLifecycleState.RECEIVED,
  DriveLifecycleState.IN_INVENTORY,
  DriveLifecycleState.IN_SERVICE,
  DriveLifecycleState.DEGRADED,
  DriveLifecycleState.FAILED,
  DriveLifecycleState.IN_RMA,
  DriveLifecycleState.RETIRED,
  DriveLifecycleState.SCRAPPED,
  DriveLifecycleState.REPLACED,
  DriveLifecycleState.LOST,
];

const RMA_STATUS_ORDER: WarrantyClaimStatus[] = [
  WarrantyClaimStatus.SUBMITTED,
  WarrantyClaimStatus.SHIPPED_TO_VENDOR,
  WarrantyClaimStatus.APPROVED,
  WarrantyClaimStatus.REJECTED,
  WarrantyClaimStatus.REPLACEMENT_RECEIVED,
  WarrantyClaimStatus.CLOSED,
];

const AGE_BUCKETS = [
  { key: '<1', label: 'Under 1 year', max: 1 },
  { key: '1-3', label: '1–3 years', max: 3 },
  { key: '3-5', label: '3–5 years', max: 5 },
  { key: '5+', label: '5+ years', max: Number.POSITIVE_INFINITY },
];

const round = (value: number, precision = 1): number => {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
};

const startOfUtcDay = (date: Date): number =>
  Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());

// Sequelize returns DATEONLY columns as `YYYY-MM-DD` strings (and sometimes as
// Date objects in tests), so normalize both to a UTC day boundary.
const parseDateOnlyUtc = (value: string | Date): number => {
  if (value instanceof Date) {
    return startOfUtcDay(value);
  }

  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  return Date.UTC(year, (month ?? 1) - 1, day ?? 1);
};

const daysBetween = (from: string | Date, to: number): number =>
  Math.floor((to - new Date(from).getTime()) / MS_PER_DAY);

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(PhysicalDrive)
    private readonly physicalDriveModel: typeof PhysicalDrive,
    @InjectModel(PhysicalServer)
    private readonly physicalServerModel: typeof PhysicalServer,
    @InjectModel(Datacenter)
    private readonly datacenterModel: typeof Datacenter,
    @InjectModel(Currency)
    private readonly currencyModel: typeof Currency,
    @InjectModel(WarrantyClaim)
    private readonly warrantyClaimModel: typeof WarrantyClaim,
    @InjectModel(WarrantyClaimEvent)
    private readonly warrantyClaimEventModel: typeof WarrantyClaimEvent,
    @InjectModel(DriveLifecycleEvent)
    private readonly driveLifecycleEventModel: typeof DriveLifecycleEvent,
    private readonly physicalDriveService: PhysicalDriveService,
    private readonly lifecycleService: DriveLifecycleEventService,
    private readonly warrantyEventService: WarrantyClaimEventService,
    private readonly allocationService: ServerSlotAllocationService,
    private readonly exchangeRateService: ExchangeRateService,
  ) {}

  async getSummary(): Promise<DashboardSummaryResponseDto> {
    const drives = await this.physicalDriveModel.findAll({
      attributes: [
        'id',
        'serialNumber',
        'label',
        'acquisitionCost',
        'purchaseDate',
        'warrantyExpiryDate',
        'currencyId',
      ],
    });
    const driveIds = drives.map((drive) => drive.id);

    const [
      currentLocations,
      lifecycles,
      assignments,
      currencies,
      exchangeRates,
      datacenters,
      servers,
      claims,
      recentLifecycleEvents,
      recentWarrantyEvents,
    ] = await Promise.all([
      this.physicalDriveService.getCurrentLocationMap(driveIds),
      this.lifecycleService.getCurrentLifecycleMap(driveIds),
      this.allocationService.getCurrentAssignmentsForDrives(driveIds),
      this.currencyModel.findAll(),
      this.exchangeRateService.getLatestRates(),
      this.datacenterModel.findAll(),
      this.physicalServerModel.findAll({
        include: [{ model: ServerSlot }, { model: Rack }],
      }),
      this.warrantyClaimModel.findAll({
        attributes: ['id', 'physicalDriveId', 'rmaTrackingNumber', 'createdAt'],
      }),
      this.driveLifecycleEventModel.findAll({
        include: [
          {
            model: PhysicalDrive,
            as: 'physicalDrive',
            attributes: ['id', 'serialNumber', 'label'],
          },
        ],
        order: [
          ['eventTimestamp', 'DESC'],
          ['displayKey', 'DESC'],
        ],
        limit: ACTIVITY_LIMIT,
      }),
      this.warrantyClaimEventModel.findAll({
        include: [
          {
            model: WarrantyClaim,
            attributes: ['id', 'rmaTrackingNumber', 'physicalDriveId'],
            include: [
              {
                model: PhysicalDrive,
                attributes: ['id', 'serialNumber', 'label'],
              },
            ],
          },
        ],
        order: [
          ['eventTimestamp', 'DESC'],
          ['displayKey', 'DESC'],
        ],
        limit: ACTIVITY_LIMIT,
      }),
    ]);

    const statusMap = await this.warrantyEventService.getStatusMap(
      claims.map((claim) => claim.id),
    );
    const now = new Date();
    const todayUtc = startOfUtcDay(now);

    const occupiedByServer = new Map<string, number>();
    for (const assignment of assignments.values()) {
      occupiedByServer.set(
        assignment.serverId,
        (occupiedByServer.get(assignment.serverId) ?? 0) + 1,
      );
    }

    const serverRows = servers.map((server) => {
      const totalSlots = server.slots?.length ?? 0;
      const occupiedSlots = occupiedByServer.get(server.id) ?? 0;

      return {
        serverId: server.id,
        hostname: server.hostname,
        datacenterId: server.rack?.datacenterId ?? null,
        totalSlots,
        occupiedSlots,
        freeSlots: Math.max(totalSlots - occupiedSlots, 0),
      };
    });

    return {
      driveDistribution: this.buildDriveDistribution(drives, currentLocations),
      warrantyWatchlist: this.buildWarrantyWatchlist(
        drives,
        currentLocations,
        claims,
        statusMap,
        todayUtc,
        now,
      ),
      lifecycleHealth: this.buildLifecycleHealth(drives.length, lifecycles),
      slotUtilization: this.buildSlotUtilization(
        drives.length,
        assignments.size,
        serverRows,
      ),
      datacenterHealth: this.buildDatacenterHealth(
        drives,
        currentLocations,
        lifecycles,
        assignments,
        datacenters,
        serverRows,
      ),
      capitalAge: this.buildCapitalAge(
        drives,
        currencies,
        lifecycles,
        currentLocations,
        assignments,
        exchangeRates,
        todayUtc,
      ),
      rmaPipeline: this.buildRmaPipeline(claims, statusMap, now),
      recentActivity: this.buildRecentActivity(
        recentLifecycleEvents,
        recentWarrantyEvents,
      ),
    };
  }

  private buildDriveDistribution(
    drives: PhysicalDrive[],
    currentLocations: Awaited<
      ReturnType<PhysicalDriveService['getCurrentLocationMap']>
    >,
  ): DriveDistributionDto {
    const byDatacenter = new Map<
      string,
      { datacenterId: string; code: string; name: string; count: number }
    >();
    let unassigned = 0;

    for (const drive of drives) {
      const location = currentLocations.get(drive.id);
      if (!location) {
        unassigned += 1;
        continue;
      }

      const entry = byDatacenter.get(location.datacenterId);
      if (entry) {
        entry.count += 1;
      } else {
        byDatacenter.set(location.datacenterId, {
          datacenterId: location.datacenterId,
          code: location.code,
          name: location.name,
          count: 1,
        });
      }
    }

    return {
      total: drives.length,
      assigned: drives.length - unassigned,
      unassigned,
      byDatacenter: [...byDatacenter.values()].sort(
        (a, b) => b.count - a.count,
      ),
    };
  }

  private buildWarrantyWatchlist(
    drives: PhysicalDrive[],
    currentLocations: Awaited<
      ReturnType<PhysicalDriveService['getCurrentLocationMap']>
    >,
    claims: WarrantyClaim[],
    statusMap: Awaited<ReturnType<WarrantyClaimEventService['getStatusMap']>>,
    todayUtc: number,
    now: Date,
  ): WarrantyWatchlistDto {
    const expirations = drives.map((drive) => ({
      driveId: drive.id,
      serialNumber: drive.serialNumber,
      label: drive.label,
      warrantyExpiryDate: String(drive.warrantyExpiryDate).slice(0, 10),
      daysRemaining: Math.round(
        (parseDateOnlyUtc(drive.warrantyExpiryDate) - todayUtc) / MS_PER_DAY,
      ),
      datacenterCode: currentLocations.get(drive.id)?.code ?? null,
    }));

    const active = expirations.filter(
      (expiration) => expiration.daysRemaining >= 0,
    );
    const openClaims = claims.filter(
      (claim) => statusMap.get(claim.id)?.status !== WarrantyClaimStatus.CLOSED,
    );
    const oldestOpenClaimDays =
      openClaims.length > 0
        ? Math.max(
            ...openClaims.map((claim) =>
              daysBetween(claim.createdAt, now.getTime()),
            ),
          )
        : null;

    return {
      activeWarranties: active.length,
      expiredWarranties: expirations.length - active.length,
      within30Days: active.filter(
        (expiration) => expiration.daysRemaining <= 30,
      ).length,
      within60Days: active.filter(
        (expiration) => expiration.daysRemaining <= 60,
      ).length,
      within90Days: active.filter(
        (expiration) => expiration.daysRemaining <= 90,
      ).length,
      openClaims: openClaims.length,
      oldestOpenClaimDays,
      nextExpirations: [...active]
        .sort((a, b) => a.daysRemaining - b.daysRemaining)
        .slice(0, 5),
    };
  }

  private buildLifecycleHealth(
    total: number,
    lifecycles: Awaited<
      ReturnType<DriveLifecycleEventService['getCurrentLifecycleMap']>
    >,
  ): LifecycleHealthDto {
    const counts = new Map<DriveLifecycleState, number>(
      LIFECYCLE_STATE_ORDER.map((state) => [state, 0]),
    );

    for (const lifecycle of lifecycles.values()) {
      const state = lifecycle?.state ?? DriveLifecycleState.UNRECEIVED;
      counts.set(state, (counts.get(state) ?? 0) + 1);
    }

    return {
      total,
      byState: LIFECYCLE_STATE_ORDER.filter(
        (state) => (counts.get(state) ?? 0) > 0,
      ).map((state) => ({
        state,
        count: counts.get(state) ?? 0,
      })),
    };
  }

  private buildSlotUtilization(
    totalDrives: number,
    occupiedSlots: number,
    servers: Array<{
      serverId: string;
      hostname: string;
      totalSlots: number;
      occupiedSlots: number;
      freeSlots: number;
    }>,
  ): SlotUtilizationDto {
    const totalSlots = servers.reduce(
      (sum, server) => sum + server.totalSlots,
      0,
    );
    const freeSlots = Math.max(totalSlots - occupiedSlots, 0);

    return {
      totalSlots,
      occupiedSlots,
      freeSlots,
      utilizationPercent:
        totalSlots > 0 ? Math.round((occupiedSlots / totalSlots) * 100) : 0,
      unseatedDrives: Math.max(totalDrives - occupiedSlots, 0),
      serversWithFreeSlots: servers.filter((server) => server.freeSlots > 0)
        .length,
      topServersByFreeSlots: [...servers]
        .filter((server) => server.totalSlots > 0)
        .sort((a, b) => b.freeSlots - a.freeSlots)
        .slice(0, 5)
        .map((server) => ({
          serverId: server.serverId,
          hostname: server.hostname,
          totalSlots: server.totalSlots,
          occupiedSlots: server.occupiedSlots,
          freeSlots: server.freeSlots,
        })),
    };
  }

  private buildDatacenterHealth(
    drives: PhysicalDrive[],
    currentLocations: Awaited<
      ReturnType<PhysicalDriveService['getCurrentLocationMap']>
    >,
    lifecycles: Awaited<
      ReturnType<DriveLifecycleEventService['getCurrentLifecycleMap']>
    >,
    assignments: Awaited<
      ReturnType<ServerSlotAllocationService['getCurrentAssignmentsForDrives']>
    >,
    datacenters: Datacenter[],
    servers: Array<{
      datacenterId: string | null;
      totalSlots: number;
      occupiedSlots: number;
    }>,
  ): { unassignedDrives: number; datacenters: DatacenterHealthDto[] } {
    const rows = new Map<string, DatacenterHealthDto>();

    for (const datacenter of datacenters) {
      rows.set(datacenter.id, {
        datacenterId: datacenter.id,
        code: datacenter.code,
        name: datacenter.name,
        drives: 0,
        inService: 0,
        degraded: 0,
        failed: 0,
        inRma: 0,
        unseated: 0,
        totalSlots: 0,
        occupiedSlots: 0,
      });
    }

    let unassignedDrives = 0;

    for (const drive of drives) {
      const location = currentLocations.get(drive.id);
      if (!location) {
        unassignedDrives += 1;
        continue;
      }

      const row =
        rows.get(location.datacenterId) ??
        rows
          .set(location.datacenterId, {
            datacenterId: location.datacenterId,
            code: location.code,
            name: location.name,
            drives: 0,
            inService: 0,
            degraded: 0,
            failed: 0,
            inRma: 0,
            unseated: 0,
            totalSlots: 0,
            occupiedSlots: 0,
          })
          .get(location.datacenterId);

      if (!row) continue;

      row.drives += 1;
      const state = lifecycles.get(drive.id)?.state;
      if (state === DriveLifecycleState.IN_SERVICE) row.inService += 1;
      if (state === DriveLifecycleState.DEGRADED) row.degraded += 1;
      if (state === DriveLifecycleState.FAILED) row.failed += 1;
      if (state === DriveLifecycleState.IN_RMA) row.inRma += 1;
      if (!assignments.has(drive.id)) row.unseated += 1;
    }

    for (const server of servers) {
      if (!server.datacenterId) continue;
      const row = rows.get(server.datacenterId);
      if (!row) continue;
      row.totalSlots += server.totalSlots;
      row.occupiedSlots += server.occupiedSlots;
    }

    return {
      unassignedDrives,
      datacenters: [...rows.values()].sort(
        (a, b) => b.drives - a.drives || a.code.localeCompare(b.code),
      ),
    };
  }

  private buildCapitalAge(
    drives: PhysicalDrive[],
    currencies: Currency[],
    lifecycles: Awaited<
      ReturnType<DriveLifecycleEventService['getCurrentLifecycleMap']>
    >,
    currentLocations: Awaited<
      ReturnType<PhysicalDriveService['getCurrentLocationMap']>
    >,
    assignments: Awaited<
      ReturnType<ServerSlotAllocationService['getCurrentAssignmentsForDrives']>
    >,
    exchangeRates: Map<string, LatestExchangeRate>,
    todayUtc: number,
  ): CapitalAgeDto {
    const currencyById = new Map(
      currencies.map((currency) => [currency.id, currency]),
    );
    const costByCurrency = new Map<
      string,
      {
        currencyId: string;
        code: string;
        symbol: string;
        totalCost: number;
        exchangeRateToUsd: number | null;
        rateEffectiveAt: Date | null;
        totalCostUsd: number | null;
      }
    >();
    const ageCounts = new Map<string, number>(
      AGE_BUCKETS.map((bucket) => [bucket.key, 0]),
    );
    const purchaseYears = new Map<number, number>();
    const inUseDrives: Array<{
      driveId: string;
      serialNumber: string;
      label: string;
      purchaseDate: string;
      ageYears: number;
      datacenterCode: string | null;
      lifecycleState: string;
    }> = [];
    let totalAge = 0;
    let totalValueUsd = 0;
    let convertedDrives = 0;
    let unconvertedDrives = 0;

    for (const drive of drives) {
      const purchaseUtc = parseDateOnlyUtc(drive.purchaseDate);
      const ageYears = Math.max((todayUtc - purchaseUtc) / MS_PER_YEAR, 0);
      totalAge += ageYears;

      const bucket =
        AGE_BUCKETS.find((entry) => ageYears < entry.max) ??
        AGE_BUCKETS[AGE_BUCKETS.length - 1];
      ageCounts.set(bucket.key, (ageCounts.get(bucket.key) ?? 0) + 1);

      const year = new Date(purchaseUtc).getUTCFullYear();
      purchaseYears.set(year, (purchaseYears.get(year) ?? 0) + 1);

      const currency = currencyById.get(drive.currencyId);
      const latestRate = exchangeRates.get(drive.currencyId);
      const rate = latestRate?.rateToUsd ?? null;
      const rateEffectiveAt = latestRate?.effectiveAt ?? null;
      const cost = Number(drive.acquisitionCost) || 0;
      const costUsd = rate !== null && rate > 0 ? cost * rate : null;

      const entry = costByCurrency.get(drive.currencyId) ?? {
        currencyId: drive.currencyId,
        code: currency?.code ?? '—',
        symbol: currency?.symbol ?? '',
        totalCost: 0,
        exchangeRateToUsd: rate,
        rateEffectiveAt,
        totalCostUsd: rate !== null && rate > 0 ? 0 : null,
      };
      entry.totalCost += cost;
      if (costUsd !== null) {
        entry.totalCostUsd = (entry.totalCostUsd ?? 0) + costUsd;
        totalValueUsd += costUsd;
        convertedDrives += 1;
      } else {
        unconvertedDrives += 1;
      }
      costByCurrency.set(drive.currencyId, entry);

      if (assignments.has(drive.id)) {
        inUseDrives.push({
          driveId: drive.id,
          serialNumber: drive.serialNumber,
          label: drive.label,
          purchaseDate: String(drive.purchaseDate).slice(0, 10),
          ageYears: round(ageYears),
          datacenterCode: currentLocations.get(drive.id)?.code ?? null,
          lifecycleState:
            lifecycles.get(drive.id)?.state ?? DriveLifecycleState.UNRECEIVED,
        });
      }
    }

    return {
      totalDrives: drives.length,
      averageAgeYears: drives.length > 0 ? round(totalAge / drives.length) : 0,
      totalValueUsd: round(totalValueUsd, 2),
      convertedDrives,
      unconvertedDrives,
      costByCurrency: [...costByCurrency.values()]
        .map((entry) => ({
          ...entry,
          totalCost: round(entry.totalCost, 2),
          rateEffectiveAt: entry.rateEffectiveAt
            ? entry.rateEffectiveAt.toISOString()
            : null,
          totalCostUsd:
            entry.totalCostUsd !== null ? round(entry.totalCostUsd, 2) : null,
        }))
        .sort((a, b) => b.totalCost - a.totalCost),
      ageBuckets: AGE_BUCKETS.map((bucket) => ({
        key: bucket.key,
        label: bucket.label,
        count: ageCounts.get(bucket.key) ?? 0,
      })),
      byPurchaseYear: [...purchaseYears.entries()]
        .map(([year, count]) => ({ year, count }))
        .sort((a, b) => b.year - a.year),
      oldestInUseDrives: inUseDrives
        .sort((a, b) => b.ageYears - a.ageYears)
        .slice(0, 5),
    };
  }

  private buildRmaPipeline(
    claims: WarrantyClaim[],
    statusMap: Awaited<ReturnType<WarrantyClaimEventService['getStatusMap']>>,
    now: Date,
  ): RmaPipelineDto {
    const openClaims = claims.filter(
      (claim) => statusMap.get(claim.id)?.status !== WarrantyClaimStatus.CLOSED,
    );

    const byStatus = RMA_STATUS_ORDER.map((status) => {
      const matching = claims.filter(
        (claim) => statusMap.get(claim.id)?.status === status,
      );
      const open = status === WarrantyClaimStatus.CLOSED ? [] : matching;
      const totalDays = open.reduce((sum, claim) => {
        const since =
          statusMap.get(claim.id)?.eventTimestamp ?? claim.createdAt;
        return sum + Math.max(daysBetween(since, now.getTime()), 0);
      }, 0);

      return {
        status,
        count: matching.length,
        averageDaysInStatus:
          open.length > 0 ? round(totalDays / open.length) : null,
      };
    });

    const resolved = claims.filter(
      (claim) => statusMap.get(claim.id)?.status === WarrantyClaimStatus.CLOSED,
    );
    const resolutionDays = resolved.map((claim) => {
      const closedAt =
        statusMap.get(claim.id)?.eventTimestamp ?? claim.createdAt;
      return Math.max(
        (new Date(closedAt).getTime() - new Date(claim.createdAt).getTime()) /
          MS_PER_DAY,
        0,
      );
    });

    return {
      totalClaims: claims.length,
      openClaims: openClaims.length,
      averageResolutionDays:
        resolutionDays.length > 0
          ? round(
              resolutionDays.reduce((sum, days) => sum + days, 0) /
                resolutionDays.length,
            )
          : null,
      byStatus,
    };
  }

  private buildRecentActivity(
    lifecycleEvents: DriveLifecycleEvent[],
    warrantyEvents: WarrantyClaimEvent[],
  ): RecentActivityDto[] {
    const activity: RecentActivityDto[] = [
      ...lifecycleEvents.map((event) => ({
        id: event.id,
        kind: 'DRIVE' as const,
        eventType: event.eventType,
        eventTimestamp: new Date(event.eventTimestamp).toISOString(),
        driveId: event.physicalDriveId,
        driveSerialNumber: event.physicalDrive?.serialNumber ?? null,
        driveLabel: event.physicalDrive?.label ?? null,
        warrantyClaimId: null,
        rmaTrackingNumber: null,
        notes: null,
        triggeredBy: event.triggeredBy ?? null,
      })),
      ...warrantyEvents.map((event) => ({
        id: event.id,
        kind: 'WARRANTY' as const,
        eventType: event.eventType,
        eventTimestamp: new Date(event.eventTimestamp).toISOString(),
        driveId:
          event.warrantyClaim?.physicalDriveId ??
          event.warrantyClaim?.physicalDrive?.id ??
          '',
        driveSerialNumber:
          event.warrantyClaim?.physicalDrive?.serialNumber ?? null,
        driveLabel: event.warrantyClaim?.physicalDrive?.label ?? null,
        warrantyClaimId: event.warrantyClaimId,
        rmaTrackingNumber: event.warrantyClaim?.rmaTrackingNumber ?? null,
        notes: event.notes ?? null,
        triggeredBy: null,
      })),
    ];

    return activity
      .sort(
        (a, b) =>
          new Date(b.eventTimestamp).getTime() -
          new Date(a.eventTimestamp).getTime(),
      )
      .slice(0, ACTIVITY_LIMIT);
  }
}
