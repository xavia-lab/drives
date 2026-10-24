"use client";

import { useApiUrl, useCustom } from "@refinedev/core";
import Link from "next/link";
import {
  Empty,
  Progress,
  Skeleton,
  Space,
  Table,
  Tag,
  Typography,
  theme,
} from "antd";
import { DatabaseOutlined } from "@ant-design/icons";
import { InsightCard } from "./insight-card";

const { Text } = Typography;

interface ReportPool {
  id: string;
  poolName: string;
  currentHost?: { type: string; hostname: string } | null;
  vdevCount: number;
  dataVdevCount: number;
  rawBytes: number | null;
  usableBytes: number | null;
  capacityKnown: boolean;
  estimated: boolean;
  health:
    "PLANNED" | "INCOMPLETE" | "ONLINE" | "DEGRADED" | "FAILED" | "UNKNOWN";
  spareVdevCount: number;
  spareMemberCount: number;
}

interface Report {
  pools: ReportPool[];
  totals: {
    poolCount: number;
    vdevCount: number;
    dataVdevCount: number;
    rawBytes: number;
    usableBytes: number;
    capacityKnown: boolean;
    estimated: boolean;
    spareVdevCount: number;
    spareMemberCount: number;
    attentionPoolCount: number;
  };
}

const healthColor: Record<ReportPool["health"], string> = {
  PLANNED: "default",
  INCOMPLETE: "orange",
  ONLINE: "green",
  DEGRADED: "gold",
  FAILED: "red",
  UNKNOWN: "default",
};

const formatBytes = (bytes: number | null | undefined) => {
  if (bytes === null || bytes === undefined) return "-";
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1000)),
    units.length - 1,
  );
  return `${(bytes / 1000 ** index).toFixed(2)} ${units[index]}`;
};

export const StorageCapacityReportCard = () => {
  const apiUrl = useApiUrl();
  const { token } = theme.useToken();
  const { query, result } = useCustom<Report>({
    url: `${apiUrl}/storage-pools/capacity-report`,
    method: "get",
    queryOptions: { refetchOnWindowFocus: false },
  });

  const raw = result?.data as Partial<Report> | undefined;
  const report =
    raw && Array.isArray(raw.pools) && raw.totals ? (raw as Report) : undefined;
  const efficiency =
    report?.totals.rawBytes && report.totals.rawBytes > 0
      ? Math.round((report.totals.usableBytes / report.totals.rawBytes) * 100)
      : 0;

  return (
    <InsightCard
      title="Storage Pool Capacity"
      subtitle="Vdev-derived raw and usable capacity across pools"
      icon={<DatabaseOutlined />}
      extra={
        report?.totals.estimated || report?.totals.attentionPoolCount ? (
          <Space size={4}>
            {report?.totals.estimated ? (
              <Tag color="orange">Includes estimates</Tag>
            ) : null}
            {report?.totals.attentionPoolCount ? (
              <Tag color="red">
                {report.totals.attentionPoolCount} pool(s) need attention
              </Tag>
            ) : null}
          </Space>
        ) : undefined
      }
    >
      {query.isLoading ? (
        <Skeleton active paragraph={{ rows: 5 }} />
      ) : !report ? (
        <Empty description="No storage capacity data" />
      ) : (
        <Space direction="vertical" size={16} style={{ display: "flex" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: 12,
            }}
          >
            {[
              ["Pools", report.totals.poolCount],
              ["Vdevs", report.totals.vdevCount],
              ["Raw", formatBytes(report.totals.rawBytes)],
              ["Usable", formatBytes(report.totals.usableBytes)],
              ["Spares", report.totals.spareMemberCount],
            ].map(([label, value]) => (
              <div
                key={String(label)}
                style={{
                  padding: "10px 12px",
                  borderRadius: token.borderRadiusLG,
                  background: token.colorFillQuaternary,
                }}
              >
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {label}
                </Text>
                <div style={{ fontSize: 18, fontWeight: 600 }}>{value}</div>
              </div>
            ))}
          </div>

          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Overall capacity efficiency
            </Text>
            <Progress
              percent={efficiency}
              strokeColor={token.colorPrimary}
              trailColor={token.colorFillSecondary}
            />
          </div>

          <Table
            dataSource={report.pools}
            rowKey="id"
            pagination={false}
            size="small"
            scroll={{ x: true }}
          >
            <Table.Column
              title="Pool"
              render={(_, pool: ReportPool) => (
                <Link href={`/storage-pools/show/${pool.id}`}>
                  {pool.poolName}
                </Link>
              )}
            />
            <Table.Column
              title="Host"
              render={(_, pool: ReportPool) =>
                pool.currentHost
                  ? `${pool.currentHost.type === "PHYSICAL" ? "Physical" : "Virtual"} · ${pool.currentHost.hostname}`
                  : "Detached"
              }
            />
            <Table.Column title="Vdevs" dataIndex="vdevCount" width={80} />
            <Table.Column
              title="Raw"
              width={120}
              render={(_, pool: ReportPool) => formatBytes(pool.rawBytes)}
            />
            <Table.Column
              title="Usable"
              width={120}
              render={(_, pool: ReportPool) => formatBytes(pool.usableBytes)}
            />
            <Table.Column
              title="Health"
              width={110}
              render={(_, pool: ReportPool) => (
                <Tag color={healthColor[pool.health]}>{pool.health}</Tag>
              )}
            />
            <Table.Column
              title="Spares"
              width={90}
              render={(_, pool: ReportPool) =>
                pool.spareMemberCount > 0
                  ? `${pool.spareMemberCount} (${pool.spareVdevCount} vdev)`
                  : "-"
              }
            />
            <Table.Column
              title="Capacity"
              width={110}
              render={(_, pool: ReportPool) =>
                pool.capacityKnown ? (
                  <Tag color={pool.estimated ? "orange" : "green"}>
                    {pool.estimated ? "Estimated" : "Known"}
                  </Tag>
                ) : (
                  <Tag color="red">Unknown</Tag>
                )
              }
            />
          </Table>
        </Space>
      )}
    </InsightCard>
  );
};
