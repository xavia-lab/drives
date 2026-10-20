"use client";

import { Empty, Space, Tag, Typography, theme } from "antd";
import { SyncOutlined } from "@ant-design/icons";
import { InsightCard } from "./insight-card";
import { WARRANTY_CLAIM_STATUS_OPTIONS } from "@app/warranty-claims/_components/warranty-claim-status-tag";
import type { RmaPipeline } from "./types";

const { Text } = Typography;

const STATUS_LABELS: Record<string, string> = Object.fromEntries(
  WARRANTY_CLAIM_STATUS_OPTIONS.map((option) => [option.value, option.label]),
);

const STATUS_COLORS: Record<string, string> = {
  SUBMITTED: "#5B8FF9",
  SHIPPED_TO_VENDOR: "#7262FD",
  APPROVED: "#61DDAA",
  REJECTED: "#E8684A",
  REPLACEMENT_RECEIVED: "#9661BC",
  CLOSED: "#8c8c8c",
};

export const RmaPipelineCard = ({ pipeline }: { pipeline: RmaPipeline }) => {
  const { token } = theme.useToken();
  const maxCount = Math.max(
    ...pipeline.byStatus.map((entry) => entry.count),
    1,
  );

  return (
    <InsightCard
      title="RMA Pipeline"
      subtitle={`${pipeline.totalClaims} claims · ${pipeline.openClaims} open`}
      icon={<SyncOutlined />}
      extra={
        pipeline.openClaims > 0 ? (
          <Tag color="processing" style={{ marginInlineEnd: 0 }}>
            {pipeline.openClaims} in flight
          </Tag>
        ) : (
          <Tag color="success" style={{ marginInlineEnd: 0 }}>
            All closed
          </Tag>
        )
      }
    >
      {pipeline.totalClaims === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No warranty claims opened yet"
        />
      ) : (
        <Space direction="vertical" size={14} style={{ display: "flex" }}>
          <Space size={16} wrap>
            <div>
              <Text type="secondary" style={{ fontSize: 11 }}>
                Total claims
              </Text>
              <div style={{ fontSize: 22, fontWeight: 600 }}>
                {pipeline.totalClaims}
              </div>
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 11 }}>
                Avg resolution
              </Text>
              <div style={{ fontSize: 22, fontWeight: 600 }}>
                {pipeline.averageResolutionDays !== null
                  ? `${pipeline.averageResolutionDays}d`
                  : "—"}
              </div>
            </div>
          </Space>

          <Space direction="vertical" size={10} style={{ display: "flex" }}>
            {pipeline.byStatus.map((entry) => {
              const color = STATUS_COLORS[entry.status] ?? token.colorPrimary;
              const width =
                entry.count > 0 ? (entry.count / maxCount) * 100 : 0;

              return (
                <div key={entry.status}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      justifyContent: "space-between",
                      gap: 8,
                    }}
                  >
                    <Space size={8}>
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: color,
                          display: "inline-block",
                          opacity: entry.count > 0 ? 1 : 0.35,
                        }}
                      />
                      <Text
                        style={{
                          fontSize: 13,
                          color:
                            entry.count > 0
                              ? token.colorText
                              : token.colorTextTertiary,
                        }}
                      >
                        {STATUS_LABELS[entry.status] ?? entry.status}
                      </Text>
                    </Space>
                    <Space size={8}>
                      <Text strong style={{ fontSize: 13 }}>
                        {entry.count}
                      </Text>
                      <Text
                        type="secondary"
                        style={{
                          fontSize: 11,
                          minWidth: 58,
                          textAlign: "right",
                        }}
                      >
                        {entry.averageDaysInStatus !== null
                          ? `${entry.averageDaysInStatus}d avg`
                          : "—"}
                      </Text>
                    </Space>
                  </div>
                  <div
                    style={{
                      height: 5,
                      borderRadius: 999,
                      background: token.colorFillSecondary,
                      marginTop: 4,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${width}%`,
                        height: "100%",
                        borderRadius: 999,
                        background: color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </Space>
        </Space>
      )}
    </InsightCard>
  );
};
