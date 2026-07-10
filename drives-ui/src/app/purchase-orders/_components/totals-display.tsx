"use client";

import { Card, Form, Space, Typography } from "antd";
import { CurrencyFormatter } from "@/utils/CurrencyFormatter";

const { Text } = Typography;

interface TotalsDisplayProps {
  totalAmountCalculated?: number;
  totalAmountPaid?: number;
  numberOfLines?: number;
  currencyCode?: string;
}

export const TotalsDisplay: React.FC<TotalsDisplayProps> = ({
  totalAmountCalculated = 0,
  totalAmountPaid = 0,
  numberOfLines = 0,
  currencyCode = "USD",
}) => {
  const form = Form.useFormInstance();

  const formatter = new CurrencyFormatter("en-US");

  return (
    <Space direction="vertical" size="middle" style={{ display: "flex" }}>
      <Card title={"Total Amounts"}>
        <Space direction="vertical" size="middle" style={{ display: "flex" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text strong style={{ color: "#003eb3" }}>
              Total Amount Calculated:
            </Text>
            <Text strong style={{ color: "#003eb3", fontSize: "16px" }}>
              {formatter.format(totalAmountCalculated, currencyCode, {
                useSymbol: true,
              })}
            </Text>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text strong style={{ color: "#003eb3" }}>
              Total Amount Paid:
            </Text>
            <Text strong style={{ color: "#003eb3", fontSize: "16px" }}>
              {formatter.format(totalAmountPaid, currencyCode, {
                useSymbol: true,
              })}
            </Text>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              borderTop: "1px dashed #d51111",
              paddingTop: "4px",
            }}
          >
            <Text strong style={{ color: "#d51111" }}>
              Difference:
            </Text>
            <Text
              strong
              style={{ color: "#d51111", fontSize: "16px" }}
              data-testid="difference-amount"
            >
              {formatter.format(
                totalAmountPaid - totalAmountCalculated,
                currencyCode,
                { useSymbol: true },
              )}
            </Text>
          </div>

          <div style={{ marginTop: "4px" }}>
            <Text type="secondary" style={{ fontSize: "12px" }}>
              Based on {numberOfLines} line item(s)
            </Text>
          </div>
        </Space>
      </Card>
    </Space>
  );
};
