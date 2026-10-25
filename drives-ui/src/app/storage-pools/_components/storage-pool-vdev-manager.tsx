"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  useApiUrl,
  useCan,
  useCustom,
  useCustomMutation,
  useList,
} from "@refinedev/core";
import { useLookupOptions } from "@hooks/use-lookup-options";
import {
  Alert,
  App,
  Button,
  Card,
  Checkbox,
  Col,
  Empty,
  Form,
  Input,
  Modal,
  Pagination,
  Popconfirm,
  Progress,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Tag,
  Timeline,
  Tooltip,
  Typography,
  theme,
} from "antd";
import {
  DatabaseOutlined,
  HistoryOutlined,
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
  technology: string;
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
  health:
    "PLANNED" | "INCOMPLETE" | "ONLINE" | "DEGRADED" | "FAILED" | "UNKNOWN";
  memberStates: Record<string, string>;
}

interface VdevConfigEvent {
  id: string;
  displayKey: number;
  action: "CREATE" | "UPDATE" | "DELETE";
  beforeSnapshot: Record<string, unknown> | null;
  afterSnapshot: Record<string, unknown> | null;
  eventTimestamp: string;
  performedByUserId: string | null;
  notes: string | null;
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
  health: VdevCapacity["health"];
  healthCounts: Record<VdevCapacity["health"], number>;
  spareVdevCount: number;
  spareMemberCount: number;
}

interface HistoryPage {
  data: VdevConfigEvent[];
  meta: {
    totalItems: number;
    itemCount: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}

interface DraftMember {
  physicalDriveId: string;
  osDeviceNodePath?: string | null;
}

type Draft = Record<string, DraftMember[]>;

interface StoragePoolVdevManagerProps {
  poolId?: string;
  poolTypeId?: string;
  /** Hide the internal save button when a parent workflow commits the layout. */
  showSaveButton?: boolean;
  /** Stage vdev create/delete until save() is called. */
  deferVdevMutations?: boolean;
  onDirtyChange?: (dirty: boolean) => void;
  onReviewChange?: (review: VdevLayoutReview) => void;
}

export interface StoragePoolVdevManagerHandle {
  save: () => Promise<boolean>;
  isDirty: () => boolean;
}

interface HistoryScope {
  kind: "vdev" | "pool";
  id: string;
  name: string;
}

interface PendingVdev {
  tempId: string;
  vdevName: string;
  redundancyProfileId: string;
  vdevClass: VdevClass;
  notes?: string;
  profile?: VdevProfileRecord;
}

export interface VdevReviewDrive {
  id: string;
  label: string;
}

export interface VdevReviewItem {
  id: string;
  name: string;
  action: "CREATE" | "DELETE" | "UPDATE" | "UNCHANGED";
  before: VdevReviewDrive[];
  after: VdevReviewDrive[];
}

export interface VdevLayoutReview {
  items: VdevReviewItem[];
  hasChanges: boolean;
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

const allowedTechnologies: Record<string, string[]> = {
  ZFS: ["ZFS", "GENERIC"],
  BTRFS: ["BTRFS", "GENERIC"],
  CEPH_OSD_POOL: ["CEPH", "GENERIC"],
  MDRAID: ["MDRAID", "GENERIC"],
  RAW_JBOD: ["GENERIC"],
};

const healthColor: Record<VdevCapacity["health"], string> = {
  PLANNED: "default",
  INCOMPLETE: "orange",
  ONLINE: "green",
  DEGRADED: "gold",
  FAILED: "red",
  UNKNOWN: "default",
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

export const StoragePoolVdevManager = forwardRef<
  StoragePoolVdevManagerHandle,
  StoragePoolVdevManagerProps
>(function StoragePoolVdevManager(
  {
    poolId,
    poolTypeId,
    showSaveButton = true,
    deferVdevMutations = false,
    onDirtyChange,
    onReviewChange,
  }: StoragePoolVdevManagerProps,
  ref,
) {
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
  const [historyScope, setHistoryScope] = useState<HistoryScope | null>(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [selectedDriveIds, setSelectedDriveIds] = useState<Set<string>>(
    new Set(),
  );
  const [pendingVdevs, setPendingVdevs] = useState<PendingVdev[]>([]);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<Set<string>>(
    new Set(),
  );
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
  const { query: profilesQuery } = useList<VdevProfileRecord>({
    resource: "vdev-profiles",
    pagination: { mode: "server", currentPage: 1, pageSize: 100 },
  });
  const { options: poolTypeOptions } = useLookupOptions({
    resource: "pool-types",
    optionLabel: "name",
  });
  const historyUrl = historyScope
    ? historyScope.kind === "vdev"
      ? `${apiUrl}/logical-vdevs/${historyScope.id}/config-history`
      : `${apiUrl}/storage-pools/${historyScope.id}/vdev-config-history`
    : "";
  const historyQuery = useCustom<HistoryPage>({
    url: `${historyUrl}?pageNumber=${historyPage}&pageSize=8`,
    method: "get",
    queryOptions: {
      enabled: Boolean(historyScope),
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
    [vdevsQuery.result?.data],
  );
  const allVdevs = useMemo<VdevRecord[]>(
    () => [
      ...vdevs.filter((vdev) => !pendingDeleteIds.has(vdev.id)),
      ...pendingVdevs.map((pending) => ({
        id: pending.tempId,
        vdevName: pending.vdevName,
        vdevClass: pending.vdevClass,
        sortOrder: 0,
        notes: pending.notes ?? null,
        redundancyProfileId: pending.redundancyProfileId,
        redundancyProfile: pending.profile,
        capacity: {
          memberCount: 0,
          dataMemberCount: 0,
          spareCount: 0,
          minMembers: pending.profile?.minMembers ?? 1,
          maxMembers: pending.profile?.maxMembers ?? null,
          isComplete: false,
          capacityKnown: true,
          rawBytes: 0,
          usableBytes: 0,
          formula: "Pending vdev",
          estimated: false,
          health: "PLANNED" as const,
          memberStates: {},
        },
      })),
    ],
    [pendingDeleteIds, pendingVdevs, vdevs],
  );
  const available = useMemo(
    () =>
      Array.isArray(availableQuery.result?.data)
        ? (availableQuery.result.data as AvailableDrive[])
        : [],
    [availableQuery.result?.data],
  );
  const capacity = capacityQuery.result?.data as PoolCapacity | undefined;
  const poolTypeName = poolTypeOptions.find(
    (option) => option.value === poolTypeId,
  )?.label;
  const compatibleProfiles = useMemo(() => {
    const profiles = profilesQuery.data?.data ?? [];
    const allowed = poolTypeName
      ? (allowedTechnologies[String(poolTypeName)] ?? ["GENERIC"])
      : null;
    return allowed
      ? profiles.filter((profile) => allowed.includes(profile.technology))
      : profiles;
  }, [poolTypeName, profilesQuery.data?.data]);

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
    setSelectedDriveIds(new Set());
    setPendingVdevs([]);
    setPendingDeleteIds(new Set());
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
          label:
            drive.label ??
            drive.slotLabel ??
            drive.serialNumber ??
            "Unnamed drive",
          serialNumber: drive.serialNumber ?? drive.slotLabel ?? drive.driveId,
          driveModelId: drive.driveModelId ?? "",
        });
      }
    }
    return map;
  }, [available, vdevs]);

  const layoutReview = useMemo<VdevLayoutReview>(() => {
    const drive = (id: string): VdevReviewDrive => ({
      id,
      label: driveById.get(id)?.label ?? id,
    });
    const ids = (members?: DraftMember[]) =>
      (members ?? []).map((member) => member.physicalDriveId);
    const items: VdevReviewItem[] = [];

    for (const vdev of vdevs) {
      const beforeIds = (vdev.members ?? []).map(
        (member) => member.physicalDriveId,
      );
      const deleted = pendingDeleteIds.has(vdev.id);
      const afterIds = deleted ? [] : ids(draft?.[vdev.id]);
      const changed =
        deleted ||
        beforeIds.length !== afterIds.length ||
        beforeIds.some((id) => !afterIds.includes(id));
      items.push({
        id: vdev.id,
        name: vdev.vdevName,
        action: deleted ? "DELETE" : changed ? "UPDATE" : "UNCHANGED",
        before: beforeIds.map(drive),
        after: afterIds.map(drive),
      });
    }

    for (const pending of pendingVdevs) {
      const afterIds = ids(draft?.[pending.tempId]);
      items.push({
        id: pending.tempId,
        name: pending.vdevName,
        action: "CREATE",
        before: [],
        after: afterIds.map(drive),
      });
    }

    return {
      items,
      hasChanges: items.some((item) => item.action !== "UNCHANGED"),
    };
  }, [draft, driveById, pendingDeleteIds, pendingVdevs, vdevs]);

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
          label:
            drive.label ??
            drive.slotLabel ??
            drive.serialNumber ??
            "Unnamed drive",
          sublabel: [
            drive.serialNumber ?? drive.slotLabel,
            drive.serverHostname,
            drive.slotLabel,
          ]
            .filter(Boolean)
            .join(" · "),
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
            label:
              member.physicalDrive.label ??
              member.physicalDrive.serialNumber ??
              member.physicalDriveId,
            sublabel:
              member.physicalDrive.serialNumber ?? member.physicalDriveId,
          });
        }
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      String(a.label ?? "").localeCompare(String(b.label ?? ""), undefined, {
        numeric: true,
      }),
    );
  }, [available, draftDriveIds, vdevs]);

  const dirty = useMemo(() => {
    if (!draft) return false;
    if (pendingVdevs.length > 0 || pendingDeleteIds.size > 0) return true;
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
  }, [draft, pendingDeleteIds.size, pendingVdevs.length, vdevs]);

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

  const toggleSelection = (driveId: string) => {
    setSelectedDriveIds((current) => {
      const next = new Set(current);
      if (next.has(driveId)) next.delete(driveId);
      else next.add(driveId);
      return next;
    });
  };

  const bulkMove = (targetVdevId: string) => {
    if (selectedDriveIds.size === 0) return;
    setDraft((current) => {
      const next: Draft = {};
      for (const vdev of allVdevs) {
        next[vdev.id] = (current?.[vdev.id] ?? []).filter(
          (member) => !selectedDriveIds.has(member.physicalDriveId),
        );
      }
      next[targetVdevId] = [
        ...(next[targetVdevId] ?? []),
        ...Array.from(selectedDriveIds).map((physicalDriveId) => ({
          physicalDriveId,
        })),
      ];
      return next;
    });
    setSelectedDriveIds(new Set());
  };

  const bulkRemove = () => {
    if (selectedDriveIds.size === 0) return;
    setDraft((current) =>
      Object.fromEntries(
        allVdevs.map((vdev) => [
          vdev.id,
          (current?.[vdev.id] ?? []).filter(
            (member) => !selectedDriveIds.has(member.physicalDriveId),
          ),
        ]),
      ),
    );
    setSelectedDriveIds(new Set());
  };

  const openHistory = (scope: HistoryScope) => {
    setHistoryPage(1);
    setHistoryScope(scope);
  };

  const handleSave = async (): Promise<boolean> => {
    if (!poolId || !draft) return false;
    setSaving(true);
    try {
      const createdIdByTemp = new Map<string, string>();
      if (deferVdevMutations) {
        for (const pending of pendingVdevs) {
          const response = await createVdev({
            url: `${apiUrl}/storage-pools/${poolId}/vdevs`,
            method: "post",
            values: {
              vdevName: pending.vdevName,
              redundancyProfileId: pending.redundancyProfileId,
              vdevClass: pending.vdevClass,
              notes: pending.notes,
            },
          });
          const created = response.data as { id?: string } | undefined;
          if (!created?.id) {
            throw new Error("VDEV creation did not return an identifier");
          }
          createdIdByTemp.set(pending.tempId, created.id);
        }
      }

      const layout = vdevs.map((vdev) => ({
        vdevId: vdev.id,
        members: pendingDeleteIds.has(vdev.id) ? [] : (draft[vdev.id] ?? []),
      }));
      for (const pending of pendingVdevs) {
        const realId = createdIdByTemp.get(pending.tempId);
        if (realId) {
          layout.push({
            vdevId: realId,
            members: draft[pending.tempId] ?? [],
          });
        }
      }

      await saveLayout({
        url: `${apiUrl}/storage-pools/${poolId}/vdev-layout`,
        method: "put",
        values: { vdevs: layout },
      });

      if (deferVdevMutations) {
        for (const vdevId of Array.from(pendingDeleteIds)) {
          await deleteVdev({
            url: `${apiUrl}/logical-vdevs/${vdevId}`,
            method: "delete",
            values: {},
          });
        }
      }

      message.success("VDEV changes saved");
      setSelectedDriveIds(new Set());
      setPendingVdevs([]);
      setPendingDeleteIds(new Set());
      await Promise.all([
        vdevsQuery.query.refetch(),
        availableQuery.query.refetch(),
        capacityQuery.query.refetch(),
      ]);
      return true;
    } catch (error) {
      const detail = (error as { message?: string | string[] })?.message;
      message.error(
        Array.isArray(detail)
          ? detail.join(", ")
          : (detail ?? "Could not save the vdev layout"),
      );
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    if (!poolId) return;
    try {
      const values = await form.validateFields();
      const vdevName = values.vdevName.trim();
      if (
        vdevs.some(
          (vdev) => vdev.vdevName.toLowerCase() === vdevName.toLowerCase(),
        ) ||
        pendingVdevs.some(
          (vdev) => vdev.vdevName.toLowerCase() === vdevName.toLowerCase(),
        )
      ) {
        message.error(`VDEV "${vdevName}" already exists in this pool`);
        return;
      }

      if (deferVdevMutations) {
        const tempId = `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        const profile = compatibleProfiles.find(
          (candidate) => candidate.id === values.redundancyProfileId,
        );
        setPendingVdevs((current) => [
          ...current,
          {
            tempId,
            vdevName,
            redundancyProfileId: values.redundancyProfileId,
            vdevClass: values.vdevClass ?? "DATA",
            notes: values.notes,
            profile,
          },
        ]);
        setDraft((current) => ({ ...(current ?? {}), [tempId]: [] }));
        message.success("VDEV staged; apply it from the review step");
      } else {
        await createVdev({
          url: `${apiUrl}/storage-pools/${poolId}/vdevs`,
          method: "post",
          values: { ...values, vdevName },
        });
        message.success("VDEV created");
        await vdevsQuery.query.refetch();
      }
      setCreateOpen(false);
      form.resetFields();
    } catch (error) {
      const detail = (error as { message?: string | string[] })?.message;
      if (detail) {
        message.error(Array.isArray(detail) ? detail.join(", ") : detail);
      }
    }
  };

  const undoPendingDelete = (id: string) => {
    const vdev = vdevs.find((candidate) => candidate.id === id);
    setPendingDeleteIds((current) => {
      const next = new Set(current);
      next.delete(id);
      return next;
    });
    setDraft((current) => {
      const restored = new Set(
        (vdev?.members ?? []).map((member) => member.physicalDriveId),
      );
      const next = Object.fromEntries(
        Object.entries(current ?? {}).map(([vdevId, members]) => [
          vdevId,
          members.filter((member) => !restored.has(member.physicalDriveId)),
        ]),
      );
      next[id] = (vdev?.members ?? []).map((member) => ({
        physicalDriveId: member.physicalDriveId,
        osDeviceNodePath: member.osDeviceNodePath,
      }));
      return next;
    });
  };

  const handleDelete = async (id: string) => {
    if (deferVdevMutations) {
      if (id.startsWith("local-")) {
        setPendingVdevs((current) =>
          current.filter((pending) => pending.tempId !== id),
        );
        setDraft((current) => {
          const next = { ...(current ?? {}) };
          delete next[id];
          return next;
        });
        setSelectedDriveIds(new Set());
        return;
      }
      setPendingDeleteIds((current) => new Set(current).add(id));
      setDraft((current) => ({ ...(current ?? {}), [id]: [] }));
      setSelectedDriveIds(new Set());
      message.info("VDEV marked for deletion; apply from the review step");
      return;
    }

    setDeletingId(id);
    try {
      await deleteVdev({
        url: `${apiUrl}/logical-vdevs/${id}`,
        method: "delete",
        values: {},
      });
      message.success("VDEV deleted");
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

  useImperativeHandle(ref, () => ({
    save: handleSave,
    isDirty: () => dirty,
  }));

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  useEffect(() => {
    onReviewChange?.(layoutReview);
  }, [layoutReview, onReviewChange]);

  if (!poolId) return null;

  const loading = vdevsQuery.query.isLoading;

  return (
    <Card
      title={
        <Space>
          <DatabaseOutlined />
          <span>Virtual Devices</span>
          <Tag>{allVdevs.length}</Tag>
        </Space>
      }
      extra={
        <Space>
          <Tooltip title="Pool configuration history">
            <Button
              icon={<HistoryOutlined />}
              onClick={() =>
                openHistory({ kind: "pool", id: poolId, name: "Pool" })
              }
            />
          </Tooltip>
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
          {canSaveLayout?.can && showSaveButton ? (
            <Button
              type="primary"
              icon={<SaveOutlined />}
              disabled={!dirty}
              loading={saving}
              onClick={() => void handleSave()}
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
              <Col xs={12} md={4}>
                <Statistic
                  title="Raw capacity"
                  value={formatBytes(capacity.rawBytes)}
                />
              </Col>
              <Col xs={12} md={4}>
                <Statistic
                  title="Usable capacity"
                  value={formatBytes(capacity.usableBytes)}
                />
              </Col>
              <Col xs={12} md={4}>
                <Statistic title="Vdevs" value={capacity.vdevCount} />
              </Col>
              <Col xs={12} md={4}>
                <Statistic title="Spares" value={capacity.spareMemberCount} />
              </Col>
              <Col xs={12} md={4}>
                <Statistic
                  title="Health"
                  value={capacity.health}
                  valueStyle={{ color: token.colorText }}
                />
              </Col>
              <Col xs={12} md={4}>
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
          to another vdev in this pool, then save the complete layout. Select
          multiple member drives to move or remove them in bulk. The save is
          transactional.
        </Text>

        {selectedDriveIds.size > 0 && canSaveLayout?.can ? (
          <Card size="small" style={{ background: token.colorFillQuaternary }}>
            <Space wrap>
              <Tag color="blue">{selectedDriveIds.size} selected</Tag>
              <Select
                placeholder="Move selected to"
                style={{ minWidth: 180 }}
                value={null}
                options={allVdevs.map((vdev) => ({
                  value: vdev.id,
                  label: vdev.vdevName,
                }))}
                onChange={(target) => target && bulkMove(target)}
              />
              <Button danger onClick={bulkRemove}>
                Remove selected
              </Button>
              <Button
                type="text"
                onClick={() => setSelectedDriveIds(new Set())}
              >
                Clear selection
              </Button>
            </Space>
          </Card>
        ) : null}

        {pendingDeleteIds.size > 0 ? (
          <Alert
            type="warning"
            showIcon
            message={`${pendingDeleteIds.size} vdev(s) marked for deletion`}
            description="Their member drives will be detached and the vdevs deleted when you apply the review."
            action={
              <Space wrap>
                {Array.from(pendingDeleteIds).map((id) => (
                  <Button
                    key={id}
                    size="small"
                    onClick={() => undoPendingDelete(id)}
                  >
                    Undo {vdevs.find((vdev) => vdev.id === id)?.vdevName ?? ""}
                  </Button>
                ))}
              </Space>
            }
          />
        ) : null}

        {allVdevs.length === 0 ? (
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
            {allVdevs.map((vdev) => {
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
                      {vdev.id.startsWith("local-") ? (
                        <Tag color="gold">Pending create</Tag>
                      ) : null}
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
                      {cap ? (
                        <Tag color={healthColor[cap.health]}>{cap.health}</Tag>
                      ) : null}
                    </Space>
                  }
                  extra={
                    <Space>
                      {!vdev.id.startsWith("local-") ? (
                        <Tooltip title="View configuration history">
                          <Button
                            size="small"
                            icon={<HistoryOutlined />}
                            onClick={() =>
                              openHistory({
                                kind: "vdev",
                                id: vdev.id,
                                name: vdev.vdevName,
                              })
                            }
                          />
                        </Tooltip>
                      ) : null}
                      {canCreateVdev?.can ? (
                        <Popconfirm
                          title={
                            vdev.id.startsWith("local-")
                              ? "Discard this staged vdev?"
                              : "Delete this vdev?"
                          }
                          description={
                            vdev.id.startsWith("local-")
                              ? "The staged vdev has not been created yet."
                              : deferVdevMutations
                                ? "Member drives will be detached and the vdev deleted when you apply the review."
                                : "Only empty vdevs can be deleted."
                          }
                          onConfirm={() => handleDelete(vdev.id)}
                          okText={
                            vdev.id.startsWith("local-") ? "Discard" : "Delete"
                          }
                          okButtonProps={{ danger: true }}
                        >
                          <Button
                            danger
                            size="small"
                            loading={deletingId === vdev.id}
                          >
                            {vdev.id.startsWith("local-")
                              ? "Discard"
                              : "Delete"}
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
                                {canSaveLayout?.can ? (
                                  <Checkbox
                                    checked={selectedDriveIds.has(
                                      member.physicalDriveId,
                                    )}
                                    onChange={() =>
                                      toggleSelection(member.physicalDriveId)
                                    }
                                  />
                                ) : null}
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
            rules={[{ required: true, message: "VDEV name is required" }]}
          >
            <Input maxLength={32} placeholder="e.g. raidz2-0" />
          </Form.Item>
          <Form.Item
            label="Redundancy profile"
            name="redundancyProfileId"
            rules={[{ required: true, message: "Select a profile" }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              loading={profilesQuery.isLoading}
              placeholder={
                compatibleProfiles.length
                  ? "Select profile"
                  : "No compatible profile for this pool type"
              }
              disabled={compatibleProfiles.length === 0}
              options={compatibleProfiles.map((profile) => ({
                value: profile.id,
                label: profile.displayName,
              }))}
            />
          </Form.Item>
          <Form.Item label="VDEV class" name="vdevClass">
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

      <Modal
        open={Boolean(historyScope)}
        title={`${historyScope?.kind === "vdev" ? "VDEV" : "Pool"} configuration history${historyScope ? ` — ${historyScope.name}` : ""}`}
        footer={null}
        width={680}
        onCancel={() => setHistoryScope(null)}
        afterClose={() => setHistoryPage(1)}
        destroyOnHidden
      >
        {historyQuery.query.isLoading ? (
          <Spin />
        ) : (historyQuery.result?.data?.data ?? []).length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No configuration events recorded"
          />
        ) : (
          <>
            <Timeline
              items={(historyQuery.result?.data?.data ?? []).map((event) => ({
                color:
                  event.action === "DELETE"
                    ? "red"
                    : event.action === "CREATE"
                      ? "green"
                      : "blue",
                children: (
                  <Space direction="vertical" size={2}>
                    <Space wrap>
                      <Tag>{event.action}</Tag>
                      <Text type="secondary">
                        {new Date(event.eventTimestamp).toLocaleString()}
                      </Text>
                    </Space>
                    <Text>
                      {snapshotSummary(
                        event.afterSnapshot ?? event.beforeSnapshot,
                      )}
                    </Text>
                    {event.notes ? (
                      <Text type="secondary">{event.notes}</Text>
                    ) : null}
                  </Space>
                ),
              }))}
            />
            <Pagination
              size="small"
              current={
                historyQuery.result?.data?.meta.currentPage ?? historyPage
              }
              pageSize={historyQuery.result?.data?.meta.itemsPerPage ?? 8}
              total={historyQuery.result?.data?.meta.totalItems ?? 0}
              showSizeChanger={false}
              onChange={setHistoryPage}
            />
          </>
        )}
      </Modal>
    </Card>
  );
});

const snapshotSummary = (snapshot: Record<string, unknown> | null) => {
  if (!snapshot) return "No snapshot";
  const profile = snapshot.profileSnapshot as
    { code?: string; technology?: string } | undefined;
  return [
    snapshot.vdevName as string | undefined,
    snapshot.vdevClass as string | undefined,
    profile?.code,
    profile?.technology,
  ]
    .filter(Boolean)
    .join(" · ");
};
