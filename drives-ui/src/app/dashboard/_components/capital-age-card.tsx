"use client";

import { Alert, Empty, Space, Tag, Typography, theme } from "antd";
import { DollarOutlined } from "@ant-design/icons";
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { InsightCard } from "./insight-card";
import type { CapitalAge, CurrencyCost } from "./types";

const { Text } = Typography;

const formatCost = (entry: CurrencyCost): string => {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: entry.code,
      maximumFractionDigits: 0,
    }).format(entry.totalCost);
  } catch {
    return `${entry.symbol}${Math.round(entry.totalCost).toLocaleString()}`;
  }
};

const formatUsd = (value: number): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

const BUCKET_COLORS = ["#5B8FF9", "#61DDAA", "#F6BD16", "#E8684A"];

type TooltipProps = {
  active?: boolean;
  payload?: Array<{
    payload?: { label: string; count: number };
  }>;
  surface: string;
  border: string;
  text: string;
  muted: string;
};

const ChartTooltip = ({
  active,
  payload,
  surface,
  border,
  text,
  muted,
}: TooltipProps) => {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;

  return (
    <div
      style={{
        background: surface,
        border: `1px solid ${border}`,
        borderRadius: 10,
        padding: "8px 12px",
      }}
    >
      <div style={{ color: text, fontWeight: 600 }}>
        {row.count} drive{row.count === 1 ? "" : "s"}
      </div>
      <div style={{ color: muted, fontSize: 12 }}>{row.label}</div>
    </div>
  );
};

export const CapitalAgeCard = ({ capital }: { capital: CapitalAge }) => {
  const { token } = theme.useToken();

  return (
    <InsightCard
      title="Capital & Age Profile"
      subtitle="Acquisition spend and fleet age"
      icon={<DollarOutlined />}
    >
      {capital.totalDrives === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No acquisition data yet"
        />
      ) : (
        <Space direction="vertical" size={16} style={{ display: "flex" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 8,
            }}
          >
            <div
              style={{
                padding: "8px 12px",
                borderRadius: token.borderRadiusLG,
                background: token.colorFillQuaternary,
              }}
            >
              <Text type="secondary" style={{ fontSize: 11 }}>
                Fleet value (USD)
              </Text>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 600,
                  color: token.colorPrimary,
                }}
              >
                {formatUsd(capital.totalValueUsd)}
              </div>
              <Text type="secondary" style={{ fontSize: 11 }}>
                {capital.convertedDrives} of {capital.totalDrives} drives
                converted
              </Text>
            </div>
            <div
              style={{
                padding: "8px 12px",
                borderRadius: token.borderRadiusLG,
                background: token.colorFillQuaternary,
              }}
            >
              <Text type="secondary" style={{ fontSize: 11 }}>
                Average age
              </Text>
              <div style={{ fontSize: 22, fontWeight: 600 }}>
                {capital.averageAgeYears.toFixed(1)} yrs
              </div>
              <Text type="secondary" style={{ fontSize: 11 }}>
                {capital.totalDrives} drives in fleet
              </Text>
            </div>
          </div>

          {capital.unconvertedDrives > 0 ? (
            <Alert
              type="warning"
              showIcon
              message={`${capital.unconvertedDrives} drive${
                capital.unconvertedDrives === 1 ? "" : "s"
              } excluded from the USD total`}
              description="Their currency has no USD exchange rate configured."
            />
          ) : null}

          <div>
            <Text type="secondary" style={{ fontSize: 11 }}>
              Spend by purchase currency
            </Text>
            <div style={{ marginTop: 4 }}>
              {capital.costByCurrency.length === 0 ? (
                <Text type="secondary">—</Text>
              ) : (
                <Space size={[6, 6]} wrap>
                  {capital.costByCurrency.map((entry) => (
                    <Tag key={entry.currencyId} style={{ marginInlineEnd: 0 }}>
                      {entry.code} {formatCost(entry)}
                      <Text type="secondary">
                        {entry.totalCostUsd !== null
                          ? ` → ${formatUsd(entry.totalCostUsd)}`
                          : " · no USD rate"}
                      </Text>
                    </Tag>
                  ))}
                </Space>
              )}
            </div>
          </div>

          <div style={{ height: 150 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={capital.ageBuckets}
                margin={{ top: 16, right: 4, bottom: 0, left: 4 }}
                accessibilityLayer
              >
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: token.colorTextSecondary, fontSize: 11 }}
                />
                <YAxis hide />
                <Tooltip
                  cursor={{ fill: token.colorFillQuaternary }}
                  content={
                    <ChartTooltip
                      surface={token.colorBgElevated}
                      border={token.colorBorderSecondary}
                      text={token.colorText}
                      muted={token.colorTextSecondary}
                    />
                  }
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {capital.ageBuckets.map((bucket, index) => (
                    <Cell
                      key={bucket.key}
                      fill={BUCKET_COLORS[index % BUCKET_COLORS.length]}
                    />
                  ))}
                  <LabelList
                    dataKey="count"
                    position="top"
                    fill={token.colorTextSecondary}
                    fontSize={11}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div>
            <Text
              type="secondary"
              style={{
                display: "block",
                fontSize: 11,
                letterSpacing: 1.1,
                textTransform: "uppercase",
                marginBottom: 6,
              }}
            >
              Purchased by year
            </Text>
            <Space size={[6, 6]} wrap>
              {capital.byPurchaseYear.map((entry) => (
                <Tag key={entry.year} style={{ marginInlineEnd: 0 }}>
                  {entry.year} · {entry.count}
                </Tag>
              ))}
            </Space>
          </div>
        </Space>
      )}
    </InsightCard>
  );
};
