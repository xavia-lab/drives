"use client";

import { Empty, Typography, theme } from "antd";
import { ClockCircleOutlined } from "@ant-design/icons";
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
import type { OldestInUseDrive } from "./types";

const { Text } = Typography;

type BarRow = OldestInUseDrive & {
  ageLabel: string;
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
      <div style={{ color: text, fontWeight: 600 }}>{row.serialNumber}</div>
      <div style={{ color: muted, fontSize: 12 }}>
        {row.ageLabel} · purchased {row.purchaseDate}
      </div>
      <div style={{ color: muted, fontSize: 12 }}>
        {row.lifecycleState} · {row.datacenterCode ?? "Unassigned"}
      </div>
    </div>
  );
};

export const OldestInUseCard = ({ drives }: { drives: OldestInUseDrive[] }) => {
  const { token } = theme.useToken();

  const rows: BarRow[] = drives.map((drive) => ({
    ...drive,
    ageLabel: `${drive.ageYears.toFixed(1)} yrs`,
    color:
      drive.ageYears >= 5
        ? token.colorError
        : drive.ageYears >= 3
          ? token.colorWarning
          : token.colorPrimary,
  }));

  return (
    <InsightCard
      title="Oldest In-Use Drives"
      subtitle="Five oldest drives currently seated in a server"
      icon={<ClockCircleOutlined />}
      extra={
        <Text type="secondary" style={{ fontSize: 12 }}>
          Mounted only
        </Text>
      }
    >
      {rows.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No drives are currently mounted"
        />
      ) : (
        <div style={{ height: Math.max(rows.length * 40, 180) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={rows}
              layout="vertical"
              margin={{ top: 4, right: 54, bottom: 4, left: 0 }}
              accessibilityLayer
            >
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="serialNumber"
                width={104}
                axisLine={false}
                tickLine={false}
                tick={{ fill: token.colorTextSecondary, fontSize: 11 }}
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
              <Bar dataKey="ageYears" barSize={18} radius={[0, 6, 6, 0]}>
                {rows.map((row) => (
                  <Cell key={row.driveId} fill={row.color} />
                ))}
                <LabelList
                  dataKey="ageLabel"
                  position="right"
                  fill={token.colorTextSecondary}
                  fontSize={11}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </InsightCard>
  );
};
