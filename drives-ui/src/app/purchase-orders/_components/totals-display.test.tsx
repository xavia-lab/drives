import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TotalsDisplay } from "./totals-display";
import "@testing-library/jest-dom";

// Mock matchMedia for Ant Design components
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe("TotalsDisplay Component", () => {
  const props = {
    totalAmountCalculated: 1000,
    totalAmountPaid: 1200,
    numberOfLines: 5,
    currencyCode: "USD",
  };

  it("renders correctly with formatted currency values", () => {
    render(<TotalsDisplay {...props} />);

    // Check for calculated amount: "1,000.00 USD"
    // Use regex to handle potential non-breaking spaces from Intl.NumberFormat
    expect(screen.getByText(/\$1,000\.00/)).toBeInTheDocument();

    // Check for paid amount: "1,200.00 USD"
    expect(screen.getByText(/\$1,200\.00/)).toBeInTheDocument();

    // Check for line items count
    expect(screen.getByText(/Based on 5 line item\(s\)/)).toBeInTheDocument();
  });

  it("calculates and displays the correct difference using test ID", () => {
    render(<TotalsDisplay {...props} />);

    // // Difference: 1200 - 1000 = 200
    // Select the element using the new test ID
    const differenceElement = screen.getByTestId("difference-amount");

    // Check that the text content matches our expectation
    // We can use the regex again to be safe with Intl.NumberFormat spaces
    expect(differenceElement).toHaveTextContent(/\$200\.00/);
    expect(differenceElement).toBeInTheDocument();
  });

  it("renders with default values when props are missing", () => {
    render(<TotalsDisplay />);

    // Default values are 0.00
    const zeroDisplays = screen.getAllByText(/\$0\.00/);
    expect(zeroDisplays.length).toBeGreaterThanOrEqual(2);
  });
});
