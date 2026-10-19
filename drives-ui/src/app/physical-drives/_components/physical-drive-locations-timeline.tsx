"use client";

import { Empty, Tag, Timeline, Typography } from "antd";
import { EnvironmentOutlined } from "@ant-design/icons";

const { Text } = Typography;

export type PhysicalDriveLocationEvent = {
  id: string;
  displayKey?: number;
  datacenterId: string;
  locatedAt: string | Date;
  notes?: string | null;
  datacenter?: { code?: string | null; name?: string | null } | null;
};

interface PhysicalDriveLocationsTimelineProps {
  events: PhysicalDriveLocationEvent[];
  /** The id of the derived current location, marked as "Current". */
  currentLocationId?: string;
}

/** Renders the immutable location history of a physical drive, newest first. */
export const PhysicalDriveLocationsTimeline = ({
  events,
  currentLocationId,
}: PhysicalDriveLocationsTimelineProps) => {
  if (!events || events.length === 0) {
    return (
      <Empty
        description="No location history yet"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  const ordered = [...events].sort(
    (a, b) =>
      new Date(b.locatedAt).getTime() - new Date(a.locatedAt).getTime() ||
      (b.displayKey ?? 0) - (a.displayKey ?? 0),
  );

  return (
    <Timeline
      items={ordered.map((event) => {
        const datacenterLabel =
          [event.datacenter?.code, event.datacenter?.name]
            .filter(Boolean)
            .join(" - ") || "Unknown datacenter";
        const isCurrent = event.id === currentLocationId;

        return {
          key: event.id,
          color: isCurrent ? "green" : "blue",
          dot: <EnvironmentOutlined />,
          children: (
            <div style={{ marginBottom: 12 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <Text strong>
                  {datacenterLabel}
                  {isCurrent ? (
                    <Tag color="green" style={{ marginInlineStart: 8 }}>
                      Current
                    </Tag>
                  ) : null}
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {new Date(event.locatedAt).toLocaleString()}
                </Text>
              </div>
              <Typography.Link
                href={`/datacenters/show/${event.datacenterId}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 12 }}
              >
                View datacenter
              </Typography.Link>
              {event.notes && (
                <div
                  style={{
                    marginTop: 6,
                    padding: "6px 10px",
                    borderRadius: 4,
                    borderLeft: "3px solid #1677ff",
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
