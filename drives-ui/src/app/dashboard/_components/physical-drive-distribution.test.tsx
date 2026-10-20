import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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

const distribution = {
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

describe("PhysicalDriveDistribution", () => {
  it("renders counts, percentages and deep links for each datacenter", () => {
    render(<PhysicalDriveDistribution distribution={distribution} />);

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
    expect(screen.getAllByText("Unassigned").length).toBeGreaterThan(0);
    expect(screen.getAllByText("10").length).toBeGreaterThan(0);
    expect(screen.getAllByText("2").length).toBeGreaterThan(0);
  });

  it("shows an empty state when no drives are inventoried", () => {
    render(
      <PhysicalDriveDistribution
        distribution={{
          total: 0,
          assigned: 0,
          unassigned: 0,
          byDatacenter: [],
        }}
      />,
    );

    expect(
      screen.getByText("No physical drives inventoried yet"),
    ).toBeInTheDocument();
  });
});
