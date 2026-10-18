"use client";

import { Empty, Timeline, Typography } from "antd";
import { ExportOutlined, ImportOutlined } from "@ant-design/icons";

const { Text } = Typography;

export type StoragePoolHostEvent = {
  id: string;
  eventType: string;
  eventTimestamp: string | Date;
  notes?: string | null;
  physicalServerId?: string | null;
  virtualServerId?: string | null;
  physicalServer?: { hostname?: string } | null;
  virtualServer?: { hostname?: string } | null;
};

interface StoragePoolHostsTimelineProps {
  events: StoragePoolHostEvent[];
}

/** Renders the immutable IMPORT/EXPORT history of a storage pool. */
export const StoragePoolHostsTimeline = ({
  events,
}: StoragePoolHostsTimelineProps) => {
  if (!events || events.length === 0) {
    return (
      <Empty
        description="No host history yet"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  return (
    <Timeline
      items={events.map((event) => {
        const isImport = event.eventType === "IMPORT";
        const isPhysical = Boolean(event.physicalServerId);
        const hostname =
          event.physicalServer?.hostname ??
          event.virtualServer?.hostname ??
          "Unknown host";
        const href = isPhysical
          ? `/physical-servers/show/${event.physicalServerId}`
          : `/virtual-servers/show/${event.virtualServerId}`;

        return {
          key: event.id,
          color: isImport ? "green" : "red",
          dot: isImport ? <ImportOutlined /> : <ExportOutlined />,
          children: (
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text strong>{isImport ? "IMPORTED" : "EXPORTED"}</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {new Date(event.eventTimestamp).toLocaleString()}
                </Text>
              </div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {isPhysical ? "Physical" : "Virtual"}:{" "}
                <a href={href} target="_blank" rel="noopener noreferrer">
                  {hostname}
                </a>
              </Text>
              {event.notes && (
                <div
                  style={{
                    marginTop: 6,
                    padding: "6px 10px",
                    borderRadius: 4,
                    borderLeft: `3px solid ${isImport ? "#52c41a" : "#ff4d4f"}`,
                  }}
                >
                  <Text type="secondary" italic>
                    {event.notes}
                  </Text>
                </div>
              )}
            </div>
          ),
        };
      })}
    />
  );
};
