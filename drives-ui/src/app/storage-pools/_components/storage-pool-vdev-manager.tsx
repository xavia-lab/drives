"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  useApiUrl,
  useCan,
  useCustom,
  useCustomMutation,
} from "@refinedev/core";
import { LookupSelect } from "@components/lookup-select";
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Progress,
  Row,
  Select,
  Space,
  Statistic,
  Tag,
  Tooltip,
  Typography,
  theme,
} from "antd";
import {
  DatabaseOutlined,
  PlusOutlined,
  ReloadOutlined,
  SaveOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

type VdevClass = "DATA" | "LOG" | "CACHE" | "SPECIAL" | "SPARE";

interface VdevProfileRecord {
  id: string;
  code: string;
  displayName: string;
  minMembers: number;
  maxMembers: number | null;
  capacityMode: string;
}

interface DriveShallow {
  id: string;
  label: string;
  serialNumber: string;
  driveModelId: string;
}

interface VdevMemberRecord {
  id: string;
  physicalDriveId: string;
  osDeviceNodePath: string | null;
  memberRole: string;
  physicalDrive?: DriveShallow;
}

interface VdevCapacity {
  memberCount: number;
  dataMemberCount: number;
  spareCount: number;
  minMembers: number;
  maxMembers: number | null;
  isComplete: boolean;
  capacityKnown: boolean;
  rawBytes: number | null;
  usableBytes: number | null;
  formula: string;
  estimated: boolean;
}

interface VdevRecord {
  id: string;
  vdevName: string;
  vdevClass: VdevClass;
  sortOrder: number;
  notes: string | null;
  redundancyProfileId: string;
  redundancyProfile?: VdevProfileRecord;
  capacity?: VdevCapacity;
  members?: VdevMemberRecord[];
}

interface AvailableDrive {
  driveId: string;
  slotId: string;
  slotLabel: string;
  serverId: string;
  serverHostname: string;
  datacenterId: string;
  label: string;
  serialNumber: string;
  driveModelId: string;
  driveModelName: string | null;
}

interface PoolCapacity {
  rawBytes: number | null;
  usableBytes: number | null;
  capacityKnown: boolean;
  estimated: boolean;
  vdevCount: number;
  dataVdevCount: number;
}

interface DraftMember {
  physicalDriveId: string;
  osDeviceNodePath?: string | null;
}

type Draft = Record<string, DraftMember[]>;

interface StoragePoolVdevManagerProps {
  poolId?: string;
}

const formatBytes = (bytes: number | null | undefined) => {
  if (bytes === null || bytes === undefined) return "-";
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1000)),
    units.length - 1,
  );
  return `${(bytes / 1000 ** index).toFixed(2)} ${units[index]}`;
};

const vdevClassColor: Record<VdevClass, string> = {
  DATA: "blue",
  LOG: "purple",
  CACHE: "orange",
  SPECIAL: "geekblue",
  SPARE: "gold",
};

const draftFromVdevs = (vdevs: VdevRecord[]): Draft =>
  vdevs.reduce<Draft>((draft, vdev) => {
    draft[vdev.id] = (vdev.members ?? []).map((member) => ({
      physicalDriveId: member.physicalDriveId,
      osDeviceNodePath: member.osDeviceNodePath,
    }));
    return draft;
  }, {});

export const StoragePoolVdevManager = ({
  poolId,
}: StoragePoolVdevManagerProps) => {
  const apiUrl = useApiUrl();
  const { message } = App.useApp();
  const { token } = theme.useToken();
  const { mutateAsync: createVdev } = useCustomMutation();
  const { mutateAsync: saveLayout } = useCustomMutation();
  const { mutateAsync: deleteVdev } = useCustomMutation();
  const { data: canCreateVdev } = useCan({
    resource: "logical-vdevs",
    action: "create",
  });
  const { data: canSaveLayout } = useCan({
    resource: "logical-disks",
    action: "save",
  });

  const [form] = Form.useForm<{
    vdevName: string;
    redundancyProfileId: string;
    vdevClass: VdevClass;
    notes?: string;
  }>();
  const [draft, setDraft] = useState<Draft | null>(null);
  const lastVdevSignature = useRef("");
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const vdevsQuery = useCustom<VdevRecord[]>({
    url: `${apiUrl}/storage-pools/${poolId}/vdevs`,
    method: "get",
    queryOptions: {
      enabled: Boolean(poolId),
      refetchOnWindowFocus: false,
    },
  });
  const availableQuery = useCustom<AvailableDrive[]>({
    url: `${apiUrl}/storage-pools/${poolId}/available-drives`,
    method: "get",
    queryOptions: {
      enabled: Boolean(poolId),
      refetchOnWindowFocus: false,
    },
  });
  const capacityQuery = useCustom<PoolCapacity>({
    url: `${apiUrl}/storage-pools/${poolId}/vdev-capacity`,
    method: "get",
    queryOptions: {
      enabled: Boolean(poolId),
      refetchOnWindowFocus: false,
    },
  });

  const vdevs = useMemo(
    () =>
      Array.isArray(vdevsQuery.result?.data)
        ? (vdevsQuery.result.data as VdevRecord[])
        : [],
    [vdevsQuery.result],
  );
  const available = useMemo(
    () =>
      Array.isArray(availableQuery.result?.data)
        ? (availableQuery.result.data as AvailableDrive[])
        : [],
    [availableQuery.result],
  );
  const capacity = capacityQuery.result?.data as PoolCapacity | undefined;

  const vdevSignature = useMemo(
    () =>
      vdevs
        .map(
          (vdev) =>
            `${vdev.id}:${(vdev.members ?? [])
              .map((member) => member.physicalDriveId)
              .sort()
              .join(",")}`,
        )
        .join("|"),
    [vdevs],
  );

  // Seed the editable draft only when the server membership actually changes.
  // `useCustom` can return fresh object identities on every render; comparing the
  // data itself prevents an effect -> setState -> render loop.
  useEffect(() => {
    if (!Array.isArray(vdevsQuery.result?.data)) return;
    if (vdevSignature === lastVdevSignature.current) return;
    lastVdevSignature.current = vdevSignature;
    setDraft(draftFromVdevs(vdevs));
  }, [vdevSignature, vdevs, vdevsQuery.result]);

  const driveById = useMemo(() => {
    const map = new Map<string, DriveShallow>();
    for (const vdev of vdevs) {
      for (const member of vdev.members ?? []) {
        if (member.physicalDrive)
          map.set(member.physicalDriveId, member.physicalDrive);
      }
    }
    for (const drive of available) {
      if (!map.has(drive.driveId)) {
        map.set(drive.driveId, {
          id: drive.driveId,
          label: drive.label ?? drive.slotLabel,
          serialNumber: drive.serialNumber ?? drive.slotLabel,
          driveModelId: drive.driveModelId ?? "",
        });
      }
    }
    return map;
  }, [available, vdevs]);

  const draftDriveIds = useMemo(
    () =>
      new Set(
        Object.values(draft ?? {})
          .flat()
          .map((member) => member.physicalDriveId),
      ),
    [draft],
  );

  const freeDrives = useMemo(() => {
    const map = new Map<
      string,
      { id: string; label: string; sublabel: string }
    >();
    for (const drive of available) {
      if (!draftDriveIds.has(drive.driveId)) {
        map.set(drive.driveId, {
          id: drive.driveId,
          label: drive.label ?? drive.slotLabel,
          sublabel: `${drive.serialNumber ?? drive.slotLabel} · ${drive.serverHostname} · ${drive.slotLabel}`,
        });
      }
    }
    for (const vdev of vdevs) {
      for (const member of vdev.members ?? []) {
        if (
          !draftDriveIds.has(member.physicalDriveId) &&
          member.physicalDrive
        ) {
          map.set(member.physicalDriveId, {
            id: member.physicalDriveId,
            label: member.physicalDrive.label,
            sublabel: member.physicalDrive.serialNumber,
          });
        }
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      a.label.localeCompare(b.label),
    );
  }, [available, draftDriveIds, vdevs]);

  const dirty = useMemo(() => {
    if (!draft) return false;
    return vdevs.some((vdev) => {
      const current = (vdev.members ?? []).map(
        (member) => member.physicalDriveId,
      );
      const next = (draft[vdev.id] ?? []).map(
        (member) => member.physicalDriveId,
      );
      return (
        current.length !== next.length ||
        current.some((id) => !next.includes(id))
      );
    });
  }, [draft, vdevs]);

  const addMember = (vdevId: string, driveId: string) => {
    setDraft((current) => ({
      ...(current ?? {}),
      [vdevId]: [...(current?.[vdevId] ?? []), { physicalDriveId: driveId }],
    }));
  };

  const removeMember = (vdevId: string, driveId: string) => {
    setDraft((current) => ({
      ...(current ?? {}),
      [vdevId]: (current?.[vdevId] ?? []).filter(
        (member) => member.physicalDriveId !== driveId,
      ),
    }));
  };

  const moveMember = (
    vdevId: string,
    driveId: string,
    targetVdevId: string,
  ) => {
    if (!targetVdevId || targetVdevId === vdevId) return;
    setDraft((current) => {
      const member = (current?.[vdevId] ?? []).find(
        (entry) => entry.physicalDriveId === driveId,
      );
      if (!member) return current;
      return {
        ...(current ?? {}),
        [vdevId]: (current?.[vdevId] ?? []).filter(
          (entry) => entry.physicalDriveId !== driveId,
        ),
        [targetVdevId]: [...(current?.[targetVdevId] ?? []), member],
      };
    });
  };

  const handleSave = async () => {
    if (!poolId || !draft) return;
    setSaving(true);
    try {
      await saveLayout({
        url: `${apiUrl}/storage-pools/${poolId}/vdev-layout`,
        method: "put",
        values: {
          vdevs: vdevs.map((vdev) => ({
            vdevId: vdev.id,
            members: draft[vdev.id] ?? [],
          })),
        },
      });
      message.success("Vdev layout saved");
      await Promise.all([
        vdevsQuery.query.refetch(),
        availableQuery.query.refetch(),
        capacityQuery.query.refetch(),
      ]);
    } catch (error) {
      const detail = (error as { message?: string | string[] })?.message;
      message.error(
        Array.isArray(detail)
          ? detail.join(", ")
          : (detail ?? "Could not save the vdev layout"),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    if (!poolId) return;
    try {
      const values = await form.validateFields();
      await createVdev({
        url: `${apiUrl}/storage-pools/${poolId}/vdevs`,
        method: "post",
        values,
      });
      message.success("Vdev created");
      setCreateOpen(false);
      form.resetFields();
      await vdevsQuery.query.refetch();
    } catch (error) {
      const detail = (error as { message?: string | string[] })?.message;
      if (detail) {
        message.error(Array.isArray(detail) ? detail.join(", ") : detail);
      }
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteVdev({
        url: `${apiUrl}/logical-vdevs/${id}`,
        method: "delete",
        values: {},
      });
      message.success("Vdev deleted");
      await vdevsQuery.query.refetch();
    } catch (error) {
      const detail = (error as { message?: string | string[] })?.message;
      message.error(
        Array.isArray(detail) ? detail.join(", ") : (detail ?? "Delete failed"),
      );
    } finally {
      setDeletingId(null);
    }
  };

  if (!poolId) return null;

  const loading = vdevsQuery.query.isLoading;

  return (
    <Card
      title={
        <Space>
          <DatabaseOutlined />
          <span>Virtual Devices</span>
          <Tag>{vdevs.length}</Tag>
        </Space>
      }
      extra={
        <Space>
          <Tooltip title="Reload capacity and memberships">
            <Button
              icon={<ReloadOutlined />}
              onClick={() =>
                Promise.all([
                  vdevsQuery.query.refetch(),
                  availableQuery.query.refetch(),
                  capacityQuery.query.refetch(),
                ])
              }
            />
          </Tooltip>
          {canSaveLayout?.can ? (
            <Button
              type="primary"
              icon={<SaveOutlined />}
              disabled={!dirty}
              loading={saving}
              onClick={handleSave}
            >
              Save layout
            </Button>
          ) : null}
        </Space>
      }
      loading={loading}
    >
      <Space direction="vertical" size="large" style={{ display: "flex" }}>
        {capacity ? (
          <Card size="small" style={{ background: token.colorFillQuaternary }}>
            <Row gutter={24}>
              <Col xs={12} md={6}>
                <Statistic
                  title="Raw capacity"
                  value={formatBytes(capacity.rawBytes)}
                />
              </Col>
              <Col xs={12} md={6}>
                <Statistic
                  title="Usable capacity"
                  value={formatBytes(capacity.usableBytes)}
                />
              </Col>
              <Col xs={12} md={6}>
                <Statistic title="Vdevs" value={capacity.vdevCount} />
              </Col>
              <Col xs={12} md={6}>
                <Statistic
                  title="Capacity estimate"
                  value={capacity.estimated ? "Estimated" : "Exact"}
                />
              </Col>
            </Row>
            {!capacity.capacityKnown ? (
              <Alert
                style={{ marginTop: 12 }}
                type="warning"
                showIcon
                message="One or more member drives have no recorded capacity"
              />
            ) : null}
          </Card>
        ) : null}

        <Text type="secondary">
          Drag-free layout editor: add a drive to a vdev, remove it, or move it
          to another vdev in this pool, then save the complete layout. The save
          is transactional.
        </Text>

        {vdevs.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No vdevs in this pool yet"
          >
            {canCreateVdev?.can ? (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setCreateOpen(true)}
              >
                Create vdev
              </Button>
            ) : null}
          </Empty>
        ) : (
          <Space direction="vertical" size="middle" style={{ display: "flex" }}>
            {vdevs.map((vdev) => {
              const members = draft?.[vdev.id] ?? [];
              const profiles = vdev.redundancyProfile;
              const cap = vdev.capacity;
              const progress =
                cap?.usableBytes != null && cap?.rawBytes
                  ? Math.round((cap.usableBytes / cap.rawBytes) * 100)
                  : 0;
              return (
                <Card
                  key={vdev.id}
                  size="small"
                  title={
                    <Space wrap>
                      <Text strong>{vdev.vdevName}</Text>
                      <Tag color={vdevClassColor[vdev.vdevClass]}>
                        {vdev.vdevClass}
                      </Tag>
                      <Tag>
                        {profiles?.displayName ?? vdev.redundancyProfileId}
                      </Tag>
                      {cap ? (
                        <Tag color={cap.isComplete ? "green" : "orange"}>
                          {cap.isComplete ? "Complete" : "Incomplete"}
                        </Tag>
                      ) : null}
                    </Space>
                  }
                  extra={
                    <Space>
                      {canCreateVdev?.can ? (
                        <Popconfirm
                          title="Delete this vdev?"
                          description="Only empty vdevs can be deleted."
                          onConfirm={() => handleDelete(vdev.id)}
                          okText="Delete"
                          okButtonProps={{ danger: true }}
                        >
                          <Button
                            danger
                            size="small"
                            loading={deletingId === vdev.id}
                          >
                            Delete
                          </Button>
                        </Popconfirm>
                      ) : null}
                    </Space>
                  }
                >
                  <Row gutter={16}>
                    <Col xs={24} lg={10}>
                      <Space direction="vertical" size={4}>
                        <Text type="secondary">
                          {members.length} / {profiles?.minMembers ?? "?"}{" "}
                          members
                        </Text>
                        <Text>
                          Raw: <strong>{formatBytes(cap?.rawBytes)}</strong>
                        </Text>
                        <Text>
                          Usable:{" "}
                          <strong>{formatBytes(cap?.usableBytes)}</strong>
                        </Text>
                        {cap ? (
                          <Tooltip title={cap.formula}>
                            <Progress
                              percent={progress}
                              size="small"
                              status={cap.isComplete ? "normal" : "exception"}
                            />
                          </Tooltip>
                        ) : null}
                      </Space>
                    </Col>
                    <Col xs={24} lg={14}>
                      <Space
                        direction="vertical"
                        size={8}
                        style={{ display: "flex" }}
                      >
                        {members.length === 0 ? (
                          <Text type="secondary">No member drives</Text>
                        ) : (
                          members.map((member) => {
                            const drive = driveById.get(member.physicalDriveId);
                            return (
                              <div
                                key={member.physicalDriveId}
                                style={{
                                  display: "flex",
                                  gap: 8,
                                  alignItems: "center",
                                  padding: "8px 10px",
                                  borderRadius: 8,
                                  border: `1px solid ${token.colorBorderSecondary}`,
                                  background: token.colorFillQuaternary,
                                }}
                              >
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <Text
                                    strong
                                    ellipsis
                                    style={{ display: "block" }}
                                  >
                                    {drive?.label ?? member.physicalDriveId}
                                  </Text>
                                  <Text
                                    type="secondary"
                                    style={{ fontSize: 12 }}
                                  >
                                    {drive?.serialNumber ??
                                      member.osDeviceNodePath ??
                                      "No device path"}
                                  </Text>
                                </div>
                                {canSaveLayout?.can ? (
                                  <>
                                    <Select
                                      size="small"
                                      placeholder="Move to"
                                      style={{ minWidth: 140 }}
                                      value={undefined}
                                      options={vdevs
                                        .filter(
                                          (target) => target.id !== vdev.id,
                                        )
                                        .map((target) => ({
                                          value: target.id,
                                          label: target.vdevName,
                                        }))}
                                      onChange={(target) => {
                                        if (target) {
                                          moveMember(
                                            vdev.id,
                                            member.physicalDriveId,
                                            target,
                                          );
                                        }
                                      }}
                                    />
                                    <Button
                                      size="small"
                                      danger
                                      onClick={() =>
                                        removeMember(
                                          vdev.id,
                                          member.physicalDriveId,
                                        )
                                      }
                                    >
                                      Remove
                                    </Button>
                                  </>
                                ) : null}
                              </div>
                            );
                          })
                        )}

                        {canSaveLayout?.can ? (
                          <Select
                            showSearch
                            optionFilterProp="label"
                            placeholder={
                              freeDrives.length
                                ? "Add an available drive"
                                : "No available drives on this host"
                            }
                            style={{ width: "100%" }}
                            disabled={freeDrives.length === 0}
                            value={null}
                            options={freeDrives.map((drive) => ({
                              value: drive.id,
                              label: `${drive.label} — ${drive.sublabel}`,
                            }))}
                            onChange={(driveId) => {
                              if (driveId) addMember(vdev.id, driveId);
                            }}
                          />
                        ) : null}
                      </Space>
                    </Col>
                  </Row>
                </Card>
              );
            })}
          </Space>
        )}
      </Space>

      <Modal
        open={createOpen}
        title="Create vdev"
        okText="Create"
        onOk={handleCreate}
        onCancel={() => {
          setCreateOpen(false);
          form.resetFields();
        }}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ vdevClass: "DATA" }}
        >
          <Form.Item
            label="Name"
            name="vdevName"
            rules={[{ required: true, message: "Vdev name is required" }]}
          >
            <Input maxLength={32} placeholder="e.g. raidz2-0" />
          </Form.Item>
          <Form.Item
            label="Redundancy profile"
            name="redundancyProfileId"
            rules={[{ required: true, message: "Select a profile" }]}
          >
            <LookupSelect
              resource="vdev-profiles"
              optionLabel="displayName"
              placeholder="Select profile"
            />
          </Form.Item>
          <Form.Item label="Vdev class" name="vdevClass">
            <Select
              options={(
                ["DATA", "LOG", "CACHE", "SPECIAL", "SPARE"] as VdevClass[]
              ).map((value) => ({ value, label: value }))}
            />
          </Form.Item>
          <Form.Item label="Notes" name="notes">
            <Input.TextArea rows={2} placeholder="Optional notes" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};
