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
  PieChart: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Pie: () => null,
  Cell: () => null,
  Tooltip: () => null,
}));

import { PhysicalDriveDistribution } from "./physical-drive-distribution";

const stats = {
  total: 10,
  assigned: 8,
  unassigned: 2,
  byDatacenter: [
    {
      datacenterId: "dc-1",
      code: "VA-ASH-1",
      name: "Ashburn Data Center 1",
      count: 6,
    },
    {
      datacenterId: "dc-2",
      code: "GB-SLO-1",
      name: "Slough Data Center 1",
      count: 2,
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

describe("PhysicalDriveDistribution", () => {
  beforeEach(() => {
    useCustomMock.mockReset();
  });

  it("renders the skeleton without crashing while the request is in flight", () => {
    mockResponse({ query: { isLoading: true } });

    render(<PhysicalDriveDistribution />);

    expect(screen.getByText("Physical Drive Distribution")).toBeInTheDocument();
  });

  it("renders counts, percentages and deep links for each datacenter", () => {
    mockResponse({ result: stats });

    render(<PhysicalDriveDistribution />);

    const ashburnLink = screen.getByRole("link", { name: /VA-ASH-1/i });
    expect(ashburnLink).toHaveAttribute(
      "href",
      expect.stringContaining("/physical-drives?"),
    );
    expect(ashburnLink).toHaveAttribute(
      "href",
      expect.stringContaining("currentLocation"),
    );
    expect(screen.getByText("GB-SLO-1")).toBeInTheDocument();
    expect(screen.getAllByText("10").length).toBeGreaterThan(0);
    expect(screen.getAllByText("2").length).toBeGreaterThan(0);
  });

  it("shows an empty state when no drives are inventoried", () => {
    mockResponse({
      result: { total: 0, assigned: 0, unassigned: 0, byDatacenter: [] },
    });

    render(<PhysicalDriveDistribution />);

    expect(
      screen.getByText("No physical drives inventoried yet"),
    ).toBeInTheDocument();
  });

  it("shows a retryable error state when the request fails", () => {
    mockResponse({ query: { isError: true } });

    render(<PhysicalDriveDistribution />);

    expect(
      screen.getByText("Could not load the drive distribution"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Retry/i })).toBeInTheDocument();
  });
});
