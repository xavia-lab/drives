"use client";

import { useDroppable } from "@dnd-kit/core";
import { Button, Tag, Tooltip, Typography, theme } from "antd";
import {
  CloseCircleOutlined,
  DatabaseOutlined,
  InboxOutlined,
} from "@ant-design/icons";
import { DriveChip } from "@app/physical-servers/_components/slot-assignment/drive-chip";
import type {
  BoardDrive,
  BoardSlot,
} from "@app/physical-servers/_components/slot-assignment/types";

const { Text } = Typography;

interface AllocationSlotCardProps {
  slot: BoardSlot;
  interfaceLabel: string;
  draftDrive?: BoardDrive;
  busy?: boolean;
  onRemoveDraft: (slotId: string) => void;
}

/**
 * Target-server slot used by the Drive Allocation workflow. Existing occupants
 * are read-only (this workflow only adds mounts); empty slots can receive a
 * staged drive via drag-and-drop.
 */
export const AllocationSlotCard = ({
  slot,
  interfaceLabel,
  draftDrive,
  busy = false,
  onRemoveDraft,
}: AllocationSlotCardProps) => {
  const { token } = theme.useToken();
  const occupied = Boolean(slot.occupancy);
  const hasDraft = Boolean(draftDrive);
  const { setNodeRef, isOver } = useDroppable({
    id: slot.id,
    data: { type: "slot" },
    disabled: occupied || busy,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        borderRadius: 12,
        border: occupied
          ? `1px solid ${token.colorPrimaryBorder}`
          : hasDraft
            ? `1px solid ${token.colorPrimary}`
            : isOver
              ? `2px dashed ${token.colorPrimary}`
              : `1px dashed ${token.colorBorder}`,
        background: occupied
          ? token.colorPrimaryBg
          : hasDraft
            ? token.colorPrimaryBgHover
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
          <>
            <DriveChip
              driveId={slot.occupancy.physicalDriveId}
              fromSlotId={slot.id}
              label={slot.occupancy.driveLabel}
              serialNumber={slot.occupancy.serialNumber}
              driveModelName={slot.occupancy.driveModelName}
              disabled
            />
            <Tag color="default" style={{ alignSelf: "flex-start" }}>
              Currently seated
            </Tag>
          </>
        ) : draftDrive ? (
          <>
            <DriveChip
              driveId={draftDrive.id}
              fromSlotId={slot.id}
              label={draftDrive.label}
              serialNumber={draftDrive.serialNumber}
              driveModelName={draftDrive.driveModelName}
              disabled={busy}
            />
            <Button
              size="small"
              type="text"
              danger
              icon={<CloseCircleOutlined />}
              onClick={() => onRemoveDraft(slot.id)}
              disabled={busy}
              style={{ alignSelf: "flex-start" }}
            >
              Remove
            </Button>
          </>
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
            Drop a drive here
          </div>
        )}
      </div>
    </div>
  );
};
