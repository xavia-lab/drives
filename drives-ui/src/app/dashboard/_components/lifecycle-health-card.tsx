"use client";

import { useMemo } from "react";
import { Empty, Tag, theme } from "antd";
import { DeploymentUnitOutlined } from "@ant-design/icons";
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
import type { LifecycleHealth } from "./types";

const STATE_LABELS: Record<string, string> = {
  UNRECEIVED: "Unreceived",
  RECEIVED: "Received",
  IN_INVENTORY: "In inventory",
  IN_SERVICE: "In service",
  DEGRADED: "Degraded",
  FAILED: "Failed",
  IN_RMA: "In RMA",
  RETIRED: "Retired",
  SCRAPPED: "Scrapped",
  REPLACED: "Replaced",
  LOST: "Lost",
};

type BarRow = {
  state: string;
  label: string;
  count: number;
  color: string;
};

type TooltipProps = {
  active?: boolean;
  payload?: Array<{ payload?: BarRow }>;
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

export const LifecycleHealthCard = ({
  health,
}: {
  health: LifecycleHealth;
}) => {
  const { token } = theme.useToken();

  const colorByState: Record<string, string> = {
    UNRECEIVED: token.colorTextSecondary,
    RECEIVED: token.colorPrimary,
    IN_INVENTORY: token.colorInfo,
    IN_SERVICE: token.colorSuccess,
    DEGRADED: token.colorWarning,
    FAILED: token.colorError,
    IN_RMA: "#722ed1",
    RETIRED: token.colorTextTertiary,
    SCRAPPED: token.colorTextQuaternary,
    REPLACED: "#13c2c2",
    LOST: "#cf1322",
  };

  const rows = useMemo<BarRow[]>(
    () =>
      health.byState
        .filter((entry) => entry.count > 0)
        .map((entry) => ({
          state: entry.state,
          label: STATE_LABELS[entry.state] ?? entry.state,
          count: entry.count,
          color: colorByState[entry.state] ?? token.colorPrimary,
        })),
    [health.byState, token.colorPrimary, colorByState],
  );

  const attention = health.byState
    .filter((entry) => ["DEGRADED", "FAILED", "IN_RMA"].includes(entry.state))
    .reduce((sum, entry) => sum + entry.count, 0);

  return (
    <InsightCard
      title="Fleet Lifecycle Health"
      subtitle={`Derived state across ${health.total} drives`}
      icon={<DeploymentUnitOutlined />}
      extra={
        <Tag
          color={attention > 0 ? "warning" : "success"}
          style={{ marginInlineEnd: 0 }}
        >
          {attention > 0 ? `${attention} need attention` : "Healthy"}
        </Tag>
      }
    >
      {rows.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No lifecycle history recorded yet"
        />
      ) : (
        <div style={{ height: Math.max(rows.length * 38, 160) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={rows}
              layout="vertical"
              margin={{ top: 4, right: 36, bottom: 4, left: 0 }}
              accessibilityLayer
            >
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="label"
                width={108}
                axisLine={false}
                tickLine={false}
                tick={{ fill: token.colorTextSecondary, fontSize: 12 }}
              />
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
              <Bar dataKey="count" barSize={18} radius={[0, 6, 6, 0]}>
                {rows.map((row) => (
                  <Cell key={row.state} fill={row.color} />
                ))}
                <LabelList
                  dataKey="count"
                  position="right"
                  fill={token.colorTextSecondary}
                  fontSize={12}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </InsightCard>
  );
};
