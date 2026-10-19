"use client";

import { Empty, Timeline, Typography } from "antd";
import { EnvironmentOutlined } from "@ant-design/icons";

const { Text } = Typography;

export type PhysicalDriveLocationEvent = {
  id: string;
  datacenterId: string;
  locatedAt: string | Date;
  notes?: string | null;
  datacenter?: { code?: string | null; name?: string | null } | null;
};

interface PhysicalDriveLocationsTimelineProps {
  events: PhysicalDriveLocationEvent[];
}

/** Renders the immutable location history of a physical drive. */
export const PhysicalDriveLocationsTimeline = ({
  events,
}: PhysicalDriveLocationsTimelineProps) => {
  if (!events || events.length === 0) {
    return (
      <Empty
        description="No location history yet"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  return (
    <Timeline
      items={events.map((event) => {
        const datacenterLabel =
          [event.datacenter?.code, event.datacenter?.name]
            .filter(Boolean)
            .join(" - ") || "Unknown datacenter";

        return {
          key: event.id,
          color: "blue",
          dot: <EnvironmentOutlined />,
          children: (
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text strong>{datacenterLabel}</Text>
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
