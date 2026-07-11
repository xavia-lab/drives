import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { ProviderTag } from "@components/provider-tag";

describe("ProviderTag", () => {
  it("renders 'System' with blue color and tooltip when managed is true", async () => {
    const user = userEvent.setup();
    const { container } = render(<ProviderTag managed={true} />);

    const tag = screen.getByText("System");
    expect(tag).toBeInTheDocument();

    // Ant Design Tags usually apply classes to the span or a parent
    const tagElement = container.querySelector(".ant-tag");
    expect(tagElement).toHaveClass("ant-tag-blue");

    // Hover to reveal Tooltip
    await user.hover(tag);

    // Tooltips render in a portal, so we search the whole document
    const tooltip = await screen.findByRole("tooltip");
    expect(tooltip).toHaveTextContent(/Provider: System/i);
  });

  it("renders 'User' with green color and tooltip when managed is false", async () => {
    const user = userEvent.setup();
    render(<ProviderTag managed={false} />);

    const tag = screen.getByText("User");
    expect(tag).toBeInTheDocument();

    await user.hover(tag);

    const tooltip = await screen.findByRole("tooltip");
    expect(tooltip).toHaveTextContent(/Provider: User/i);
  });

  it("renders 'User' as default when managed prop is missing", () => {
    render(<ProviderTag />);
    expect(screen.getByText("User")).toBeInTheDocument();
  });
});
