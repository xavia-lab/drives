"use client";

import { useDroppable } from "@dnd-kit/core";
import { Card, Empty, Space, Tag, Typography, theme } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import { DriveChip } from "@app/physical-servers/_components/slot-assignment/drive-chip";
import type { BoardDrive } from "@app/physical-servers/_components/slot-assignment/types";

const { Text } = Typography;

export const ALLOCATION_POOL_ID = "allocation-drive-pool";

interface AllocationDrivePoolProps {
  drives: BoardDrive[];
  busy?: boolean;
}

/**
 * Pool of drives that can be seated on the target server: drives detached from
 * the source plus unseated drives in the datacenter. It is also the drop target
 * that unstages a drive from a target slot.
 */
export const AllocationDrivePool = ({
  drives,
  busy = false,
}: AllocationDrivePoolProps) => {
  const { setNodeRef, isOver } = useDroppable({ id: ALLOCATION_POOL_ID });
  const { token } = theme.useToken();

  return (
    <div ref={setNodeRef} style={{ height: "100%" }}>
      <Card
        title={
          <Space>
            <InboxOutlined />
            <span>Available drives</span>
            <Tag>{drives.length}</Tag>
          </Space>
        }
        style={{
          height: "100%",
          borderColor: isOver ? token.colorPrimary : undefined,
          boxShadow: isOver ? `0 0 0 2px ${token.colorPrimaryBg}` : undefined,
        }}
        styles={{ body: { padding: 12 } }}
      >
        <Text
          type="secondary"
          style={{ fontSize: 12, display: "block", marginBottom: 8 }}
        >
          Detached source drives and unseated drives in this datacenter. Drag
          one onto a target slot; drop a seated drive back here to unstage it.
        </Text>
        {drives.length > 0 ? (
          <Space direction="vertical" size={8} style={{ display: "flex" }}>
            {drives.map((drive) => (
              <DriveChip
                key={drive.id}
                driveId={drive.id}
                label={drive.label}
                serialNumber={drive.serialNumber}
                driveModelName={drive.driveModelName}
                disabled={busy}
              />
            ))}
          </Space>
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No available drives"
            style={{ margin: "24px 0" }}
          />
        )}
      </Card>
    </div>
  );
};
