export type DriveDistributionDatacenter = {
  datacenterId: string;
  code: string;
  name: string;
  count: number;
};

export type DriveDistribution = {
  total: number;
  assigned: number;
  unassigned: number;
  byDatacenter: DriveDistributionDatacenter[];
};

export type WarrantyExpiration = {
  driveId: string;
  serialNumber: string;
  label: string;
  warrantyExpiryDate: string;
  daysRemaining: number;
  datacenterCode: string | null;
};

export type WarrantyWatchlist = {
  activeWarranties: number;
  expiredWarranties: number;
  within30Days: number;
  within60Days: number;
  within90Days: number;
  openClaims: number;
  oldestOpenClaimDays: number | null;
  nextExpirations: WarrantyExpiration[];
};

export type LifecycleStateCount = {
  state: string;
  count: number;
};

export type LifecycleHealth = {
  total: number;
  byState: LifecycleStateCount[];
};

export type ServerSlotUsage = {
  serverId: string;
  hostname: string;
  totalSlots: number;
  occupiedSlots: number;
  freeSlots: number;
};

export type SlotUtilization = {
  totalSlots: number;
  occupiedSlots: number;
  freeSlots: number;
  utilizationPercent: number;
  unseatedDrives: number;
  serversWithFreeSlots: number;
  topServersByFreeSlots: ServerSlotUsage[];
};

export type DatacenterHealth = {
  datacenterId: string;
  code: string;
  name: string;
  drives: number;
  inService: number;
  degraded: number;
  failed: number;
  inRma: number;
  unseated: number;
  totalSlots: number;
  occupiedSlots: number;
};

export type DatacenterHealthSummary = {
  unassignedDrives: number;
  datacenters: DatacenterHealth[];
};

export type CurrencyCost = {
  currencyId: string;
  code: string;
  symbol: string;
  totalCost: number;
  exchangeRateToUsd: number | null;
  rateEffectiveAt: string | null;
  totalCostUsd: number | null;
};

export type OldestInUseDrive = {
  driveId: string;
  serialNumber: string;
  label: string;
  purchaseDate: string;
  ageYears: number;
  datacenterCode: string | null;
  lifecycleState: string;
};

export type AgeBucket = {
  key: string;
  label: string;
  count: number;
};

export type PurchaseYearCount = {
  year: number;
  count: number;
};

export type CapitalAge = {
  totalDrives: number;
  averageAgeYears: number;
  totalValueUsd: number;
  convertedDrives: number;
  unconvertedDrives: number;
  costByCurrency: CurrencyCost[];
  ageBuckets: AgeBucket[];
  byPurchaseYear: PurchaseYearCount[];
  oldestInUseDrives: OldestInUseDrive[];
};

export type RmaStatusCount = {
  status: string;
  count: number;
  averageDaysInStatus: number | null;
};

export type RmaPipeline = {
  totalClaims: number;
  openClaims: number;
  averageResolutionDays: number | null;
  byStatus: RmaStatusCount[];
};

export type RecentActivity = {
  id: string;
  kind: "DRIVE" | "WARRANTY";
  eventType: string;
  eventTimestamp: string;
  driveId: string;
  driveSerialNumber: string | null;
  driveLabel: string | null;
  warrantyClaimId: string | null;
  rmaTrackingNumber: string | null;
  notes: string | null;
  triggeredBy: string | null;
};

export type DashboardSummary = {
  driveDistribution: DriveDistribution;
  warrantyWatchlist: WarrantyWatchlist;
  lifecycleHealth: LifecycleHealth;
  slotUtilization: SlotUtilization;
  datacenterHealth: DatacenterHealthSummary;
  capitalAge: CapitalAge;
  rmaPipeline: RmaPipeline;
  recentActivity: RecentActivity[];
};
