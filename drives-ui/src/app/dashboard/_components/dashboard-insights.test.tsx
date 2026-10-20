import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { useCustomMock } = vi.hoisted(() => ({ useCustomMock: vi.fn() }));

vi.mock("@refinedev/core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@refinedev/core")>();
  return {
    ...actual,
    useApiUrl: () => "/api/v1",
    useCustom: useCustomMock,
  };
});

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  BarChart: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  PieChart: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Bar: () => null,
  Cell: () => null,
  LabelList: () => null,
  Pie: () => null,
  Tooltip: () => null,
  XAxis: () => null,
  YAxis: () => null,
}));

import { DashboardInsights } from "./dashboard-insights";

const summary = {
  driveDistribution: {
    total: 50,
    assigned: 46,
    unassigned: 4,
    byDatacenter: [
      {
        datacenterId: "dc-1",
        code: "VA-ASH-1",
        name: "Ashburn Data Center 1",
        count: 24,
      },
    ],
  },
  warrantyWatchlist: {
    activeWarranties: 47,
    expiredWarranties: 3,
    within30Days: 2,
    within60Days: 5,
    within90Days: 9,
    openClaims: 2,
    oldestOpenClaimDays: 18,
    nextExpirations: [
      {
        driveId: "drive-1",
        serialNumber: "SN-1",
        label: "LABEL-1",
        warrantyExpiryDate: "2026-11-01",
        daysRemaining: 12,
        datacenterCode: "VA-ASH-1",
      },
    ],
  },
  lifecycleHealth: {
    total: 50,
    byState: [
      { state: "IN_SERVICE", count: 30 },
      { state: "FAILED", count: 2 },
    ],
  },
  slotUtilization: {
    totalSlots: 46,
    occupiedSlots: 2,
    freeSlots: 44,
    utilizationPercent: 4,
    unseatedDrives: 48,
    serversWithFreeSlots: 5,
    topServersByFreeSlots: [
      {
        serverId: "server-1",
        hostname: "host-1",
        totalSlots: 16,
        occupiedSlots: 1,
        freeSlots: 15,
      },
    ],
  },
  datacenterHealth: {
    unassignedDrives: 4,
    datacenters: [
      {
        datacenterId: "dc-1",
        code: "VA-ASH-1",
        name: "Ashburn Data Center 1",
        drives: 24,
        inService: 18,
        degraded: 1,
        failed: 1,
        inRma: 1,
        unseated: 4,
        totalSlots: 22,
        occupiedSlots: 1,
      },
    ],
  },
  capitalAge: {
    totalDrives: 50,
    averageAgeYears: 3.1,
    totalValueUsd: 18265.3,
    convertedDrives: 50,
    unconvertedDrives: 0,
    costByCurrency: [
      {
        currencyId: "usd",
        code: "USD",
        symbol: "$",
        totalCost: 18265.3,
        exchangeRateToUsd: 1,
        rateEffectiveAt: "2026-10-01T00:00:00.000Z",
        totalCostUsd: 18265.3,
      },
    ],
    ageBuckets: [
      { key: "<1", label: "Under 1 year", count: 0 },
      { key: "1-3", label: "1–3 years", count: 23 },
      { key: "3-5", label: "3–5 years", count: 27 },
      { key: "5+", label: "5+ years", count: 0 },
    ],
    byPurchaseYear: [{ year: 2024, count: 16 }],
    oldestInUseDrives: [
      {
        driveId: "drive-1",
        serialNumber: "SN-1",
        label: "LABEL-1",
        purchaseDate: "2019-01-01",
        ageYears: 7.8,
        datacenterCode: "VA-ASH-1",
        lifecycleState: "IN_SERVICE",
      },
    ],
  },
  rmaPipeline: {
    totalClaims: 7,
    openClaims: 5,
    averageResolutionDays: 21,
    byStatus: [
      { status: "SUBMITTED", count: 2, averageDaysInStatus: 4 },
      { status: "CLOSED", count: 2, averageDaysInStatus: null },
    ],
  },
  recentActivity: [
    {
      id: "activity-1",
      kind: "DRIVE",
      eventType: "FAIL",
      eventTimestamp: "2026-10-19T00:00:00.000Z",
      driveId: "drive-1",
      driveSerialNumber: "SN-1",
      driveLabel: "LABEL-1",
      warrantyClaimId: null,
      rmaTrackingNumber: null,
      notes: null,
      triggeredBy: "tester",
    },
  ],
};

const mockResponse = ({
  result = Object.freeze({}),
  query = {},
}: {
  result?: unknown;
  query?: Record<string, unknown>;
} = {}) => {
  useCustomMock.mockReturnValue({
    result: { data: result },
    query: {
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
      ...query,
    },
  });
};

describe("DashboardInsights", () => {
  beforeEach(() => {
    useCustomMock.mockReset();
  });

  it("renders a skeleton while loading without crashing", () => {
    mockResponse({ query: { isLoading: true } });

    render(<DashboardInsights />);

    expect(document.querySelector(".ant-skeleton")).toBeInTheDocument();
  });

  it("renders every insight card from the summary", () => {
    mockResponse({ result: summary });

    render(<DashboardInsights />);

    expect(screen.getByText("Physical Drive Distribution")).toBeInTheDocument();
    expect(screen.getByText("Warranty Watchlist")).toBeInTheDocument();
    expect(screen.getByText("Fleet Lifecycle Health")).toBeInTheDocument();
    expect(screen.getByText("Slot Utilization")).toBeInTheDocument();
    expect(screen.getByText("RMA Pipeline")).toBeInTheDocument();
    expect(screen.getByText("Capital & Age Profile")).toBeInTheDocument();
    expect(screen.getByText("Datacenter Health Matrix")).toBeInTheDocument();
    expect(screen.getByText("Oldest In-Use Drives")).toBeInTheDocument();
    expect(screen.getByText("Recent Activity")).toBeInTheDocument();
    expect(screen.getByText("Fleet value (USD)")).toBeInTheDocument();
    expect(screen.getAllByText("SN-1").length).toBeGreaterThan(0);
    expect(screen.getByText("host-1")).toBeInTheDocument();
    expect(screen.getAllByText("VA-ASH-1").length).toBeGreaterThan(0);
  });

  it("shows a retryable error state", () => {
    mockResponse({ query: { isError: true } });

    render(<DashboardInsights />);

    expect(
      screen.getByText("Could not load fleet insights"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Retry/i })).toBeInTheDocument();
  });
});
