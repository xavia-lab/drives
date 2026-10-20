"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useApiUrl,
  useCustom,
  useCustomMutation,
  useList,
  useNotification,
} from "@refinedev/core";
import {
  Alert,
  App,
  Card,
  Checkbox,
  Col,
  Divider,
  Empty,
  Form,
  Input,
  Row,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
  theme,
} from "antd";
import {
  ApartmentOutlined,
  CompassOutlined,
  DisconnectOutlined,
  InfoCircleOutlined,
  LinkOutlined,
  SwapOutlined,
} from "@ant-design/icons";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  WorkflowWizard,
  type WorkflowStep,
  type WorkflowValues,
} from "@components/workflow";
import { useLookupOptions } from "@hooks/use-lookup-options";
import { DriveChipPreview } from "@app/physical-servers/_components/slot-assignment/drive-chip";
import type {
  BoardDrive,
  BoardOccupant,
  BoardSlot,
  DragData,
  SlotAssignmentBoard,
} from "@app/physical-servers/_components/slot-assignment/types";
import {
  ALLOCATION_POOL_ID,
  AllocationDrivePool,
} from "./allocation-drive-pool";
import { AllocationSlotCard } from "./allocation-slot-card";

const { Text } = Typography;

// Reasons a detached-unseated drive can carry. Mirrors the backend curated
// set; RMA/informational events belong to other workflows.
const UNSEATED_REASONS = [
  "DEPROVISION",
  "DEGRADE",
  "FAIL",
  "RETIRE",
  "SCRAP_SHRED",
  "LOST",
] as const;
type UnseatedReason = (typeof UNSEATED_REASONS)[number];

const REASON_LABELS: Record<UnseatedReason, string> = {
  DEPROVISION: "Return to inventory",
  DEGRADE: "Degraded",
  FAIL: "Failed",
  RETIRE: "Retire",
  SCRAP_SHRED: "Scrap / shred",
  LOST: "Lost",
};

type LifecycleSnapshot = {
  state?: string;
  allowedEvents?: string[];
};

type DriveWithLifecycleRecord = {
  id: string;
  currentLifecycle?: LifecycleSnapshot | null;
};

type AllocationFormValues = {
  datacenterId?: string;
  sourceServerId?: string;
  targetServerId?: string;
};

interface DatacenterRecord {
  id: string;
  code: string;
  name: string;
}

interface RackRecord {
  id: string;
  name: string;
  datacenterId: string;
}

interface ServerRecord {
  id: string;
  hostname: string;
  rackId: string;
}

const occupantToDrive = (occupant: BoardOccupant): BoardDrive => ({
  id: occupant.physicalDriveId,
  label: occupant.driveLabel,
  serialNumber: occupant.serialNumber,
  driveModelId: occupant.driveModelId,
  driveModelName: occupant.driveModelName,
});

const removeDriveFromDraft = (
  draft: Record<string, string>,
  driveId: string,
): Record<string, string> => {
  const next = { ...draft };
  for (const [slotId, stagedDriveId] of Object.entries(next)) {
    if (stagedDriveId === driveId) {
      delete next[slotId];
    }
  }
  return next;
};

export const DriveAllocationWorkflow = () => {
  const [form] = Form.useForm<AllocationFormValues>();
  const apiUrl = useApiUrl();
  const router = useRouter();
  const { token } = theme.useToken();
  const { message } = App.useApp();
  const { open } = useNotification();
  const { mutateAsync: allocateDrives } = useCustomMutation();

  const [detachedDriveIds, setDetachedDriveIds] = useState<Set<string>>(
    new Set(),
  );
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [activeDrag, setActiveDrag] = useState<DragData | null>(null);
  const [lifecycleByDrive, setLifecycleByDrive] = useState<
    Record<string, { eventType?: UnseatedReason; explanation: string }>
  >({});

  const datacenterId = Form.useWatch("datacenterId", form);
  const sourceServerId = Form.useWatch("sourceServerId", form);
  const targetServerId = Form.useWatch("targetServerId", form);

  const { query: datacentersQuery } = useList<DatacenterRecord>({
    resource: "datacenters",
    pagination: { mode: "server", currentPage: 1, pageSize: 100 },
  });
  const datacenters = useMemo(
    () => datacentersQuery.data?.data ?? [],
    [datacentersQuery.data?.data],
  );

  const { query: racksQuery } = useList<RackRecord>({
    resource: "racks",
    filters: datacenterId
      ? [
          {
            field: "datacenterId",
            operator: "eq" as const,
            value: datacenterId,
          },
        ]
      : [],
    pagination: { mode: "server", currentPage: 1, pageSize: 200 },
    queryOptions: { enabled: Boolean(datacenterId) },
  });
  const rackIds = useMemo(
    () => (racksQuery.data?.data ?? []).map((rack) => rack.id),
    [racksQuery.data?.data],
  );

  const { query: serversQuery } = useList<ServerRecord>({
    resource: "physical-servers",
    filters:
      rackIds.length > 0
        ? [
            {
              field: "rackId",
              operator: "in" as const,
              value: rackIds,
            },
          ]
        : [],
    pagination: { mode: "server", currentPage: 1, pageSize: 250 },
    queryOptions: { enabled: rackIds.length > 0 },
  });
  const servers = useMemo(
    () => serversQuery.data?.data ?? [],
    [serversQuery.data?.data],
  );

  const sourceQuery = useCustom({
    url: `${apiUrl}/physical-servers/${sourceServerId}/slot-assignment-board`,
    method: "get",
    queryOptions: { enabled: Boolean(sourceServerId) },
  });
  const targetQuery = useCustom({
    url: `${apiUrl}/physical-servers/${targetServerId}/slot-assignment-board`,
    method: "get",
    queryOptions: { enabled: Boolean(targetServerId) },
  });

  const sourceBoard = sourceQuery.result?.data as
    SlotAssignmentBoard | undefined;
  const targetBoard = targetQuery.result?.data as
    SlotAssignmentBoard | undefined;

  const { options: interfaceOptions } = useLookupOptions({
    resource: "interfaces",
    optionLabel: "name",
  });
  const interfaceLabel = (id: string) =>
    (interfaceOptions.find((option) => option.value === id)?.label as
      string | undefined) ?? id;

  const datacenterOptions = useMemo(
    () =>
      datacenters.map((datacenter) => ({
        label: `${datacenter.code} — ${datacenter.name}`,
        value: datacenter.id,
      })),
    [datacenters],
  );
  const serverOptions = useMemo(
    () =>
      servers.map((server) => ({ label: server.hostname, value: server.id })),
    [servers],
  );
  const targetServerOptions = useMemo(
    () =>
      servers
        .filter((server) => server.id !== sourceServerId)
        .map((server) => ({ label: server.hostname, value: server.id })),
    [servers, sourceServerId],
  );

  const mountedSourceDrives = useMemo(() => {
    const slots = sourceBoard?.slots ?? [];
    return slots
      .filter((slot) => Boolean(slot.occupancy))
      .map((slot) => ({
        slot,
        drive: occupantToDrive(slot.occupancy as BoardOccupant),
      }));
  }, [sourceBoard]);

  const detachedDrives = useMemo(
    () =>
      mountedSourceDrives.filter(({ drive }) => detachedDriveIds.has(drive.id)),
    [mountedSourceDrives, detachedDriveIds],
  );

  const targetFreeDrives = targetBoard?.freeDrives ?? [];
  const targetSlots = targetBoard?.slots ?? [];

  const slotById = useMemo(
    () => new Map(targetSlots.map((slot) => [slot.id, slot])),
    [targetSlots],
  );
  const driveById = useMemo(() => {
    const map = new Map<string, BoardDrive>();
    for (const drive of targetFreeDrives) map.set(drive.id, drive);
    for (const { drive } of mountedSourceDrives) map.set(drive.id, drive);
    return map;
  }, [targetFreeDrives, mountedSourceDrives]);

  const availableDrives = useMemo(() => {
    const map = new Map<string, BoardDrive>();
    for (const drive of targetFreeDrives) map.set(drive.id, drive);
    for (const { drive } of detachedDrives) map.set(drive.id, drive);
    for (const driveId of Object.values(draft)) map.delete(driveId);
    return Array.from(map.values());
  }, [targetFreeDrives, detachedDrives, draft]);

  const slotsByInterface = useMemo(() => {
    const groups = new Map<string, BoardSlot[]>();
    for (const slot of targetSlots) {
      const list = groups.get(slot.supportedInterfaceId) ?? [];
      list.push(slot);
      groups.set(slot.supportedInterfaceId, list);
    }
    return Array.from(groups.entries());
  }, [targetSlots]);

  const draftRows = useMemo(
    () =>
      Object.entries(draft)
        .map(([slotId, driveId]) => ({
          slot: slotById.get(slotId),
          drive: driveById.get(driveId),
        }))
        .filter((row): row is { slot: BoardSlot; drive: BoardDrive } =>
          Boolean(row.slot && row.drive),
        ),
    [draft, slotById, driveById],
  );
  const unseatedDetached = useMemo(() => {
    const staged = new Set(Object.values(draft));
    return detachedDrives.filter(({ drive }) => !staged.has(drive.id));
  }, [detachedDrives, draft]);

  const unseatedDetachedIds = useMemo(
    () => unseatedDetached.map(({ drive }) => drive.id),
    [unseatedDetached],
  );

  // Derived lifecycle state/allowed transitions for the drives that will be
  // left unseated. The list projection already stamps `currentLifecycle`.
  const { query: lifecycleQuery } = useList<DriveWithLifecycleRecord>({
    resource: "physical-drives",
    filters:
      unseatedDetachedIds.length > 0
        ? [
            {
              field: "id",
              operator: "in" as const,
              value: unseatedDetachedIds,
            },
          ]
        : [],
    pagination: { mode: "server", currentPage: 1, pageSize: 100 },
    queryOptions: { enabled: unseatedDetachedIds.length > 0 },
  });

  const lifecycleById = useMemo(() => {
    const map = new Map<string, LifecycleSnapshot>();
    for (const record of lifecycleQuery.data?.data ?? []) {
      if (record.currentLifecycle) {
        map.set(record.id, record.currentLifecycle);
      }
    }
    return map;
  }, [lifecycleQuery.data?.data]);

  const allowedReasonsFor = (driveId: string): UnseatedReason[] => {
    const allowed = lifecycleById.get(driveId)?.allowedEvents ?? [];
    return UNSEATED_REASONS.filter((reason) => allowed.includes(reason));
  };

  // Keep the per-drive reason map in sync with the current unseated set: prune
  // staged/removed drives and pick a sensible default when one becomes legal.
  useEffect(() => {
    setLifecycleByDrive((previous) => {
      const next: Record<
        string,
        { eventType?: UnseatedReason; explanation: string }
      > = {};
      for (const { drive } of unseatedDetached) {
        const allowed = UNSEATED_REASONS.filter((reason) =>
          (lifecycleById.get(drive.id)?.allowedEvents ?? []).includes(reason),
        );
        const current = previous[drive.id];
        const eventType =
          current?.eventType && allowed.includes(current.eventType)
            ? current.eventType
            : allowed.includes("DEPROVISION")
              ? "DEPROVISION"
              : allowed[0];
        next[drive.id] = {
          eventType,
          explanation: current?.explanation ?? "",
        };
      }
      return next;
    });
  }, [unseatedDetached, lifecycleById]);

  const hasActions = detachedDriveIds.size > 0 || Object.keys(draft).length > 0;

  // `useCustom` returns a truthy empty object while loading, so guard the
  // nested board fields as well as the board itself.
  const sourceName =
    sourceBoard?.server?.hostname ??
    servers.find((server) => server.id === sourceServerId)?.hostname ??
    "Source server";
  const targetName =
    targetBoard?.server?.hostname ??
    servers.find((server) => server.id === targetServerId)?.hostname ??
    "Target server";

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDrag((event.active.data.current as DragData) ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDrag(null);
    const { active, over } = event;
    if (!over) return;

    const data = active.data.current as DragData | undefined;
    if (!data) return;

    const overId = String(over.id);
    if (overId === ALLOCATION_POOL_ID) {
      setDraft((previous) => removeDriveFromDraft(previous, data.driveId));
      return;
    }

    const slot = slotById.get(overId);
    if (!slot || slot.occupancy) return;

    setDraft((previous) => {
      const next = removeDriveFromDraft(previous, data.driveId);
      next[overId] = data.driveId;
      return next;
    });
  };

  const resetAllocation = () => {
    setDetachedDriveIds(new Set());
    setDraft({});
  };

  const handleDatacenterChange = () => {
    form.resetFields(["sourceServerId", "targetServerId"]);
    resetAllocation();
  };

  const handleSourceChange = (value?: string) => {
    resetAllocation();
    if (form.getFieldValue("targetServerId") === value) {
      form.resetFields(["targetServerId"]);
    }
  };

  const toggleDetach = (driveId: string) => {
    const wasDetached = detachedDriveIds.has(driveId);
    setDetachedDriveIds((previous) => {
      const next = new Set(previous);
      if (next.has(driveId)) {
        next.delete(driveId);
      } else {
        next.add(driveId);
      }
      return next;
    });
    if (wasDetached) {
      setDraft((previous) => removeDriveFromDraft(previous, driveId));
    }
  };

  const removeDraft = (slotId: string) => {
    setDraft((previous) => {
      const next = { ...previous };
      delete next[slotId];
      return next;
    });
  };

  const steps: WorkflowStep[] = [
    {
      key: "source",
      title: "Datacenter & source",
      description: "Pick the site and optionally detach drives",
      icon: <ApartmentOutlined />,
      fields: [["datacenterId"], ["sourceServerId"]],
      validate: () => {
        if (sourceServerId && sourceQuery.query.isLoading) {
          message.warning("Loading the source server board...");
          return false;
        }
        return true;
      },
      content: () => (
        <Space direction="vertical" size="middle" style={{ display: "flex" }}>
          <Alert
            type="info"
            showIcon
            message="Datacenter & source"
            description="Choose the datacenter. Optionally select a source server and check the drives you want to detach from it."
          />
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Datacenter"
                name="datacenterId"
                rules={[{ required: true, message: "Select a datacenter" }]}
              >
                <Select
                  showSearch
                  optionFilterProp="label"
                  placeholder="Select datacenter"
                  loading={datacentersQuery.isLoading}
                  options={datacenterOptions}
                  onChange={handleDatacenterChange}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Source server (optional)" name="sourceServerId">
                <Select
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  placeholder="No source server"
                  loading={serversQuery.isLoading}
                  options={serverOptions}
                  disabled={!datacenterId}
                  onChange={handleSourceChange}
                />
              </Form.Item>
            </Col>
          </Row>

          {sourceServerId ? (
            <Card
              size="small"
              title={
                <Space>
                  <DisconnectOutlined />
                  <span>Mounted drives on {sourceName}</span>
                </Space>
              }
            >
              {sourceQuery.query.isLoading ? (
                <Spin />
              ) : mountedSourceDrives.length === 0 ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No mounted drives on this server"
                />
              ) : (
                <Space
                  direction="vertical"
                  size={8}
                  style={{ display: "flex" }}
                >
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Checked drives are detached when you accept. Unchecked
                    drives stay seated.
                  </Text>
                  {mountedSourceDrives.map(({ slot, drive }) => (
                    <div
                      key={drive.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: 8,
                        borderRadius: token.borderRadiusLG,
                        border: `1px solid ${token.colorBorderSecondary}`,
                        background: token.colorFillQuaternary,
                      }}
                    >
                      <Checkbox
                        checked={detachedDriveIds.has(drive.id)}
                        onChange={() => toggleDetach(drive.id)}
                      >
                        Detach
                      </Checkbox>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Text strong ellipsis style={{ display: "block" }}>
                          {drive.label}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {drive.serialNumber}
                          {drive.driveModelName
                            ? ` · ${drive.driveModelName}`
                            : ""}
                        </Text>
                      </div>
                      <Tag color="geekblue" style={{ marginInlineEnd: 0 }}>
                        Slot {slot.slotLabel}
                      </Tag>
                    </div>
                  ))}
                </Space>
              )}
            </Card>
          ) : (
            <Alert
              type="info"
              showIcon
              message="No source server selected"
              description="You can skip detaching and allocate unseated drives only."
            />
          )}
        </Space>
      ),
    },
    {
      key: "target",
      title: "Target server",
      description: "Optionally seat drives into slots",
      icon: <SwapOutlined />,
      fields: [["targetServerId"]],
      validate: () => {
        if (targetServerId && targetQuery.query.isLoading) {
          message.warning("Loading the target server board...");
          return false;
        }
        if (!hasActions) {
          message.warning(
            "Detach at least one drive or seat at least one drive before continuing.",
          );
          return false;
        }
        return true;
      },
      content: () => (
        <Space direction="vertical" size="middle" style={{ display: "flex" }}>
          <Alert
            type="info"
            showIcon
            message="Target server (optional)"
            description="Pick a target server in the same datacenter and drag the available drives into its empty slots. Leave it empty to only detach drives."
          />
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Target server (optional)" name="targetServerId">
                <Select
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  placeholder="No target server"
                  loading={serversQuery.isLoading}
                  options={targetServerOptions}
                  disabled={!datacenterId}
                  onChange={() => setDraft({})}
                />
              </Form.Item>
            </Col>
          </Row>

          {!targetServerId ? (
            <Alert
              type="info"
              showIcon
              message="No target server selected"
              description="Detached drives will be recorded as UNMOUNTED and left unseated."
            />
          ) : targetQuery.query.isLoading ? (
            <Spin />
          ) : targetBoard ? (
            <>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <Row gutter={[16, 16]}>
                  <Col xs={24} lg={8}>
                    <AllocationDrivePool drives={availableDrives} />
                  </Col>
                  <Col xs={24} lg={16}>
                    <Space
                      direction="vertical"
                      size="middle"
                      style={{ display: "flex" }}
                    >
                      {slotsByInterface.map(([interfaceId, slots]) => (
                        <div key={interfaceId}>
                          <Divider
                            orientation="left"
                            style={{ margin: "0 0 8px" }}
                          >
                            {interfaceLabel(interfaceId)}
                          </Divider>
                          <Row gutter={[12, 12]}>
                            {slots.map((slot) => (
                              <Col xs={24} sm={12} xl={8} key={slot.id}>
                                <AllocationSlotCard
                                  slot={slot}
                                  interfaceLabel={interfaceLabel(
                                    slot.supportedInterfaceId,
                                  )}
                                  draftDrive={
                                    draft[slot.id]
                                      ? driveById.get(draft[slot.id])
                                      : undefined
                                  }
                                  onRemoveDraft={removeDraft}
                                />
                              </Col>
                            ))}
                          </Row>
                        </div>
                      ))}
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
            </>
          ) : null}
        </Space>
      ),
    },
    {
      key: "detached-states",
      title: "Detached states",
      description: "Record why drives stay unseated",
      icon: <InfoCircleOutlined />,
      fields: [],
      validate: () => {
        if (unseatedDetached.length === 0) {
          return true;
        }
        if (lifecycleQuery.isLoading) {
          message.warning("Loading drive lifecycle states...");
          return false;
        }
        for (const { drive } of unseatedDetached) {
          const allowed = allowedReasonsFor(drive.id);
          const state = lifecycleById.get(drive.id)?.state;
          const selected = lifecycleByDrive[drive.id]?.eventType;
          if (allowed.length === 0) {
            message.warning(
              `Drive ${drive.serialNumber} is in state ${state ?? "unknown"} and has no legal detach reason. Resolve it from the drive's lifecycle page.`,
            );
            return false;
          }
          if (!selected) {
            message.warning(
              `Select a lifecycle reason for drive ${drive.serialNumber}.`,
            );
            return false;
          }
        }
        return true;
      },
      content: () =>
        unseatedDetached.length === 0 ? (
          <Alert
            type="info"
            showIcon
            message="No detached drives left unseated"
            description="Every detached drive is seated on the target, so no lifecycle state is required."
          />
        ) : (
          <Space direction="vertical" size="middle" style={{ display: "flex" }}>
            <Alert
              type="info"
              showIcon
              message="Why are these drives left unseated?"
              description="Each detached drive that is not seated on the target must record a lifecycle state. The optional explanation is stored in the event context."
            />
            {lifecycleQuery.isLoading ? (
              <Spin />
            ) : (
              <Space direction="vertical" size={12} style={{ display: "flex" }}>
                {unseatedDetached.map(({ slot, drive }) => {
                  const allowed = allowedReasonsFor(drive.id);
                  const lifecycle = lifecycleByDrive[drive.id];
                  const currentState = lifecycleById.get(drive.id)?.state;
                  const options = allowed.map((reason) => ({
                    label: REASON_LABELS[reason],
                    value: reason,
                  }));

                  return (
                    <Card key={drive.id} size="small">
                      <Row gutter={12} align="top">
                        <Col xs={24} md={8}>
                          <Text strong ellipsis style={{ display: "block" }}>
                            {drive.label}
                          </Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {drive.serialNumber}
                          </Text>
                          <div style={{ marginTop: 6 }}>
                            <Tag color="geekblue">
                              Source slot {slot.slotLabel}
                            </Tag>
                            {currentState ? (
                              <Tag color="default">{currentState}</Tag>
                            ) : null}
                          </div>
                        </Col>
                        <Col xs={24} md={8}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            Lifecycle reason
                          </Text>
                          {allowed.length === 0 ? (
                            <Alert
                              type="warning"
                              showIcon
                              style={{ marginTop: 4 }}
                              message="No legal detach reason"
                              description={`State ${currentState ?? "unknown"} cannot transition to any of the allowed detach states.`}
                            />
                          ) : (
                            <Select
                              style={{ width: "100%", marginTop: 4 }}
                              placeholder="Select reason"
                              options={options}
                              value={lifecycle?.eventType}
                              onChange={(value: UnseatedReason) =>
                                setLifecycleByDrive((previous) => ({
                                  ...previous,
                                  [drive.id]: {
                                    eventType: value,
                                    explanation:
                                      previous[drive.id]?.explanation ?? "",
                                  },
                                }))
                              }
                            />
                          )}
                        </Col>
                        <Col xs={24} md={8}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            Explanation (optional)
                          </Text>
                          <Input.TextArea
                            rows={2}
                            style={{ marginTop: 4 }}
                            placeholder="Why is this drive being left unseated?"
                            value={lifecycle?.explanation ?? ""}
                            onChange={(event) =>
                              setLifecycleByDrive((previous) => ({
                                ...previous,
                                [drive.id]: {
                                  eventType: previous[drive.id]?.eventType,
                                  explanation: event.target.value,
                                },
                              }))
                            }
                          />
                        </Col>
                      </Row>
                    </Card>
                  );
                })}
              </Space>
            )}
          </Space>
        ),
    },
    {
      key: "review",
      title: "Review",
      description: "Confirm the allocation",
      icon: <CompassOutlined />,
      fields: [],
      content: () => (
        <Space direction="vertical" size="middle" style={{ display: "flex" }}>
          <Alert
            type="info"
            showIcon
            message="Review & confirm"
            description="Accepting applies every unmount and mount below in a single database transaction."
          />
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Card
                size="small"
                title={
                  <Space>
                    <DisconnectOutlined />
                    <span>Detach from source</span>
                  </Space>
                }
              >
                <Text
                  type="secondary"
                  style={{ display: "block", marginBottom: 8 }}
                >
                  {sourceServerId ? sourceName : "No source server selected"}
                </Text>
                {detachedDrives.length === 0 ? (
                  <Text type="secondary">No drives detached.</Text>
                ) : (
                  <Space
                    direction="vertical"
                    size={6}
                    style={{ display: "flex" }}
                  >
                    {detachedDrives.map(({ slot, drive }) => (
                      <div
                        key={drive.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 8,
                        }}
                      >
                        <Text ellipsis>
                          {drive.label}{" "}
                          <Text type="secondary">({drive.serialNumber})</Text>
                        </Text>
                        <Tag color="red" style={{ marginInlineEnd: 0 }}>
                          Unmount · {slot.slotLabel}
                        </Tag>
                      </div>
                    ))}
                  </Space>
                )}
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card
                size="small"
                title={
                  <Space>
                    <LinkOutlined />
                    <span>Mount to target</span>
                  </Space>
                }
              >
                <Text
                  type="secondary"
                  style={{ display: "block", marginBottom: 8 }}
                >
                  {targetServerId ? targetName : "No target server selected"}
                </Text>
                {draftRows.length === 0 ? (
                  <Text type="secondary">No drives seated.</Text>
                ) : (
                  <Space
                    direction="vertical"
                    size={6}
                    style={{ display: "flex" }}
                  >
                    {draftRows.map(({ slot, drive }) => (
                      <div
                        key={drive.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 8,
                        }}
                      >
                        <Text ellipsis>
                          {drive.label}{" "}
                          <Text type="secondary">({drive.serialNumber})</Text>
                        </Text>
                        <Tag color="green" style={{ marginInlineEnd: 0 }}>
                          Mount · {slot.slotLabel}
                        </Tag>
                      </div>
                    ))}
                  </Space>
                )}
                <Text
                  type="secondary"
                  style={{ display: "block", marginTop: 8, fontSize: 12 }}
                >
                  Source-detached drives are recorded as DEPROVISION +
                  PROVISION; unseated drives get PROVISION.
                </Text>
              </Card>
            </Col>
          </Row>

          <Card size="small" title="Left unseated">
            {unseatedDetached.length === 0 ? (
              <Text type="secondary">
                None — every detached drive is seated on the target.
              </Text>
            ) : (
              <Space direction="vertical" size={6} style={{ display: "flex" }}>
                {unseatedDetached.map(({ drive }) => {
                  const lifecycle = lifecycleByDrive[drive.id];
                  return (
                    <div
                      key={drive.id}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: 8,
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <Text ellipsis>
                          {drive.label}{" "}
                          <Text type="secondary">({drive.serialNumber})</Text>
                        </Text>
                        {lifecycle?.explanation ? (
                          <Text
                            type="secondary"
                            style={{ display: "block", fontSize: 12 }}
                          >
                            {lifecycle.explanation}
                          </Text>
                        ) : null}
                      </div>
                      <Tag style={{ marginInlineEnd: 0 }}>
                        {lifecycle?.eventType
                          ? REASON_LABELS[lifecycle.eventType]
                          : "Unseated"}
                      </Tag>
                    </div>
                  );
                })}
              </Space>
            )}
          </Card>

          <Text type="secondary">
            {sourceServerId ? `Source: ${sourceName}` : "No source"} →{" "}
            {targetServerId ? `Target: ${targetName}` : "No target"}
          </Text>
        </Space>
      ),
    },
  ];

  const handleFinish = async (raw: WorkflowValues) => {
    const values = raw as AllocationFormValues;
    const assignments = Object.entries(draft).map(
      ([slotId, physicalDriveId]) => ({ slotId, physicalDriveId }),
    );

    if (!hasActions) {
      message.warning("Nothing to allocate.");
      return;
    }

    const unseatedDriveStates = unseatedDetached
      .map(({ drive }) => {
        const lifecycle = lifecycleByDrive[drive.id];
        if (!lifecycle?.eventType) return null;
        return {
          physicalDriveId: drive.id,
          eventType: lifecycle.eventType,
          explanation: lifecycle.explanation.trim() || undefined,
        };
      })
      .filter(
        (
          state,
        ): state is {
          physicalDriveId: string;
          eventType: UnseatedReason;
          explanation: string | undefined;
        } => Boolean(state),
      );

    if (unseatedDriveStates.length !== unseatedDetached.length) {
      message.warning(
        "Select a lifecycle reason for every detached drive that stays unseated.",
      );
      return;
    }

    const response = await allocateDrives({
      url: `${apiUrl}/physical-servers/allocations`,
      method: "post",
      values: {
        datacenterId: values.datacenterId,
        sourceServerId: values.sourceServerId || undefined,
        detachDriveIds: Array.from(detachedDriveIds),
        targetServerId: values.targetServerId || undefined,
        assignments,
        unseatedDriveStates,
      },
    });

    const result = response.data as
      { unmountedDriveIds?: string[]; mountedDriveIds?: string[] } | undefined;

    open?.({
      type: "success",
      message: "Drive allocation complete",
      description: `${result?.unmountedDriveIds?.length ?? 0} unmounted, ${result?.mountedDriveIds?.length ?? 0} mounted.`,
      key: "drive-allocation",
    });

    const redirectId = values.targetServerId ?? values.sourceServerId;
    router.push(
      redirectId ? `/physical-servers/show/${redirectId}` : "/dashboard",
    );
  };

  return (
    <WorkflowWizard
      title="Drive Allocation"
      subtitle="Detach drives from a source server and seat them into a target server in one guided, atomic operation."
      icon={<SwapOutlined />}
      form={form}
      steps={steps}
      submitLabel="Apply allocation"
      submittingLabel="Applying..."
      onCancel={() => router.push("/dashboard")}
      onFinish={handleFinish}
    />
  );
};
