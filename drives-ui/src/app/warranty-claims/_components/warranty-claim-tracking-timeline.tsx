"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Empty, Tag, Timeline, Typography } from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExportOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  SendOutlined,
  SwapOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

export type WarrantyClaimTrackingEvent = {
  id: string;
  displayKey?: number;
  eventType: string;
  eventTimestamp: string | Date;
  notes?: string | null;
  performedByUserId?: string | null;
  replacementPhysicalDriveId?: string | null;
};

export type WarrantyClaimTrackingTimelineResponse = {
  warrantyClaimId: string;
  currentStatus: string;
  allowedEvents: string[];
  currentEvent: WarrantyClaimTrackingEvent | null;
  events: WarrantyClaimTrackingEvent[];
};

type EventMeta = {
  label: string;
  tagColor: string;
  dotColor: string;
  icon: ReactNode;
};

const EVENT_META: Record<string, EventMeta> = {
  SHIPPED_TO_VENDOR: {
    label: "Shipped to vendor",
    tagColor: "geekblue",
    dotColor: "#2f54eb",
    icon: <SendOutlined />,
  },
  APPROVED: {
    label: "Approved",
    tagColor: "green",
    dotColor: "green",
    icon: <CheckCircleOutlined />,
  },
  REJECTED: {
    label: "Rejected",
    tagColor: "red",
    dotColor: "red",
    icon: <CloseCircleOutlined />,
  },
  REPLACEMENT_RECEIVED: {
    label: "Replacement received",
    tagColor: "purple",
    dotColor: "#722ed1",
    icon: <SwapOutlined />,
  },
  CLOSED: {
    label: "Closed",
    tagColor: "default",
    dotColor: "gray",
    icon: <CheckCircleOutlined />,
  },
  NOTE: {
    label: "Note",
    tagColor: "default",
    dotColor: "gray",
    icon: <FileTextOutlined />,
  },
};

export const WARRANTY_CLAIM_EVENT_LABELS: Record<string, string> = Object.keys(
  EVENT_META,
).reduce<Record<string, string>>((labels, key) => {
  labels[key] = EVENT_META[key].label;
  return labels;
}, {});

const fallbackMeta = (eventType: string): EventMeta => ({
  label: eventType,
  tagColor: "default",
  dotColor: "gray",
  icon: <InfoCircleOutlined />,
});

/** Renders a warranty claim's tracking log, newest first. */
export const WarrantyClaimTrackingTimeline = ({
  events,
}: {
  events: WarrantyClaimTrackingEvent[];
}) => {
  if (!events || events.length === 0) {
    return (
      <Empty
        description="No tracking events yet"
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
              {event.notes ? (
                <div
                  style={{
                    marginTop: 6,
                    padding: "6px 10px",
                    borderRadius: 4,
                    borderLeft: `3px solid ${meta.dotColor}`,
                  }}
                >
                  <Text type="secondary" italic>
                    {event.notes}
                  </Text>
                </div>
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
