"use client";

import Link from "next/link";
import { Empty, Space, Tag, Timeline, Typography, theme } from "antd";
import {
  FileProtectOutlined,
  HistoryOutlined,
  ToolOutlined,
} from "@ant-design/icons";
import { InsightCard } from "./insight-card";
import { WARRANTY_CLAIM_EVENT_LABELS } from "@app/warranty-claims/_components/warranty-claim-tracking-timeline";
import type { RecentActivity } from "./types";

const { Text } = Typography;

const DRIVE_EVENT_LABELS: Record<string, string> = {
  ACQUIRE: "Acquired",
  PROVISION: "Provisioned",
  DEPROVISION: "Deprovisioned",
  DEGRADE: "Degraded",
  RECOVER: "Recovered",
  FAIL: "Failed",
  RMA_INITIATE: "RMA initiated",
  RMA_SHIP: "Shipped to vendor",
  RMA_APPROVE: "RMA approved",
  RMA_REJECT: "RMA rejected",
  RMA_REPLACE: "Replacement received",
  RMA_CLOSE: "RMA closed",
  RETIRE: "Retired",
  SCRAP_SHRED: "Scrapped",
  LOST: "Lost",
  INSPECT: "Inspected",
  NOTE: "Note",
};

const eventColor = (item: RecentActivity): string => {
  if (item.kind === "WARRANTY") {
    if (item.eventType === "CLOSED") return "green";
    if (item.eventType === "REJECTED") return "red";
    if (item.eventType === "NOTE") return "gray";
    return "#722ed1";
  }

  if (["FAIL", "LOST", "RMA_REJECT"].includes(item.eventType)) return "red";
  if (item.eventType === "DEGRADE") return "orange";
  if (item.eventType.startsWith("RMA_")) return "#722ed1";
  if (
    ["ACQUIRE", "PROVISION", "RECOVER", "RMA_APPROVE"].includes(item.eventType)
  )
    return "green";
  if (item.eventType === "NOTE") return "gray";
  return "blue";
};

const relativeTime = (value: string): string => {
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return value;

  const minutes = Math.floor((Date.now() - timestamp) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  return new Date(value).toLocaleDateString();
};

export const RecentActivityCard = ({
  activity,
}: {
  activity: RecentActivity[];
}) => {
  const { token } = theme.useToken();

  const items = activity.map((item) => ({
    key: item.id,
    color: eventColor(item),
    dot: (
      <span style={{ color: eventColor(item) }}>
        {item.kind === "WARRANTY" ? <FileProtectOutlined /> : <ToolOutlined />}
      </span>
    ),
    children: (
      <div style={{ paddingBottom: 4 }}>
        <Space size={8} wrap>
          <Text strong style={{ fontSize: 13 }}>
            {item.kind === "WARRANTY"
              ? (WARRANTY_CLAIM_EVENT_LABELS[item.eventType] ?? item.eventType)
              : (DRIVE_EVENT_LABELS[item.eventType] ?? item.eventType)}
          </Text>
          <Tag
            color={item.kind === "WARRANTY" ? "purple" : "blue"}
            style={{ marginInlineEnd: 0, fontSize: 11 }}
          >
            {item.kind === "WARRANTY" ? "Warranty" : "Drive"}
          </Tag>
          <Text type="secondary" style={{ fontSize: 11 }}>
            {relativeTime(item.eventTimestamp)}
          </Text>
        </Space>

        <div style={{ marginTop: 2 }}>
          {item.driveId ? (
            <Link href={`/physical-drives/show/${item.driveId}`}>
              {item.driveSerialNumber ?? item.driveLabel ?? "View drive"}
            </Link>
          ) : (
            <Text type="secondary">Drive unavailable</Text>
          )}
          {item.warrantyClaimId ? (
            <>
              <Text type="secondary"> · </Text>
              <Link href={`/warranty-claims/show/${item.warrantyClaimId}`}>
                {item.rmaTrackingNumber
                  ? `Claim ${item.rmaTrackingNumber}`
                  : "View claim"}
              </Link>
            </>
          ) : null}
        </div>

        {item.notes || item.triggeredBy ? (
          <Text
            type="secondary"
            ellipsis
            style={{ display: "block", fontSize: 12, marginTop: 2 }}
          >
            {item.notes ?? `by ${item.triggeredBy}`}
          </Text>
        ) : null}
      </div>
    ),
  }));

  return (
    <InsightCard
      title="Recent Activity"
      subtitle="Latest drive lifecycle and warranty events"
      icon={<HistoryOutlined />}
    >
      {items.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No recent activity recorded"
        />
      ) : (
        <Timeline
          items={items}
          style={{ marginTop: 4, marginBottom: 0, color: token.colorText }}
        />
      )}
    </InsightCard>
  );
};
