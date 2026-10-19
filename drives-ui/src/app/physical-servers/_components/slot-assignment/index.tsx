"use client";

import { useEffect, useMemo, useState } from "react";
import { useApiUrl, useCustom, useCustomMutation } from "@refinedev/core";
import { useLookupOptions } from "@hooks/use-lookup-options";
import { LinkedLabel } from "@components/linked-label";
import {
  App,
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Input,
  Progress,
  Row,
  Space,
  Spin,
  Statistic,
  Tag,
  Typography,
  theme,
} from "antd";
import {
  ArrowLeftOutlined,
  HddOutlined,
  InboxOutlined,
  ReloadOutlined,
  SaveOutlined,
  UndoOutlined,
} from "@ant-design/icons";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import Link from "next/link";
import { SlotCard } from "./slot-card";
import { DriveChip, DriveChipPreview } from "./drive-chip";
import {
  UNASSIGNED_DROPZONE_ID,
  type BoardDrive,
  type BoardOccupant,
  type BoardSlot,
  type DragData,
  type SlotAssignmentBoard,
} from "./types";

const { Text, Title } = Typography;

interface SlotAssignmentBoardViewProps {
  serverId: string;
}

// The persisted seating as a simple slot -> drive map (the draft state shape).
const draftFromBoard = (board: SlotAssignmentBoard): Record<string, string> => {
  const draft: Record<string, string> = {};
  for (const slot of board.slots) {
    if (slot.occupancy) {
      draft[slot.id] = slot.occupancy.physicalDriveId;
    }
  }
  return draft;
};

const occupantToDrive = (occupant: BoardOccupant): BoardDrive => ({
  id: occupant.physicalDriveId,
  label: occupant.driveLabel,
  serialNumber: occupant.serialNumber,
  driveModelId: occupant.driveModelId,
  driveModelName: occupant.driveModelName,
});

/** The pool of unassigned drives; also the drop target that unseats a drive. */
const FreeDrivesPanel = ({
  drives,
  busy,
}: {
  drives: BoardDrive[];
  busy: boolean;
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: UNASSIGNED_DROPZONE_ID });
  const { token } = theme.useToken();

  return (
    <div ref={setNodeRef} style={{ height: "100%" }}>
      <Card
        title={
          <Space>
            <InboxOutlined />
            <span>Unassigned Drives</span>
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
          Drag a drive onto a slot to seat it. Drag a seated drive here to
          unseat it.
        </Text>
        {drives.length > 0 ? (
          <Space direction="vertical" size={8} style={{ display: "flex" }}>
            {drives.map((drive) => (
              <DriveChip
                key={drive.id}
                driveId={drive.id}
                fromSlotId={null}
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
            description="No free drives in this datacenter"
            style={{ margin: "24px 0" }}
          />
        )}
      </Card>
    </div>
  );
};

export const SlotAssignmentBoardView = ({
  serverId,
}: SlotAssignmentBoardViewProps) => {
  const apiUrl = useApiUrl();
  const { message } = App.useApp();
  const { mutateAsync } = useCustomMutation();
  const [board, setBoard] = useState<SlotAssignmentBoard | null>(null);
  const [draft, setDraft] = useState<Record<string, string> | null>(null);
  const [activeDrag, setActiveDrag] = useState<DragData | null>(null);
  const [saving, setSaving] = useState(false);
  const [slotQuery, setSlotQuery] = useState("");
  const [driveQuery, setDriveQuery] = useState("");

  const { query } = useCustom({
    url: `${apiUrl}/physical-servers/${serverId}/slot-assignment-board`,
    method: "get",
    queryOptions: { enabled: Boolean(serverId) },
  });

  const { options: interfaceOptions } = useLookupOptions({
    resource: "interfaces",
  });

  // Seed the draft only once; later revalidations must not clobber unsaved
  // edits. Explicit refresh/save update both board and draft together.
  useEffect(() => {
    const payload = query.data?.data as SlotAssignmentBoard | undefined;
    if (!payload || !Array.isArray(payload.slots) || !payload.summary) {
      return;
    }
    if (board === null) {
      setBoard(payload);
      setDraft(draftFromBoard(payload));
    }
  }, [query.data, board]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const interfaceLabel = (id: string) =>
    interfaceOptions.find((option) => option.value === id)?.label ?? id;

  const driveById = useMemo(() => {
    const map = new Map<string, BoardDrive>();
    if (!board) return map;
    for (const drive of board.freeDrives) {
      map.set(drive.id, drive);
    }
    for (const slot of board.slots) {
      if (slot.occupancy) {
        map.set(
          slot.occupancy.physicalDriveId,
          occupantToDrive(slot.occupancy),
        );
      }
    }
    return map;
  }, [board]);

  const draftSeatedIds = useMemo(
    () => new Set(Object.values(draft ?? {})),
    [draft],
  );

  const draftFreeDrives = useMemo(() => {
    const candidates = new Map<string, BoardDrive>();
    for (const drive of board?.freeDrives ?? []) {
      candidates.set(drive.id, drive);
    }
    for (const slot of board?.slots ?? []) {
      if (slot.occupancy) {
        const drive = occupantToDrive(slot.occupancy);
        candidates.set(drive.id, drive);
      }
    }
    return Array.from(candidates.values())
      .filter((drive) => !draftSeatedIds.has(drive.id))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [board, draftSeatedIds]);

  const draftSlots = useMemo<BoardSlot[]>(() => {
    return (board?.slots ?? []).map((slot) => {
      const driveId = draft?.[slot.id];
      const drive = driveId ? driveById.get(driveId) : undefined;
      const occupancy: BoardOccupant | null = drive
        ? {
            allocationId: `draft-${drive.id}`,
            physicalDriveId: drive.id,
            driveLabel: drive.label,
            serialNumber: drive.serialNumber,
            driveModelId: drive.driveModelId,
            driveModelName: drive.driveModelName,
            assignedAt: "",
          }
        : null;
      return { ...slot, occupancy };
    });
  }, [board, draft, driveById]);

  const draftStats = useMemo(() => {
    const totalSlots = board?.slots.length ?? 0;
    const occupiedSlots = draftSlots.filter((slot) => slot.occupancy).length;
    return {
      totalSlots,
      occupiedSlots,
      emptySlots: totalSlots - occupiedSlots,
      freeDrives: draftFreeDrives.length,
    };
  }, [board, draftSlots, draftFreeDrives]);

  const baseline = useMemo(() => (board ? draftFromBoard(board) : {}), [board]);

  const dirty = useMemo(() => {
    if (!draft) return false;
    const keys = Array.from(
      new Set([...Object.keys(baseline), ...Object.keys(draft)]),
    );
    for (const key of keys) {
      if ((baseline[key] ?? null) !== (draft[key] ?? null)) {
        return true;
      }
    }
    return false;
  }, [baseline, draft]);

  const filteredSlots = useMemo(() => {
    const needle = slotQuery.trim().toLowerCase();
    if (!needle) return draftSlots;
    return draftSlots.filter((slot) =>
      slot.slotLabel.toLowerCase().includes(needle),
    );
  }, [draftSlots, slotQuery]);

  // Slots are grouped by their supported interface (e.g. "SATA", "NVMe
  // Backplane") so large backplanes stay readable.
  const slotGroups = useMemo(() => {
    const groups = new Map<string, BoardSlot[]>();
    for (const slot of filteredSlots) {
      const group = groups.get(slot.supportedInterfaceId) ?? [];
      group.push(slot);
      groups.set(slot.supportedInterfaceId, group);
    }
    return Array.from(groups.entries()).sort(([a], [b]) =>
      interfaceLabel(a).localeCompare(interfaceLabel(b)),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredSlots, interfaceOptions]);

  const filteredFreeDrives = useMemo(() => {
    const needle = driveQuery.trim().toLowerCase();
    if (!needle) return draftFreeDrives;
    return draftFreeDrives.filter(
      (drive) =>
        drive.label.toLowerCase().includes(needle) ||
        drive.serialNumber.toLowerCase().includes(needle),
    );
  }, [draftFreeDrives, driveQuery]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDrag((event.active.data.current as DragData) ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const data = event.active.data.current as DragData | undefined;
    const overId = event.over?.id ? String(event.over.id) : null;
    setActiveDrag(null);
    if (!data || !overId) return;

    setDraft((prev) => {
      if (!prev) return prev;
      const next = { ...prev };
      for (const slotId of Object.keys(next)) {
        if (next[slotId] === data.driveId) {
          delete next[slotId];
        }
      }
      if (overId !== UNASSIGNED_DROPZONE_ID) {
        next[overId] = data.driveId;
      }
      return next;
    });
  };

  const unseatDrive = (slotId: string) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const next = { ...prev };
      delete next[slotId];
      return next;
    });
  };

  const resetDraft = () => {
    if (board) {
      setDraft(draftFromBoard(board));
    }
  };

  const saveAssignments = async () => {
    if (!draft) return;
    const assignments = Object.entries(draft)
      .filter(([, physicalDriveId]) => Boolean(physicalDriveId))
      .map(([slotId, physicalDriveId]) => ({ slotId, physicalDriveId }));

    try {
      setSaving(true);
      const response = await mutateAsync({
        url: `${apiUrl}/physical-servers/${serverId}/slot-assignments`,
        method: "put",
        values: { assignments },
      });
      const next = (response as { data?: SlotAssignmentBoard }).data;
      if (next) {
        setBoard(next);
        setDraft(draftFromBoard(next));
      }
      message.success("Slot assignments saved");
    } catch (error) {
      const err = error as { message?: string | string[] };
      const detail = Array.isArray(err?.message)
        ? err.message.join("; ")
        : err?.message;
      message.error(detail ?? "The assignments could not be saved");
    } finally {
      setSaving(false);
    }
  };

  const refresh = async () => {
    const result = await query.refetch();
    const next = result.data?.data as SlotAssignmentBoard | undefined;
    if (next) {
      setBoard(next);
      setDraft(draftFromBoard(next));
    }
  };

  if (query.isLoading && !board) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 64 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!board || !draft) {
    return (
      <Alert
        type="error"
        showIcon
        message="Unable to load the slot assignment board"
        description="The physical server could not be found or the request failed."
      />
    );
  }

  const occupancyPercent = draftStats.totalSlots
    ? Math.round((draftStats.occupiedSlots / draftStats.totalSlots) * 100)
    : 0;

  return (
    <Space direction="vertical" size="large" style={{ display: "flex" }}>
      <Card>
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col>
            <Space direction="vertical" size={2}>
              <Space align="center">
                <Link href={`/physical-servers/show/${board.server.id}`}>
                  <Button
                    type="text"
                    size="small"
                    icon={<ArrowLeftOutlined />}
                  />
                </Link>
                <Title level={4} style={{ margin: 0 }}>
                  Slot Assignment
                </Title>
                {dirty && <Tag color="warning">Unsaved changes</Tag>}
              </Space>
              <Text type="secondary">
                Configure the seating below, then save to record the changes.
              </Text>
            </Space>
          </Col>
          <Col>
            <Space size="middle" wrap>
              <Statistic
                title="Server"
                value={board.server.hostname}
                valueStyle={{ fontSize: 16 }}
              />
              <Statistic
                title="Rack"
                value={board.server.rackName ?? "—"}
                valueStyle={{ fontSize: 16 }}
              />
              <Button
                icon={<ReloadOutlined />}
                onClick={refresh}
                loading={query.isFetching}
              >
                Refresh
              </Button>
            </Space>
          </Col>
        </Row>
        <Row gutter={[24, 16]} align="middle" style={{ marginTop: 20 }}>
          <Col xs={24} md={10}>
            <Space direction="vertical" style={{ width: "100%" }} size={4}>
              <Text type="secondary">
                Slots occupied — {draftStats.occupiedSlots} of{" "}
                {draftStats.totalSlots}
              </Text>
              <Progress percent={occupancyPercent} status="active" />
            </Space>
          </Col>
          <Col xs={12} md={5}>
            <Statistic
              title="Empty Slots"
              value={draftStats.emptySlots}
              prefix={<HddOutlined />}
            />
          </Col>
          <Col xs={12} md={5}>
            <Statistic
              title="Free Drives (same DC)"
              value={draftStats.freeDrives}
              prefix={<InboxOutlined />}
            />
          </Col>
          <Col xs={24} md={4}>
            <Statistic
              title="Datacenter"
              value={board.server.datacenterCode}
              valueStyle={{ fontSize: 16 }}
            />
          </Col>
        </Row>
      </Card>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveDrag(null)}
      >
        <Row gutter={[16, 16]} align="stretch">
          <Col xs={24} lg={17}>
            <Card
              title={`Slots (${draftSlots.length})`}
              extra={
                <Input.Search
                  allowClear
                  placeholder="Filter slots"
                  style={{ width: 200 }}
                  value={slotQuery}
                  onChange={(event) => setSlotQuery(event.target.value)}
                />
              }
            >
              {slotGroups.length > 0 ? (
                <Space
                  direction="vertical"
                  size={24}
                  style={{ display: "flex" }}
                >
                  {slotGroups.map(([interfaceId, groupSlots]) => {
                    const occupied = groupSlots.filter(
                      (slot) => slot.occupancy,
                    ).length;
                    return (
                      <div key={interfaceId}>
                        <Space align="center" style={{ marginBottom: 12 }} wrap>
                          <Text strong>{interfaceLabel(interfaceId)}</Text>
                          <Tag>
                            {occupied}/{groupSlots.length} occupied
                          </Tag>
                        </Space>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(auto-fill, minmax(210px, 1fr))",
                            gap: 12,
                          }}
                        >
                          {groupSlots.map((slot) => (
                            <SlotCard
                              key={slot.id}
                              slot={slot}
                              interfaceLabel={interfaceLabel(
                                slot.supportedInterfaceId,
                              )}
                              busy={saving}
                              onRemove={unseatDrive}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </Space>
              ) : (
                <Empty description="No slots match the filter" />
              )}
            </Card>
          </Col>
          <Col xs={24} lg={7}>
            <Space direction="vertical" style={{ width: "100%" }}>
              <Input.Search
                allowClear
                placeholder="Filter free drives"
                value={driveQuery}
                onChange={(event) => setDriveQuery(event.target.value)}
              />
              <FreeDrivesPanel drives={filteredFreeDrives} busy={saving} />
            </Space>
          </Col>
        </Row>

        <DragOverlay>
          {activeDrag ? (
            <DriveChipPreview
              label={activeDrag.label}
              serialNumber={activeDrag.serialNumber}
              driveModelName={activeDrag.driveModelName}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      <Text type="secondary" style={{ fontSize: 12 }}>
        Datacenter scope: only drives currently located in{" "}
        <LinkedLabel
          resource="datacenters"
          value={board.server.datacenterId}
          label={`${board.server.datacenterCode} — ${board.server.datacenterName}`}
        />{" "}
        can be seated here.
      </Text>

      <Card styles={{ body: { padding: 16 } }}>
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col>
            <Text type={dirty ? "warning" : "secondary"}>
              {dirty
                ? "You have unsaved changes. Save to record them in the assignment history."
                : "All slot assignments are saved."}
            </Text>
          </Col>
          <Col>
            <Space>
              <Button
                icon={<UndoOutlined />}
                onClick={resetDraft}
                disabled={!dirty || saving}
              >
                Discard
              </Button>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={saveAssignments}
                disabled={!dirty}
                loading={saving}
              >
                Save changes
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>
    </Space>
  );
};
