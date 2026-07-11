import React from "react";
import { Timeline, Typography, Empty, Skeleton } from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

// 1. Define the shape of your data
export interface TimelineEvent {
  id: string | number;
  status: string;
  createdAt: string | Date;
  userName?: string;
  reason?: string;
}

interface ApprovalTimelineProps {
  events: TimelineEvent[];
  loading?: boolean;
  title?: string;
}

// 2. Visual Logic: Map status to colors and icons
const getStatusStyles = (status: string) => {
  switch (status?.toLowerCase()) {
    case "approved":
      return { color: "green", icon: <CheckCircleOutlined /> };
    case "rejected":
      return { color: "red", icon: <CloseCircleOutlined /> };
    default:
      return { color: "blue", icon: <ClockCircleOutlined /> };
  }
};

export const ApprovelTimeline: React.FC<ApprovalTimelineProps> = ({
  events,
  loading,
  title,
}) => {
  if (loading) return <Skeleton active paragraph={{ rows: 4 }} />;

  if (!events || events.length === 0) {
    return (
      <Empty
        description="No timeline data available"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  return (
    <Timeline
      items={events.map((event) => {
        const { color, icon } = getStatusStyles(event.status);
        return {
          key: event.id,
          dot: icon,
          color: color,
          children: (
            <div style={{ marginBottom: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text strong>{event.status}</Text>
                <Text type="secondary" style={{ fontSize: "12px" }}>
                  {String(event.createdAt)}
                </Text>
              </div>
              <Text type="secondary" style={{ fontSize: "12px" }}>
                by {event.userName || "System"}
              </Text>
              {event.reason && (
                <div
                  style={{
                    marginTop: "6px",
                    padding: "6px 10px",
                    // background: "#fafafa",
                    borderRadius: "4px",
                    borderLeft: `3px solid ${color}`,
                  }}
                >
                  <Text type="secondary" italic>
                    {event.reason}
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
