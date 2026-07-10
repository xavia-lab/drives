import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { EnumTag } from "@components/enum-tag/index";

// Mock data for testing
const MOCK_OPTIONS = [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

const MOCK_COLORS = {
  active: "green",
  inactive: "red",
};

describe("EnumTag Component", () => {
  it("renders the correct label based on the value provided", () => {
    render(
      <EnumTag value="active" options={MOCK_OPTIONS} colorMap={MOCK_COLORS} />,
    );

    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("applies the correct color from the colorMap", () => {
    render(
      <EnumTag
        value="inactive"
        options={MOCK_OPTIONS}
        colorMap={MOCK_COLORS}
      />,
    );

    const tag = screen.getByText("Inactive");
    // Ant Design translates "red" to the "ant-tag-red" class
    expect(tag).toHaveClass("ant-tag-red");
  });

  it("falls back to 'default' color and raw value if mapping is missing", () => {
    render(<EnumTag value="unknown-status" options={[]} colorMap={{}} />);

    const tag = screen.getByText("unknown-status");
    expect(tag).toBeInTheDocument();

    // Ant Design adds 'ant-tag-default' when the color prop is "default"
    expect(tag).toHaveClass("ant-tag-default");

    // Ensure it doesn't have a specific semantic color like red or green
    expect(tag).not.toHaveClass("ant-tag-green");
    expect(tag).not.toHaveClass("ant-tag-red");
  });

  it("displays the tooltip with the custom prefix on hover", async () => {
    const user = userEvent.setup();
    render(
      <EnumTag
        value="active"
        options={MOCK_OPTIONS}
        colorMap={MOCK_COLORS}
        tooltipPrefix="Status"
      />,
    );

    const tag = screen.getByText("Active");
    await user.hover(tag);

    // AntD Tooltips render in a portal, so we use waitFor
    await waitFor(() => {
      expect(screen.getByRole("tooltip")).toHaveTextContent("Status: Active");
    });
  });

  it("uses the default 'Type' prefix if tooltipPrefix is not provided", async () => {
    const user = userEvent.setup();
    render(
      <EnumTag value="active" options={MOCK_OPTIONS} colorMap={MOCK_COLORS} />,
    );

    await user.hover(screen.getByText("Active"));

    await waitFor(() => {
      expect(screen.getByRole("tooltip")).toHaveTextContent("Type: Active");
    });
  });
});
