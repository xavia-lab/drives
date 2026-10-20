"use client";

import Link from "next/link";
import { Empty, Progress, Space, Typography, theme } from "antd";
import { DatabaseOutlined } from "@ant-design/icons";
import { InsightCard } from "./insight-card";
import type { SlotUtilization } from "./types";

const { Text } = Typography;

const Metric = ({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color?: string;
}) => {
  const { token } = theme.useToken();

  return (
    <div
      style={{
        padding: "8px 12px",
        borderRadius: token.borderRadiusLG,
        background: token.colorFillQuaternary,
      }}
    >
      <Text type="secondary" style={{ fontSize: 11 }}>
        {label}
      </Text>
      <div
        style={{
          fontSize: 20,
          fontWeight: 600,
          lineHeight: 1.2,
          color: color ?? token.colorText,
        }}
      >
        {value}
      </div>
    </div>
  );
};

export const SlotUtilizationCard = ({
  utilization,
}: {
  utilization: SlotUtilization;
}) => {
  const { token } = theme.useToken();

  return (
    <InsightCard
      title="Slot Utilization"
      subtitle="Drive bays across physical servers"
      icon={<DatabaseOutlined />}
    >
      {utilization.totalSlots === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No server slots defined yet"
        />
      ) : (
        <Space direction="vertical" size={16} style={{ display: "flex" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              paddingTop: 4,
            }}
          >
            <Progress
              type="circle"
              size={132}
              percent={utilization.utilizationPercent}
              strokeColor={token.colorPrimary}
              trailColor={token.colorFillSecondary}
              strokeWidth={8}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 8,
            }}
          >
            <Metric
              label="Occupied"
              value={utilization.occupiedSlots}
              color={token.colorPrimary}
            />
            <Metric label="Free" value={utilization.freeSlots} />
            <Metric
              label="Unseated drives"
              value={utilization.unseatedDrives}
              color={
                utilization.unseatedDrives > 0
                  ? token.colorWarning
                  : token.colorText
              }
            />
            <Metric
              label="Servers with space"
              value={utilization.serversWithFreeSlots}
            />
          </div>

          <div>
            <Text
              type="secondary"
              style={{
                display: "block",
                fontSize: 11,
                letterSpacing: 1.1,
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              Most free capacity
            </Text>
            <Space direction="vertical" size={8} style={{ display: "flex" }}>
              {utilization.topServersByFreeSlots.map((server) => {
                const occupiedPercent =
                  server.totalSlots > 0
                    ? Math.round(
                        (server.occupiedSlots / server.totalSlots) * 100,
                      )
                    : 0;

                return (
                  <Link
                    key={server.serverId}
                    href={`/physical-servers/show/${server.serverId}`}
                    style={{ color: "inherit" }}
                  >
                    <div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 8,
                        }}
                      >
                        <Text strong ellipsis style={{ fontSize: 13 }}>
                          {server.hostname}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {server.freeSlots} free / {server.totalSlots}
                        </Text>
                      </div>
                      <Progress
                        percent={occupiedPercent}
                        showInfo={false}
                        size="small"
                        strokeColor={token.colorPrimary}
                        trailColor={token.colorFillSecondary}
                      />
                    </div>
                  </Link>
                );
              })}
            </Space>
          </div>
        </Space>
      )}
    </InsightCard>
  );
};
