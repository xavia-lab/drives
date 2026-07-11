"use client";

import React, { useEffect, useMemo } from "react";
import { Card, Form, Space, Typography } from "antd";
import Big from "big.js"; // Standard for 2026 financial precision
import { CurrencyFormatter } from "@/utils/CurrencyFormatter";

const { Text } = Typography;

interface PricingCalculatorProps {
  metalPriceValue?: number;
  pricingPremium?: number;
  pricingCurrency?: string;
  metalQuantityInGrams?: number;
  onCalculationUpdate?: (data: {
    premiumAmount: number;
    effectivePrice: number;
    pricePerGram: number;
  }) => void;
}

export const PricingCalculator: React.FC<PricingCalculatorProps> = ({
  metalPriceValue = 0,
  pricingPremium = 0,
  pricingCurrency = "USD",
  metalQuantityInGrams = 1,
  onCalculationUpdate,
}) => {
  const form = Form.useFormInstance();

  // 1. Instantiate the reusable formatter
  const formatter = new CurrencyFormatter("en-US");

  // 2. Use Big.js for core calculations to ensure precision
  const { premiumAmount, effectivePrice, pricePerGram } = useMemo(() => {
    const price = new Big(metalPriceValue);
    const premium = new Big(pricingPremium);
    const grams = new Big(metalQuantityInGrams || 1);

    const calcPremium = price.times(premium);
    const calcEffective = price.plus(calcPremium);
    const calcPerGram = calcEffective.div(grams);

    return {
      premiumAmount: calcPremium.toNumber(),
      effectivePrice: calcEffective.toNumber(),
      pricePerGram: calcPerGram.toNumber(),
    };
  }, [metalPriceValue, pricingPremium, metalQuantityInGrams]);

  useEffect(() => {
    if (form) {
      form.setFieldsValue({ premiumAmount, effectivePrice, pricePerGram });
    }
    if (onCalculationUpdate) {
      onCalculationUpdate({ premiumAmount, effectivePrice, pricePerGram });
    }
  }, [premiumAmount, effectivePrice, pricePerGram, form, onCalculationUpdate]);

  return (
    <Space direction="vertical" size="middle" style={{ display: "flex" }}>
      <Card title={"Pricing Information"}>
        <Space direction="vertical" size="middle" style={{ display: "flex" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "4px",
            }}
          >
            <Text type="secondary">Premium Amount:</Text>
            <Text strong data-testid="premium-amount">
              {formatter.format(premiumAmount, pricingCurrency, {
                useSymbol: true,
              })}
            </Text>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "4px",
            }}
          >
            <Text type="secondary">Effective Price:</Text>
            <Text strong data-testid="effective-price">
              {formatter.format(effectivePrice, pricingCurrency, {
                useSymbol: true,
              })}
            </Text>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              borderTop: "1px dashed #b7eb8f",
              paddingTop: "4px",
            }}
          >
            <Text strong style={{ color: "#135200" }}>
              Price Per Gram (24K):
            </Text>
            <Text strong style={{ color: "#135200" }}>
              {formatter.format(pricePerGram, pricingCurrency, {
                useSymbol: true,
              })}
            </Text>
          </div>
        </Space>
      </Card>
    </Space>
  );
};
