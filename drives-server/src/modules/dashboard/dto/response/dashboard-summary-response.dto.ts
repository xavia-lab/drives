import { Expose, Type } from 'class-transformer';

export class DriveDistributionDatacenterDto {
  @Expose()
  datacenterId: string;

  @Expose()
  code: string;

  @Expose()
  name: string;

  @Expose()
  count: number;
}

export class DriveDistributionDto {
  @Expose()
  total: number;

  @Expose()
  assigned: number;

  @Expose()
  unassigned: number;

  @Expose()
  @Type(() => DriveDistributionDatacenterDto)
  byDatacenter: DriveDistributionDatacenterDto[];
}

export class WarrantyExpirationDto {
  @Expose()
  driveId: string;

  @Expose()
  serialNumber: string;

  @Expose()
  label: string;

  @Expose()
  warrantyExpiryDate: string;

  @Expose()
  daysRemaining: number;

  @Expose()
  datacenterCode: string | null;
}

export class WarrantyWatchlistDto {
  @Expose()
  activeWarranties: number;

  @Expose()
  expiredWarranties: number;

  @Expose()
  within30Days: number;

  @Expose()
  within60Days: number;

  @Expose()
  within90Days: number;

  @Expose()
  openClaims: number;

  @Expose()
  oldestOpenClaimDays: number | null;

  @Expose()
  @Type(() => WarrantyExpirationDto)
  nextExpirations: WarrantyExpirationDto[];
}

export class LifecycleStateCountDto {
  @Expose()
  state: string;

  @Expose()
  count: number;
}

export class LifecycleHealthDto {
  @Expose()
  total: number;

  @Expose()
  @Type(() => LifecycleStateCountDto)
  byState: LifecycleStateCountDto[];
}

export class ServerSlotUsageDto {
  @Expose()
  serverId: string;

  @Expose()
  hostname: string;

  @Expose()
  totalSlots: number;

  @Expose()
  occupiedSlots: number;

  @Expose()
  freeSlots: number;
}

export class SlotUtilizationDto {
  @Expose()
  totalSlots: number;

  @Expose()
  occupiedSlots: number;

  @Expose()
  freeSlots: number;

  @Expose()
  utilizationPercent: number;

  @Expose()
  unseatedDrives: number;

  @Expose()
  serversWithFreeSlots: number;

  @Expose()
  @Type(() => ServerSlotUsageDto)
  topServersByFreeSlots: ServerSlotUsageDto[];
}

export class DatacenterHealthDto {
  @Expose()
  datacenterId: string;

  @Expose()
  code: string;

  @Expose()
  name: string;

  @Expose()
  drives: number;

  @Expose()
  inService: number;

  @Expose()
  degraded: number;

  @Expose()
  failed: number;

  @Expose()
  inRma: number;

  @Expose()
  unseated: number;

  @Expose()
  totalSlots: number;

  @Expose()
  occupiedSlots: number;
}

export class DatacenterHealthSummaryDto {
  @Expose()
  unassignedDrives: number;

  @Expose()
  @Type(() => DatacenterHealthDto)
  datacenters: DatacenterHealthDto[];
}

export class CurrencyCostDto {
  @Expose()
  currencyId: string;

  @Expose()
  code: string;

  @Expose()
  symbol: string;

  @Expose()
  totalCost: number;

  @Expose()
  exchangeRateToUsd: number | null;

  @Expose()
  rateEffectiveAt: string | null;

  @Expose()
  totalCostUsd: number | null;
}

export class OldestInUseDriveDto {
  @Expose()
  driveId: string;

  @Expose()
  serialNumber: string;

  @Expose()
  label: string;

  @Expose()
  purchaseDate: string;

  @Expose()
  ageYears: number;

  @Expose()
  datacenterCode: string | null;

  @Expose()
  lifecycleState: string;
}

export class AgeBucketDto {
  @Expose()
  key: string;

  @Expose()
  label: string;

  @Expose()
  count: number;
}

export class PurchaseYearCountDto {
  @Expose()
  year: number;

  @Expose()
  count: number;
}

export class CapitalAgeDto {
  @Expose()
  totalDrives: number;

  @Expose()
  averageAgeYears: number;

  @Expose()
  totalValueUsd: number;

  @Expose()
  convertedDrives: number;

  @Expose()
  unconvertedDrives: number;

  @Expose()
  @Type(() => CurrencyCostDto)
  costByCurrency: CurrencyCostDto[];

  @Expose()
  @Type(() => AgeBucketDto)
  ageBuckets: AgeBucketDto[];

  @Expose()
  @Type(() => PurchaseYearCountDto)
  byPurchaseYear: PurchaseYearCountDto[];

  @Expose()
  @Type(() => OldestInUseDriveDto)
  oldestInUseDrives: OldestInUseDriveDto[];
}

export class RmaStatusCountDto {
  @Expose()
  status: string;

  @Expose()
  count: number;

  @Expose()
  averageDaysInStatus: number | null;
}

export class RmaPipelineDto {
  @Expose()
  totalClaims: number;

  @Expose()
  openClaims: number;

  @Expose()
  averageResolutionDays: number | null;

  @Expose()
  @Type(() => RmaStatusCountDto)
  byStatus: RmaStatusCountDto[];
}

export class RecentActivityDto {
  @Expose()
  id: string;

  @Expose()
  kind: 'DRIVE' | 'WARRANTY';

  @Expose()
  eventType: string;

  @Expose()
  eventTimestamp: string;

  @Expose()
  driveId: string;

  @Expose()
  driveSerialNumber: string | null;

  @Expose()
  driveLabel: string | null;

  @Expose()
  warrantyClaimId: string | null;

  @Expose()
  rmaTrackingNumber: string | null;

  @Expose()
  notes: string | null;

  @Expose()
  triggeredBy: string | null;
}

export class DashboardSummaryResponseDto {
  @Expose()
  @Type(() => DriveDistributionDto)
  driveDistribution: DriveDistributionDto;

  @Expose()
  @Type(() => WarrantyWatchlistDto)
  warrantyWatchlist: WarrantyWatchlistDto;

  @Expose()
  @Type(() => LifecycleHealthDto)
  lifecycleHealth: LifecycleHealthDto;

  @Expose()
  @Type(() => SlotUtilizationDto)
  slotUtilization: SlotUtilizationDto;

  @Expose()
  @Type(() => DatacenterHealthSummaryDto)
  datacenterHealth: DatacenterHealthSummaryDto;

  @Expose()
  @Type(() => CapitalAgeDto)
  capitalAge: CapitalAgeDto;

  @Expose()
  @Type(() => RmaPipelineDto)
  rmaPipeline: RmaPipelineDto;

  @Expose()
  @Type(() => RecentActivityDto)
  recentActivity: RecentActivityDto[];
}
