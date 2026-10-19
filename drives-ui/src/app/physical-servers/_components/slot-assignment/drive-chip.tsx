"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Tag, Tooltip, Typography, theme } from "antd";
import { HolderOutlined } from "@ant-design/icons";
import type { CSSProperties } from "react";
import type { DragData } from "./types";

const { Text } = Typography;

interface DriveChipProps {
  driveId: string;
  fromSlotId?: string | null;
  label: string;
  serialNumber: string;
  driveModelName?: string | null;
  disabled?: boolean;
}

/**
 * A draggable representation of a physical drive. Used both for drives waiting
 * in the free pool and for the drive seated in an occupied slot, so the same
 * chip can be dragged into a slot or back onto the unassigned drop zone.
 */
export const DriveChip = ({
  driveId,
  fromSlotId = null,
  label,
  serialNumber,
  driveModelName,
  disabled = false,
}: DriveChipProps) => {
  const { token } = theme.useToken();
  const data: DragData = {
    driveId,
    fromSlotId,
    label,
    serialNumber,
    driveModelName: driveModelName ?? null,
  };

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `drive:${driveId}:${fromSlotId ?? "free"}`,
      data,
      disabled,
    });

  const style: CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
    cursor: disabled ? "default" : "grab",
    touchAction: "none",
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 10px",
          borderRadius: 8,
          border: `1px solid ${token.colorBorderSecondary}`,
          background: token.colorFillQuaternary,
          minWidth: 0,
        }}
      >
        {!disabled && (
          <HolderOutlined
            style={{ color: token.colorTextTertiary, flexShrink: 0 }}
          />
        )}
        <div style={{ minWidth: 0, flex: 1 }}>
          <Text
            strong
            style={{
              display: "block",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {label}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {serialNumber}
          </Text>
        </div>
        {driveModelName && (
          <Tooltip title={driveModelName}>
            <Tag color="blue" style={{ marginInlineEnd: 0, flexShrink: 0 }}>
              {driveModelName.length > 14
                ? `${driveModelName.slice(0, 14)}…`
                : driveModelName}
            </Tag>
          </Tooltip>
        )}
      </div>
    </div>
  );
};

/** Non-interactive preview used inside the <DragOverlay />. */
export const DriveChipPreview = ({
  label,
  serialNumber,
  driveModelName,
}: Pick<DragData, "label" | "serialNumber" | "driveModelName">) => {
  const { token } = theme.useToken();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 10px",
        borderRadius: 8,
        border: `1px solid ${token.colorPrimary}`,
        background: token.colorBgElevated,
        color: token.colorText,
        boxShadow: token.boxShadowSecondary,
        maxWidth: 280,
      }}
    >
      <HolderOutlined style={{ color: token.colorTextTertiary }} />
      <div style={{ minWidth: 0 }}>
        <Text strong style={{ display: "block" }}>
          {label}
        </Text>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {serialNumber}
        </Text>
        {driveModelName && (
          <Text type="secondary" style={{ fontSize: 12, display: "block" }}>
            {driveModelName}
          </Text>
        )}
      </div>
    </div>
  );
};
