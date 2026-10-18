import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { LinkedLabel } from "@components/linked-label";

const options = [
  { label: "Samsung", value: "vendor-1" },
  { label: "NVMe Gen 4.0 x4", value: "iface-1" },
];

describe("LinkedLabel", () => {
  it("links the resolved option label to the resource show page in a new tab", () => {
    render(
      <LinkedLabel resource="vendors" options={options} value="vendor-1" />,
    );

    const link = screen.getByRole("link", { name: /Samsung/i });
    expect(link).toHaveAttribute("href", "/vendors/show/vendor-1");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("uses an explicit label over the options lookup", () => {
    render(
      <LinkedLabel
        resource="bus-protocols"
        options={[{ label: "Ignored", value: "proto-1" }]}
        value="proto-1"
        label="PCIe 5.0"
      />,
    );

    const link = screen.getByRole("link", { name: /PCIe 5.0/i });
    expect(link).toHaveAttribute("href", "/bus-protocols/show/proto-1");
    expect(screen.queryByText("Ignored")).not.toBeInTheDocument();
  });

  it("falls back for an empty value without rendering a link", () => {
    render(
      <LinkedLabel
        resource="vendors"
        options={options}
        value={undefined}
        fallback="-"
      />,
    );

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("-")).toBeInTheDocument();
  });

  it("falls back when the value matches no option", () => {
    render(
      <LinkedLabel resource="vendors" options={options} value="missing" />,
    );

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("falls back to 'Loading...' by default while options are still loading", () => {
    render(<LinkedLabel resource="vendors" options={[]} value="vendor-1" />);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });
});
