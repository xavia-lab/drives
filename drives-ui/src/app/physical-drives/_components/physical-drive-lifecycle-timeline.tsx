"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Empty, Tag, Timeline, Typography } from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  DisconnectOutlined,
  ExportOutlined,
  FileProtectOutlined,
  FileTextOutlined,
  InboxOutlined,
  InfoCircleOutlined,
  QuestionCircleOutlined,
  SearchOutlined,
  SendOutlined,
  StopOutlined,
  SwapOutlined,
  ToolOutlined,
  WarningOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

export type DriveLifecycleEventRecord = {
  id: string;
  displayKey?: number;
  eventType: string;
  eventTimestamp: string | Date;
  triggeredBy?: string | null;
  performedByUserId?: string | null;
  contextMetadata?: Record<string, unknown> | null;
  replacementPhysicalDriveId?: string | null;
};

export type DriveLifecycleTimeline = {
  physicalDriveId: string;
  currentState: string;
  currentEvent: DriveLifecycleEventRecord | null;
  events: DriveLifecycleEventRecord[];
};

type EventMeta = {
  label: string;
  tagColor: string;
  dotColor: string;
  icon: ReactNode;
};

const EVENT_META: Record<string, EventMeta> = {
  ACQUIRE: {
    label: "Acquired",
    tagColor: "green",
    dotColor: "green",
    icon: <InboxOutlined />,
  },
  PROVISION: {
    label: "Provisioned",
    tagColor: "green",
    dotColor: "green",
    icon: <CheckCircleOutlined />,
  },
  DEPROVISION: {
    label: "Deprovisioned",
    tagColor: "blue",
    dotColor: "blue",
    icon: <DisconnectOutlined />,
  },
  DEGRADE: {
    label: "Degraded",
    tagColor: "orange",
    dotColor: "orange",
    icon: <WarningOutlined />,
  },
  RECOVER: {
    label: "Recovered",
    tagColor: "cyan",
    dotColor: "cyan",
    icon: <ToolOutlined />,
  },
  FAIL: {
    label: "Failed",
    tagColor: "red",
    dotColor: "red",
    icon: <CloseCircleOutlined />,
  },
  RMA_INITIATE: {
    label: "RMA initiated",
    tagColor: "geekblue",
    dotColor: "#2f54eb",
    icon: <FileProtectOutlined />,
  },
  RMA_SHIP: {
    label: "Shipped to vendor",
    tagColor: "geekblue",
    dotColor: "#2f54eb",
    icon: <SendOutlined />,
  },
  RMA_APPROVE: {
    label: "RMA approved",
    tagColor: "green",
    dotColor: "green",
    icon: <CheckCircleOutlined />,
  },
  RMA_REJECT: {
    label: "RMA rejected",
    tagColor: "red",
    dotColor: "red",
    icon: <CloseCircleOutlined />,
  },
  RMA_REPLACE: {
    label: "Replacement received",
    tagColor: "purple",
    dotColor: "#722ed1",
    icon: <SwapOutlined />,
  },
  RMA_CLOSE: {
    label: "RMA closed",
    tagColor: "default",
    dotColor: "gray",
    icon: <CheckCircleOutlined />,
  },
  RETIRE: {
    label: "Retired",
    tagColor: "default",
    dotColor: "gray",
    icon: <StopOutlined />,
  },
  SCRAP_SHRED: {
    label: "Scrapped / shredded",
    tagColor: "volcano",
    dotColor: "#fa541c",
    icon: <DeleteOutlined />,
  },
  LOST: {
    label: "Lost",
    tagColor: "red",
    dotColor: "red",
    icon: <QuestionCircleOutlined />,
  },
  INSPECT: {
    label: "Inspected",
    tagColor: "default",
    dotColor: "gray",
    icon: <SearchOutlined />,
  },
  NOTE: {
    label: "Note",
    tagColor: "default",
    dotColor: "gray",
    icon: <FileTextOutlined />,
  },
};

const fallbackMeta = (eventType: string): EventMeta => ({
  label: eventType,
  tagColor: "default",
  dotColor: "gray",
  icon: <InfoCircleOutlined />,
});

/** Renders the append-only lifecycle history of a physical drive, newest first. */
export const PhysicalDriveLifecycleTimeline = ({
  events,
}: {
  events: DriveLifecycleEventRecord[];
}) => {
  if (!events || events.length === 0) {
    return (
      <Empty
        description="No lifecycle events yet"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  const ordered = [...events].sort(
    (a, b) =>
      new Date(b.eventTimestamp).getTime() -
        new Date(a.eventTimestamp).getTime() ||
      (b.displayKey ?? 0) - (a.displayKey ?? 0),
  );

  return (
    <Timeline
      items={ordered.map((event) => {
        const meta =
          EVENT_META[event.eventType] ?? fallbackMeta(event.eventType);
        const metadata = event.contextMetadata ?? {};
        const reason =
          typeof metadata.reason === "string" &&
          metadata.reason.trim().length > 0
            ? metadata.reason
            : null;
        const details = Object.entries(metadata)
          .filter(
            ([key, value]) =>
              key !== "reason" &&
              (typeof value === "string" ||
                typeof value === "number" ||
                typeof value === "boolean"),
          )
          .map(([key, value]) => `${key}: ${String(value)}`)
          .join(" · ");

        return {
          key: event.id,
          color: meta.dotColor,
          dot: meta.icon,
          children: (
            <div style={{ marginBottom: 12 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <Tag color={meta.tagColor} style={{ marginInlineEnd: 0 }}>
                  {meta.label}
                </Tag>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {new Date(event.eventTimestamp).toLocaleString()}
                </Text>
              </div>
              {event.triggeredBy ? (
                <Text
                  type="secondary"
                  style={{ fontSize: 12, display: "block", marginTop: 4 }}
                >
                  Recorded by {event.triggeredBy}
                </Text>
              ) : null}
              {reason ? (
                <div
                  style={{
                    marginTop: 6,
                    padding: "6px 10px",
                    borderRadius: 4,
                    borderLeft: `3px solid ${meta.dotColor}`,
                  }}
                >
                  <Text type="secondary" italic>
                    {reason}
                  </Text>
                </div>
              ) : null}
              {details ? (
                <Text
                  type="secondary"
                  style={{ fontSize: 12, display: "block", marginTop: 4 }}
                >
                  {details}
                </Text>
              ) : null}
              {event.replacementPhysicalDriveId ? (
                <div style={{ marginTop: 4 }}>
                  <Link
                    href={`/physical-drives/show/${event.replacementPhysicalDriveId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 12 }}
                  >
                    Replacement drive <ExportOutlined />
                  </Link>
                </div>
              ) : null}
            </div>
          ),
        };
      })}
    />
  );
};
