"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { stringifyTableParams, useApiUrl, useCustom } from "@refinedev/core";
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Row,
  Skeleton,
  Space,
  Statistic,
  Typography,
  theme,
} from "antd";
import {
  PieChartOutlined,
  ReloadOutlined,
  RightOutlined,
} from "@ant-design/icons";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const { Text } = Typography;

// AntV's default categorical palette, which reads well in both light and dark
// themes and keeps the dashboard consistent with the antd design language.
const DATACENTER_PALETTE = [
  "#5B8FF9",
  "#61DDAA",
  "#65789B",
  "#F6BD16",
  "#7262FD",
  "#78D3F8",
  "#9661BC",
  "#F6903D",
  "#008685",
  "#F08BB4",
];

type DatacenterDriveCount = {
  datacenterId: string;
  code: string;
  name: string;
  count: number;
};

type PhysicalDriveStats = {
  total: number;
  assigned: number;
  unassigned: number;
  byDatacenter: DatacenterDriveCount[];
};

type DistributionSlice = {
  key: string;
  code: string;
  name: string;
  value: number;
  color: string;
  href: string;
};

type ChartTooltipProps = {
  active?: boolean;
  payload?: Array<{ payload?: DistributionSlice }>;
  total: number;
  surface: string;
  border: string;
  text: string;
  muted: string;
  shadow: string;
};

const ChartTooltip = ({
  active,
  payload,
  total,
  surface,
  border,
  text,
  muted,
  shadow,
}: ChartTooltipProps) => {
  const slice = payload?.[0]?.payload;
  if (!active || !slice) {
    return null;
  }

  const percent = total > 0 ? Math.round((slice.value / total) * 100) : 0;

  return (
    <div
      style={{
        background: surface,
        border: `1px solid ${border}`,
        borderRadius: 10,
        boxShadow: shadow,
        padding: "10px 14px",
        minWidth: 160,
      }}
    >
      <Space size={8} style={{ marginBottom: 4 }}>
        <span
          style={{
            width: 9,
            height: 9,
            borderRadius: "50%",
            background: slice.color,
            display: "inline-block",
          }}
        />
        <span style={{ color: text, fontWeight: 600 }}>
          {slice.code === "—" ? slice.name : slice.code}
        </span>
      </Space>
      <div style={{ color: text, fontSize: 13 }}>
        {slice.value} drive{slice.value === 1 ? "" : "s"}
        <span style={{ color: muted }}> · {percent}%</span>
      </div>
      {slice.code !== "—" ? (
        <div style={{ color: muted, fontSize: 12 }}>{slice.name}</div>
      ) : null}
    </div>
  );
};

const LegendRow = ({
  slice,
  total,
}: {
  slice: DistributionSlice;
  total: number;
}) => {
  const { token } = theme.useToken();
  const [hovered, setHovered] = useState(false);
  const percent = total > 0 ? Math.round((slice.value / total) * 100) : 0;

  return (
    <Link
      href={slice.href}
      style={{ display: "block", color: "inherit" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 12px",
          borderRadius: token.borderRadiusLG,
          border: `1px solid ${
            hovered ? token.colorPrimaryBorder : token.colorBorderSecondary
          }`,
          background: hovered ? token.colorFillQuaternary : "transparent",
          transition: "border-color 0.2s, background 0.2s",
        }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: slice.color,
            flex: "0 0 auto",
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            <Text strong ellipsis style={{ margin: 0 }}>
              {slice.code === "—" ? slice.name : slice.code}
            </Text>
            <Text strong style={{ margin: 0 }}>
              {slice.value}
            </Text>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            <Text type="secondary" ellipsis style={{ fontSize: 12 }}>
              {slice.code === "—" ? "No location recorded" : slice.name}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {percent}%
            </Text>
          </div>
          <div
            style={{
              height: 4,
              borderRadius: 999,
              background: token.colorFillSecondary,
              marginTop: 6,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${percent}%`,
                height: "100%",
                borderRadius: 999,
                background: slice.color,
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
};

/**
 * Dashboard chart for the derived current location of every physical drive.
 * The backend aggregates the append-only location ledger, so this stays a
 * single request even as the inventory grows.
 */
export const PhysicalDriveDistribution = () => {
  const { token } = theme.useToken();
  const apiUrl = useApiUrl();

  const { query, result } = useCustom({
    url: `${apiUrl}/physical-drives/stats`,
    method: "get",
  });

  // Refine's `useCustom` returns a frozen EMPTY_OBJECT while the request is in
  // flight, so validate the shape before treating it as stats.
  const rawStats = result?.data as Partial<PhysicalDriveStats> | undefined;
  const stats =
    rawStats &&
    typeof rawStats.total === "number" &&
    Array.isArray(rawStats.byDatacenter)
      ? (rawStats as PhysicalDriveStats)
      : undefined;

  const slices = useMemo<DistributionSlice[]>(() => {
    if (!stats) {
      return [];
    }

    const items: DistributionSlice[] = stats.byDatacenter.map(
      (datacenter, index) => ({
        key: datacenter.datacenterId,
        code: datacenter.code,
        name: datacenter.name,
        value: datacenter.count,
        color: DATACENTER_PALETTE[index % DATACENTER_PALETTE.length],
        href: `/physical-drives?${stringifyTableParams({
          sorters: [],
          filters: [
            {
              field: "currentLocation",
              operator: "in",
              value: [datacenter.datacenterId],
            },
          ],
        })}`,
      }),
    );

    if (stats.unassigned > 0) {
      items.push({
        key: "unassigned",
        code: "—",
        name: "Unassigned",
        value: stats.unassigned,
        color: token.colorTextTertiary,
        href: "/physical-drives",
      });
    }

    return items;
  }, [stats, token.colorTextTertiary]);

  const title = (
    <Space align="center" size={14}>
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: token.borderRadiusLG,
          background: token.colorPrimaryBg,
          color: token.colorPrimary,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
        }}
      >
        <PieChartOutlined />
      </div>
      <div>
        <div style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.3 }}>
          Physical Drive Distribution
        </div>
        <Text type="secondary" style={{ fontSize: 13, fontWeight: 400 }}>
          Current datacenter of every inventoried drive
        </Text>
      </div>
    </Space>
  );

  const renderBody = () => {
    if (query.isLoading) {
      return <Skeleton active paragraph={{ rows: 6 }} />;
    }

    if (query.isError) {
      return (
        <Alert
          type="error"
          showIcon
          message="Could not load the drive distribution"
          description="The inventory summary request failed. Check the API and try again."
          action={
            <Button
              size="small"
              icon={<ReloadOutlined />}
              onClick={() => query.refetch()}
            >
              Retry
            </Button>
          }
        />
      );
    }

    if (!stats || stats.total === 0) {
      return (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No physical drives inventoried yet"
        />
      );
    }

    const assignedPercent =
      stats.total > 0 ? Math.round((stats.assigned / stats.total) * 100) : 0;

    return (
      <Space direction="vertical" size={24} style={{ display: "flex" }}>
        <Row gutter={[12, 12]}>
          <Col xs={24} sm={8}>
            <div
              style={{
                padding: "12px 16px",
                borderRadius: token.borderRadiusLG,
                background: token.colorFillQuaternary,
              }}
            >
              <Statistic
                title="Total drives"
                value={stats.total}
                valueStyle={{ fontSize: 28, fontWeight: 600 }}
              />
            </div>
          </Col>
          <Col xs={12} sm={8}>
            <div
              style={{
                padding: "12px 16px",
                borderRadius: token.borderRadiusLG,
                background: token.colorFillQuaternary,
              }}
            >
              <Statistic
                title={
                  <Space size={6}>
                    Assigned
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {assignedPercent}%
                    </Text>
                  </Space>
                }
                value={stats.assigned}
                valueStyle={{
                  fontSize: 28,
                  fontWeight: 600,
                  color: token.colorSuccess,
                }}
              />
            </div>
          </Col>
          <Col xs={12} sm={8}>
            <div
              style={{
                padding: "12px 16px",
                borderRadius: token.borderRadiusLG,
                background: token.colorFillQuaternary,
              }}
            >
              <Statistic
                title="Unassigned"
                value={stats.unassigned}
                valueStyle={{
                  fontSize: 28,
                  fontWeight: 600,
                  color:
                    stats.unassigned > 0
                      ? token.colorWarning
                      : token.colorTextSecondary,
                }}
              />
            </div>
          </Col>
        </Row>

        <Row gutter={[32, 24]} align="middle">
          <Col xs={24} lg={11}>
            <div style={{ position: "relative", height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart accessibilityLayer>
                  <Pie
                    data={slices}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="66%"
                    outerRadius="94%"
                    paddingAngle={2}
                    cornerRadius={6}
                    stroke={token.colorBgContainer}
                    strokeWidth={3}
                    isAnimationActive
                  >
                    {slices.map((slice) => (
                      <Cell key={slice.key} fill={slice.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    cursor={false}
                    content={
                      <ChartTooltip
                        total={stats.total}
                        surface={token.colorBgElevated}
                        border={token.colorBorderSecondary}
                        text={token.colorText}
                        muted={token.colorTextSecondary}
                        shadow={token.boxShadowSecondary}
                      />
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  pointerEvents: "none",
                }}
              >
                <Text
                  type="secondary"
                  style={{
                    fontSize: 11,
                    letterSpacing: 1.4,
                    textTransform: "uppercase",
                  }}
                >
                  Total
                </Text>
                <div
                  style={{
                    fontSize: 38,
                    fontWeight: 600,
                    lineHeight: 1.1,
                    color: token.colorText,
                  }}
                >
                  {stats.total}
                </div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  drives
                </Text>
              </div>
            </div>
          </Col>
          <Col xs={24} lg={13}>
            <Space direction="vertical" size={8} style={{ display: "flex" }}>
              {slices.map((slice) => (
                <LegendRow key={slice.key} slice={slice} total={stats.total} />
              ))}
            </Space>
          </Col>
        </Row>
      </Space>
    );
  };

  return (
    <Card
      title={title}
      extra={
        <Link href="/physical-drives">
          <Space size={4} style={{ fontSize: 13 }}>
            View all drives
            <RightOutlined style={{ fontSize: 11 }} />
          </Space>
        </Link>
      }
      style={{
        borderRadius: token.borderRadiusLG,
        borderColor: token.colorBorderSecondary,
      }}
    >
      {renderBody()}
    </Card>
  );
};
