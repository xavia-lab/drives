"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Alert,
  App,
  Breadcrumb,
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Input,
  Radio,
  Row,
  Select,
  Space,
  Steps,
  Switch,
  Table,
  Tag,
  Typography,
} from "antd";
import {
  HomeOutlined,
  DatabaseOutlined,
  FolderOpenOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import {
  useApiUrl,
  useCustom,
  useCustomMutation,
  useList,
} from "@refinedev/core";
import { useLookupOptions } from "@hooks/use-lookup-options";
import {
  StoragePoolVdevManager,
  type StoragePoolVdevManagerHandle,
  type VdevLayoutReview,
} from "@app/storage-pools/_components/storage-pool-vdev-manager";

const { Text, Title } = Typography;

type HostType = "physical" | "virtual";
type PoolMode = "existing" | "new";

interface DatacenterRecord {
  id: string;
  code: string;
  name: string;
}

interface RackRecord {
  id: string;
  datacenterId: string;
}

interface PhysicalServerRecord {
  id: string;
  hostname: string;
  rackId: string;
}

interface VirtualServerRecord {
  id: string;
  hostname: string;
  hostServerId: string;
}

interface AttachedPool {
  id: string;
  poolName: string;
  poolTypeId: string;
  encryptionEnabled: boolean;
}

const HOST_TYPE_LABELS: Record<HostType, string> = {
  physical: "Physical server",
  virtual: "Virtual server",
};

export default function StorageVdevManagementPage() {
  const apiUrl = useApiUrl();
  const router = useRouter();
  const { message } = App.useApp();
  const { mutateAsync: createPool } = useCustomMutation();
  const managerRef = useRef<StoragePoolVdevManagerHandle | null>(null);

  const [currentStep, setCurrentStep] = useState(0);
  const [datacenterId, setDatacenterId] = useState<string>();
  const [hostType, setHostType] = useState<HostType>("physical");
  const [hostId, setHostId] = useState<string>();
  const [poolMode, setPoolMode] = useState<PoolMode>("existing");
  const [poolId, setPoolId] = useState<string>();
  const [newPoolName, setNewPoolName] = useState("");
  const [newPoolTypeId, setNewPoolTypeId] = useState<string>();
  const [newPoolEncrypted, setNewPoolEncrypted] = useState(false);
  const [layoutDirty, setLayoutDirty] = useState(false);
  const [layoutReview, setLayoutReview] = useState<VdevLayoutReview | null>(
    null,
  );
  const [saving, setSaving] = useState(false);
  const linkedDatacenterApplied = useRef(false);

  const { query: datacentersQuery } = useList<DatacenterRecord>({
    resource: "datacenters",
    pagination: { mode: "server", currentPage: 1, pageSize: 250 },
  });
  const { query: racksQuery } = useList<RackRecord>({
    resource: "racks",
    pagination: { mode: "server", currentPage: 1, pageSize: 250 },
  });
  const { query: physicalServersQuery } = useList<PhysicalServerRecord>({
    resource: "physical-servers",
    pagination: { mode: "server", currentPage: 1, pageSize: 250 },
  });
  const { query: virtualServersQuery } = useList<VirtualServerRecord>({
    resource: "virtual-servers",
    pagination: { mode: "server", currentPage: 1, pageSize: 250 },
  });

  const { options: poolTypeOptions } = useLookupOptions({
    resource: "pool-types",
  });

  const datacenters = useMemo(
    () => datacentersQuery.data?.data ?? [],
    [datacentersQuery.data?.data],
  );
  const datacenterOptions = useMemo(
    () =>
      datacenters.map((datacenter) => ({
        value: datacenter.id,
        label: [datacenter.code, datacenter.name].filter(Boolean).join(" — "),
      })),
    [datacenters],
  );
  const racks = useMemo(
    () => racksQuery.data?.data ?? [],
    [racksQuery.data?.data],
  );
  const physicalServers = useMemo(
    () => physicalServersQuery.data?.data ?? [],
    [physicalServersQuery.data?.data],
  );
  const virtualServers = useMemo(
    () => virtualServersQuery.data?.data ?? [],
    [virtualServersQuery.data?.data],
  );

  const rackById = useMemo(
    () => new Map(racks.map((rack) => [rack.id, rack])),
    [racks],
  );
  const physicalServerById = useMemo(
    () => new Map(physicalServers.map((server) => [server.id, server])),
    [physicalServers],
  );
  const physicalServersInDatacenter = useMemo(
    () =>
      physicalServers.filter(
        (server) =>
          !!datacenterId &&
          rackById.get(server.rackId)?.datacenterId === datacenterId,
      ),
    [datacenterId, physicalServers, rackById],
  );
  const virtualServersInDatacenter = useMemo(
    () =>
      virtualServers.filter((server) => {
        if (!datacenterId) return false;
        const host = physicalServerById.get(server.hostServerId);
        return (
          !!host && rackById.get(host.rackId)?.datacenterId === datacenterId
        );
      }),
    [datacenterId, physicalServerById, rackById, virtualServers],
  );
  const hostOptions = useMemo(() => {
    const servers =
      hostType === "physical"
        ? physicalServersInDatacenter
        : virtualServersInDatacenter;
    return servers.map((server) => ({
      value: server.id,
      label: server.hostname,
    }));
  }, [hostType, physicalServersInDatacenter, virtualServersInDatacenter]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get("hostType");
    const id = params.get("hostId");
    if (type === "physical" || type === "virtual") setHostType(type);
    if (id) setHostId(id);
  }, []);

  // Support deep links that arrive with a host id but no datacenter.
  useEffect(() => {
    if (!hostId || datacenterId || linkedDatacenterApplied.current) return;
    if (!physicalServers.length || !racks.length) return;
    const host =
      hostType === "physical"
        ? physicalServerById.get(hostId)
        : physicalServerById.get(
            virtualServers.find((server) => server.id === hostId)
              ?.hostServerId ?? "",
          );
    const rack = host ? rackById.get(host.rackId) : undefined;
    if (rack?.datacenterId) {
      linkedDatacenterApplied.current = true;
      setDatacenterId(rack.datacenterId);
    }
  }, [
    datacenterId,
    hostId,
    hostType,
    physicalServerById,
    physicalServers.length,
    rackById,
    racks.length,
    virtualServers,
  ]);

  const attachedPoolUrl = hostId
    ? `${apiUrl}/storage-pools/attached?${
        hostType === "physical"
          ? `physicalServerId=${encodeURIComponent(hostId)}`
          : `virtualServerId=${encodeURIComponent(hostId)}`
      }`
    : "";
  const { result, query } = useCustom<AttachedPool[]>({
    url: attachedPoolUrl,
    method: "get",
    queryOptions: { enabled: Boolean(hostId) },
  });
  const pools = useMemo(
    () => (Array.isArray(result?.data) ? result.data : []),
    [result],
  );
  const selectedPool = pools.find((pool) => pool.id === poolId);
  const selectedDatacenter = datacenters.find(
    (datacenter) => datacenter.id === datacenterId,
  );
  const selectedHost = hostOptions.find((option) => option.value === hostId);

  const resetPool = () => {
    setPoolId(undefined);
    setLayoutDirty(false);
    setLayoutReview(null);
  };
  const resetHost = () => {
    setHostId(undefined);
    resetPool();
  };

  const canAdvance = (step: number): boolean => {
    if (step === 0) return Boolean(datacenterId);
    if (step === 1) return Boolean(hostId);
    if (step === 2) {
      return poolMode === "existing"
        ? Boolean(poolId)
        : Boolean(newPoolName.trim() && newPoolTypeId);
    }
    return true;
  };

  const goNext = () => {
    if (!canAdvance(currentStep)) {
      const messageText =
        currentStep === 0
          ? "Select a datacenter first"
          : currentStep === 1
            ? "Select a server first"
            : poolMode === "existing"
              ? "Select an attached pool"
              : "Enter a pool name and type";
      message.warning(messageText);
      return;
    }
    setCurrentStep((step) => Math.min(step + 1, 3));
  };

  const handleFinish = async () => {
    if (!canAdvance(2)) {
      message.warning("Complete the pool selection first");
      return;
    }

    setSaving(true);
    try {
      if (poolMode === "existing") {
        if (!poolId) return;
        if (layoutDirty) {
          const saved = await managerRef.current?.save();
          if (!saved) return;
        }
        router.push(`/storage-pools/show/${poolId}`);
        return;
      }

      const created = await createPool({
        url: `${apiUrl}/storage-pools`,
        method: "post",
        values: {
          poolName: newPoolName.trim(),
          poolTypeId: newPoolTypeId,
          encryptionEnabled: newPoolEncrypted,
          ...(hostType === "physical"
            ? { serverId: hostId }
            : { virtualServerId: hostId }),
        },
      });
      const pool = created.data as { id?: string } | undefined;
      message.success("Storage pool created");
      router.push(
        pool?.id ? `/storage-pools/show/${pool.id}` : "/storage-pools",
      );
    } catch (error) {
      const detail = (error as { message?: string | string[] })?.message;
      message.error(
        Array.isArray(detail)
          ? detail.join(", ")
          : (detail ?? "Could not apply the storage changes"),
      );
    } finally {
      setSaving(false);
    }
  };

  const stepItems = [
    { title: "Datacenter" },
    { title: "Server" },
    { title: "Pool" },
    { title: "Review" },
  ];

  return (
    <div>
      <Breadcrumb
        style={{ marginBottom: 16 }}
        items={[
          {
            title: (
              <Link href="/">
                <HomeOutlined />
              </Link>
            ),
          },
          { title: <Link href="/dashboard">Dashboard</Link> },
          { title: "Storage Management" },
        ]}
      />

      <Space direction="vertical" size="large" style={{ display: "flex" }}>
        <Card>
          <Steps
            current={currentStep}
            items={stepItems}
            onChange={(step) => {
              if (step < currentStep) setCurrentStep(step);
            }}
          />
        </Card>

        {currentStep === 0 ? (
          <Card
            title={
              <Space>
                <DatabaseOutlined /> Select datacenter
              </Space>
            }
          >
            <Text type="secondary">
              Start by choosing the datacenter that contains the server hosting
              the storage pool.
            </Text>
            <Select
              showSearch
              optionFilterProp="label"
              style={{ width: "100%", marginTop: 16 }}
              placeholder="Select a datacenter"
              loading={datacentersQuery.isLoading}
              value={datacenterId}
              options={datacenterOptions}
              onChange={(value) => {
                setDatacenterId(value);
                resetHost();
              }}
            />
          </Card>
        ) : null}

        {currentStep === 1 ? (
          <Card
            title={
              <Space>
                <ReloadOutlined /> Select server
              </Space>
            }
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}>
                <Text strong>Server type</Text>
                <Select
                  style={{ width: "100%", marginTop: 8 }}
                  value={hostType}
                  onChange={(value: HostType) => {
                    setHostType(value);
                    resetHost();
                  }}
                  options={[
                    { value: "physical", label: "Physical server" },
                    { value: "virtual", label: "Virtual server" },
                  ]}
                />
              </Col>
              <Col xs={24} md={16}>
                <Text strong>Server</Text>
                <Select
                  showSearch
                  optionFilterProp="label"
                  style={{ width: "100%", marginTop: 8 }}
                  placeholder={`Select a ${hostType} server in ${selectedDatacenter?.name ?? "the datacenter"}`}
                  loading={
                    hostType === "physical"
                      ? physicalServersQuery.isLoading
                      : virtualServersQuery.isLoading
                  }
                  value={hostId}
                  options={hostOptions}
                  onChange={(value) => {
                    setHostId(value);
                    resetPool();
                  }}
                />
              </Col>
            </Row>
            {hostOptions.length === 0 ? (
              <Empty
                style={{ marginTop: 24 }}
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={`No ${hostType} servers found in this datacenter`}
              />
            ) : null}
          </Card>
        ) : null}

        {currentStep === 2 ? (
          <Card
            title={
              <Space>
                <FolderOpenOutlined /> Select or create a storage pool
              </Space>
            }
          >
            <Radio.Group
              value={poolMode}
              onChange={(event) => {
                setPoolMode(event.target.value as PoolMode);
                resetPool();
              }}
              options={[
                { value: "existing", label: "Use an attached pool" },
                { value: "new", label: "Create a new pool" },
              ]}
              optionType="button"
              buttonStyle="solid"
              style={{ marginBottom: 16 }}
            />

            {poolMode === "existing" ? (
              <Space
                direction="vertical"
                size="middle"
                style={{ display: "flex" }}
              >
                <Select
                  style={{ width: "100%" }}
                  placeholder={
                    hostId ? "Select an attached pool" : "Select a server first"
                  }
                  disabled={!hostId || query.isLoading}
                  loading={query.isLoading}
                  value={poolId}
                  onChange={(value) => {
                    setPoolId(value);
                    setLayoutDirty(false);
                    setLayoutReview(null);
                  }}
                  options={pools.map((pool) => ({
                    value: pool.id,
                    label: pool.poolName,
                  }))}
                />
                {hostId && !query.isLoading && pools.length === 0 ? (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="No storage pools are currently attached to this server. Create a new pool instead."
                  />
                ) : null}
                {selectedPool ? (
                  <Space wrap>
                    <Tag color="blue">{selectedPool.poolName}</Tag>
                    <Tag>
                      {poolTypeOptions.find(
                        (option) => option.value === selectedPool.poolTypeId,
                      )?.label ?? "Storage pool"}
                    </Tag>
                    <Tag
                      color={
                        selectedPool.encryptionEnabled ? "green" : "default"
                      }
                    >
                      {selectedPool.encryptionEnabled ? "Encrypted" : "Plain"}
                    </Tag>
                    <Link href={`/storage-pools/show/${selectedPool.id}`}>
                      <Button type="link" icon={<FolderOpenOutlined />}>
                        Open pool details
                      </Button>
                    </Link>
                  </Space>
                ) : null}
              </Space>
            ) : (
              <Space
                direction="vertical"
                size="middle"
                style={{ display: "flex" }}
              >
                <Alert
                  type="info"
                  showIcon
                  message="The pool will be created on the final review step"
                  description="It will be attached to the selected host in the same transaction. You can add vdevs and drives from the pool page immediately afterwards."
                />
                <div>
                  <Text strong>Pool name</Text>
                  <Input
                    style={{ marginTop: 8 }}
                    maxLength={64}
                    placeholder="e.g. tank-nvme"
                    value={newPoolName}
                    onChange={(event) => setNewPoolName(event.target.value)}
                  />
                </div>
                <div>
                  <Text strong>Pool type</Text>
                  <Select
                    style={{ width: "100%", marginTop: 8 }}
                    placeholder="Select a pool type"
                    value={newPoolTypeId}
                    options={poolTypeOptions}
                    onChange={setNewPoolTypeId}
                  />
                </div>
                <Space>
                  <Switch
                    checked={newPoolEncrypted}
                    onChange={setNewPoolEncrypted}
                  />
                  <Text>Encryption enabled</Text>
                </Space>
              </Space>
            )}
          </Card>
        ) : null}

        {poolMode === "existing" && poolId ? (
          <div style={{ display: currentStep === 2 ? "block" : "none" }}>
            <StoragePoolVdevManager
              ref={managerRef}
              poolId={poolId}
              poolTypeId={selectedPool?.poolTypeId}
              showSaveButton={false}
              deferVdevMutations
              onDirtyChange={setLayoutDirty}
              onReviewChange={setLayoutReview}
            />
          </div>
        ) : null}

        {currentStep === 3 ? (
          <Card title="Review changes">
            <Space
              direction="vertical"
              size="middle"
              style={{ display: "flex" }}
            >
              <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="Datacenter" span={2}>
                  {selectedDatacenter
                    ? `${selectedDatacenter.code} — ${selectedDatacenter.name}`
                    : "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Server type">
                  {HOST_TYPE_LABELS[hostType]}
                </Descriptions.Item>
                <Descriptions.Item label="Server">
                  {selectedHost?.label ?? "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Pool action">
                  {poolMode === "existing"
                    ? "Use existing pool"
                    : "Create new pool"}
                </Descriptions.Item>
                <Descriptions.Item label="Pool">
                  {poolMode === "existing"
                    ? (selectedPool?.poolName ?? "-")
                    : newPoolName.trim() || "-"}
                </Descriptions.Item>
                {poolMode === "new" ? (
                  <>
                    <Descriptions.Item label="Pool type">
                      {poolTypeOptions.find(
                        (option) => option.value === newPoolTypeId,
                      )?.label ?? "-"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Encryption">
                      {newPoolEncrypted ? "Enabled" : "Disabled"}
                    </Descriptions.Item>
                  </>
                ) : (
                  <Descriptions.Item label="Pending vdev changes" span={2}>
                    {layoutDirty ? (
                      <Tag color="orange">Pending changes</Tag>
                    ) : (
                      <Tag color="green">No pending changes</Tag>
                    )}
                  </Descriptions.Item>
                )}
              </Descriptions>

              {poolMode === "existing" && layoutReview ? (
                <Table
                  size="small"
                  rowKey="id"
                  pagination={false}
                  dataSource={layoutReview.items}
                  columns={[
                    {
                      title: "VDEV",
                      dataIndex: "name",
                    },
                    {
                      title: "Action",
                      dataIndex: "action",
                      width: 120,
                      render: (action: string) => (
                        <Tag
                          color={
                            action === "CREATE"
                              ? "green"
                              : action === "DELETE"
                                ? "red"
                                : action === "UPDATE"
                                  ? "orange"
                                  : "default"
                          }
                        >
                          {action}
                        </Tag>
                      ),
                    },
                    {
                      title: "Current layout",
                      render: (_, item) =>
                        item.before.length
                          ? item.before.map((drive) => drive.label).join(", ")
                          : "-",
                    },
                    {
                      title: "New layout",
                      render: (_, item) =>
                        item.after.length
                          ? item.after.map((drive) => drive.label).join(", ")
                          : "-",
                    },
                  ]}
                />
              ) : null}

              {poolMode === "existing" ? (
                <Alert
                  type={layoutDirty ? "warning" : "info"}
                  showIcon
                  message={
                    layoutDirty
                      ? "The pending vdev layout, staged creates and staged deletes will be committed."
                      : "No vdev changes are pending."
                  }
                />
              ) : (
                <Alert
                  type="info"
                  showIcon
                  message="The new pool and its initial host attachment will be created in one transaction."
                />
              )}
            </Space>
          </Card>
        ) : null}

        <Card>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <Button
              disabled={currentStep === 0 || saving}
              onClick={() => setCurrentStep((step) => Math.max(step - 1, 0))}
            >
              Back
            </Button>
            {currentStep < 3 ? (
              <Button type="primary" onClick={goNext}>
                Next
              </Button>
            ) : (
              <Button type="primary" loading={saving} onClick={handleFinish}>
                {poolMode === "existing"
                  ? layoutDirty
                    ? "Apply vdev changes"
                    : "Finish"
                  : "Create storage pool"}
              </Button>
            )}
          </div>
        </Card>

        {!datacenterId && currentStep > 0 ? (
          <Card>
            <Title level={5}>Select a datacenter first</Title>
          </Card>
        ) : null}
      </Space>
    </div>
  );
}
