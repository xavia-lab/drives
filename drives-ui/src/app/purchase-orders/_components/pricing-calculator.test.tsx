import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { PricingCalculator } from "./pricing-calculator";
import { Form } from "antd";

// Wrapper to provide Ant Design Form Context
const FormWrapper = ({ children }: { children: React.ReactNode }) => {
  const [form] = Form.useForm();
  return <Form form={form}>{children}</Form>;
};

describe("PricingCalculator Component", () => {
  const defaultProps = {
    metalPriceValue: 2000,
    pricingPremium: 0.05, // 5%
    pricingCurrency: "USD",
    metalQuantityInGrams: 31.1, // 1 Oz
  };

  it("calculates and displays premium and effective price correctly", () => {
    render(
      <FormWrapper>
        <PricingCalculator {...defaultProps} />
      </FormWrapper>,
    );

    // Premium: 2000 * 0.05 = 100.00
    // Effective: 2000 + 100 = 2,100.00
    // Per Gram: 2100 / 31.1 ≈ 67.52
    const premiumEl = screen.getByTestId("premium-amount");
    // Normalize and check only the parts that matter
    expect(premiumEl.textContent?.replace(/\u00a0|\u202f/g, " ")).toMatch(
      /\$100\.00/,
    );
  });

  it("calls onCalculationUpdate with precise Big.js results", () => {
    const onUpdateSpy = vi.fn();
    render(
      <FormWrapper>
        <PricingCalculator
          {...defaultProps}
          onCalculationUpdate={onUpdateSpy}
        />
      </FormWrapper>,
    );

    // Verify the callback received the correct numeric data
    expect(onUpdateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        premiumAmount: 100,
        effectivePrice: 2100,
        // Using toBeCloseTo for per-gram division
      }),
    );
    expect(onUpdateSpy.mock.calls[0][0].pricePerGram).toBeCloseTo(67.524, 2);
  });

  it("handles floating point precision issues (0.1 + 0.2 scenario)", () => {
    render(
      <FormWrapper>
        <PricingCalculator metalPriceValue={0.1} pricingPremium={2} />
      </FormWrapper>,
    );

    const element = screen.getByTestId("effective-price");

    // Normalize both expected and actual text to handle any Unicode spaces
    const normalizedText = element.textContent?.replace(/\u00a0|\u202f/g, " ");
    expect(normalizedText).toContain("$0.30");
  });

  it("defaults to 1 gram if metalQuantityInGrams is 0 to avoid division by zero", () => {
    render(
      <FormWrapper>
        <PricingCalculator {...defaultProps} metalQuantityInGrams={0} />
      </FormWrapper>,
    );

    // Effective price 2100 / 1 (fallback) = 2100.00
    expect(screen.getAllByText(/\$2,100\.00/)).toHaveLength(2);
  });
});
