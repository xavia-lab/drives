"use client";

import { useDroppable } from "@dnd-kit/core";
import { Button, Tag, Tooltip, Typography, theme } from "antd";
import {
  CloseCircleOutlined,
  DatabaseOutlined,
  InboxOutlined,
} from "@ant-design/icons";
import { DriveChip } from "./drive-chip";
import type { BoardSlot } from "./types";

const { Text } = Typography;

interface SlotCardProps {
  slot: BoardSlot;
  interfaceLabel: string;
  busy: boolean;
  onRemove: (slotId: string) => void;
}

export const SlotCard = ({
  slot,
  interfaceLabel,
  busy,
  onRemove,
}: SlotCardProps) => {
  const { token } = theme.useToken();
  const occupied = Boolean(slot.occupancy);
  const { setNodeRef, isOver } = useDroppable({
    id: slot.id,
    data: { type: "slot" },
    disabled: occupied,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        borderRadius: 12,
        border: occupied
          ? `1px solid ${token.colorPrimaryBorder}`
          : isOver
            ? `2px dashed ${token.colorPrimary}`
            : `1px dashed ${token.colorBorder}`,
        background: occupied
          ? token.colorPrimaryBg
          : isOver
            ? token.colorPrimaryBgHover
            : token.colorFillQuaternary,
        padding: 12,
        transition: "border-color 120ms ease, background 120ms ease",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        minHeight: 132,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <div
          style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}
        >
          <DatabaseOutlined
            style={{
              color: occupied ? token.colorPrimary : token.colorTextTertiary,
            }}
          />
          <Text strong ellipsis style={{ fontSize: 14 }}>
            {slot.slotLabel}
          </Text>
        </div>
        <Tooltip title={slot.pcieBusAddress ?? "No PCIe address"}>
          <Tag
            style={{ marginInlineEnd: 0, maxWidth: 120, overflow: "hidden" }}
            color={slot.pcieBusAddress ? "geekblue" : "default"}
          >
            {slot.pcieBusAddress ?? "—"}
          </Tag>
        </Tooltip>
      </div>

      <Text type="secondary" style={{ fontSize: 12 }}>
        {interfaceLabel}
      </Text>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          gap: 8,
        }}
      >
        {slot.occupancy ? (
          <DriveChip
            driveId={slot.occupancy.physicalDriveId}
            fromSlotId={slot.id}
            label={slot.occupancy.driveLabel}
            serialNumber={slot.occupancy.serialNumber}
            driveModelName={slot.occupancy.driveModelName}
            disabled={busy}
          />
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              color: token.colorTextTertiary,
              fontSize: 12,
              padding: "14px 8px",
            }}
          >
            <InboxOutlined />
            Drop a free drive here
          </div>
        )}
      </div>

      {slot.occupancy && (
        <Tooltip title="Unseat this drive (recorded when you save)">
          <Button
            size="small"
            danger
            type="text"
            icon={<CloseCircleOutlined />}
            onClick={() => onRemove(slot.id)}
            disabled={busy}
            style={{ alignSelf: "flex-start" }}
          >
            Remove
          </Button>
        </Tooltip>
      )}
    </div>
  );
};
