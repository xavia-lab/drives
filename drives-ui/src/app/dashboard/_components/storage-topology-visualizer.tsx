"use client";

import { useMemo, useState } from "react";
import { useApiUrl, useCustom, useList } from "@refinedev/core";
import {
  Alert,
  Badge,
  Button,
  Col,
  Empty,
  Row,
  Select,
  Skeleton,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  theme,
} from "antd";
import {
  ClusterOutlined,
  DatabaseOutlined,
  HddOutlined,
  PartitionOutlined,
  ReloadOutlined,
  SwapOutlined,
} from "@ant-design/icons";
import { InsightCard } from "./insight-card";

const { Text } = Typography;

type HostType = "PHYSICAL" | "VIRTUAL";

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

interface TopologyMapping {
  poolId: string;
  poolName: string;
  poolTypeName: string;
  poolOwnerType: string;
  poolOwnerName: string;
  vdevId: string;
  vdevName: string;
  vdevClass: string;
  vdevHealth: string | null;
  memberRole: string;
  memberIndex: number;
  groupIndex: number | null;
}

interface TopologySlot {
  id: string;
  slotLabel: string;
  pcieBusAddress: string | null;
  interfaceId: string;
  interfaceName: string;
  occupancy: {
    allocationId: string;
    physicalDriveId: string;
    label: string;
    serialNumber: string;
    driveModelId: string;
    driveModelName: string | null;
    mapping: TopologyMapping | null;
  } | null;
  passthrough: {
    virtualServerId: string;
    hostname: string;
    isSelectedHost: boolean;
  } | null;
}

interface TopologyPoolMember {
  physicalDriveId: string;
  label: string;
  serialNumber: string;
  slotLabel: string | null;
}

interface TopologyVdev {
  id: string;
  vdevName: string;
  vdevClass: string;
  health: string | null;
  memberCount: number;
  members: TopologyPoolMember[];
}

interface TopologyPool {
  id: string;
  poolName: string;
  poolTypeName: string;
  ownerType: string;
  ownerName: string;
  vdevs: TopologyVdev[];
}

interface TopologyResponse {
  datacenter: { id: string; code: string; name: string };
  host: {
    type: HostType;
    id: string;
    hostname: string;
    hostServerId: string | null;
    hostServerHostname: string | null;
    rackName: string | null;
  };
  slots: TopologySlot[];
  pools: TopologyPool[];
  summary: {
    totalSlots: number;
    occupiedSlots: number;
    emptySlots: number;
    mappedDrives: number;
    unmappedDrives: number;
    passthroughSlots: number;
    poolCount: number;
    vdevCount: number;
  };
}

const healthColor: Record<string, string> = {
  ONLINE: "green",
  PLANNED: "default",
  UNKNOWN: "default",
  INCOMPLETE: "orange",
  DEGRADED: "gold",
  FAILED: "red",
};

const slotStatus = (slot: TopologySlot) => {
  if (!slot.occupancy) return { label: "Empty", color: "default" };
  if (slot.occupancy.mapping) return { label: "Mapped", color: "green" };
  return { label: "Drive only", color: "orange" };
};

export const StorageTopologyVisualizer = () => {
  const apiUrl = useApiUrl();
  const { token } = theme.useToken();
  const [datacenterId, setDatacenterId] = useState<string>();
  const [hostType, setHostType] = useState<HostType>("PHYSICAL");
  const [hostId, setHostId] = useState<string>();

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

  const datacenters = useMemo(
    () => datacentersQuery.data?.data ?? [],
    [datacentersQuery.data?.data],
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
  const hostOptions = useMemo(() => {
    if (!datacenterId) return [];
    if (hostType === "PHYSICAL") {
      return physicalServers
        .filter(
          (server) =>
            rackById.get(server.rackId)?.datacenterId === datacenterId,
        )
        .map((server) => ({ value: server.id, label: server.hostname }));
    }
    return virtualServers
      .filter((server) => {
        const host = physicalServerById.get(server.hostServerId);
        return host && rackById.get(host.rackId)?.datacenterId === datacenterId;
      })
      .map((server) => ({ value: server.id, label: server.hostname }));
  }, [
    datacenterId,
    hostType,
    physicalServerById,
    physicalServers,
    rackById,
    virtualServers,
  ]);

  const topologyUrl =
    datacenterId && hostId
      ? `${apiUrl}/dashboard/storage-topology?datacenterId=${encodeURIComponent(datacenterId)}&hostType=${hostType}&hostId=${encodeURIComponent(hostId)}`
      : "";
  const { query, result } = useCustom<TopologyResponse>({
    url: topologyUrl,
    method: "get",
    queryOptions: {
      enabled: Boolean(datacenterId && hostId),
      refetchOnWindowFocus: false,
    },
  });

  const raw = result?.data as Partial<TopologyResponse> | undefined;
  const topology =
    raw?.host && Array.isArray(raw.slots) && raw.summary
      ? (raw as TopologyResponse)
      : undefined;

  const groupedSlots = useMemo(() => {
    if (!topology) return [];
    const groups = new Map<string, TopologySlot[]>();
    for (const slot of topology.slots) {
      const list = groups.get(slot.interfaceName) ?? [];
      list.push(slot);
      groups.set(slot.interfaceName, list);
    }
    return Array.from(groups.entries()).map(([interfaceName, slots]) => ({
      interfaceName,
      slots,
    }));
  }, [topology]);

  const resetHost = () => {
    setHostId(undefined);
  };

  return (
    <InsightCard
      title="Server & Storage Topology"
      subtitle="Backplane slots, passthrough devices and their pool/vdev placement"
      icon={<ClusterOutlined />}
      extra={
        query.isFetching ? (
          <Tag color="processing">Refreshing</Tag>
        ) : topology ? (
          <Tag color="blue">{topology.host.hostname}</Tag>
        ) : undefined
      }
    >
      <Space direction="vertical" size={16} style={{ display: "flex" }}>
        <Row gutter={[12, 12]}>
          <Col xs={24} md={8}>
            <Text strong>Datacenter</Text>
            <Select
              showSearch
              optionFilterProp="label"
              style={{ width: "100%", marginTop: 6 }}
              placeholder="Select a datacenter"
              loading={datacentersQuery.isLoading}
              value={datacenterId}
              options={datacenters.map((datacenter) => ({
                value: datacenter.id,
                label: [datacenter.code, datacenter.name]
                  .filter(Boolean)
                  .join(" — "),
              }))}
              onChange={(value) => {
                setDatacenterId(value);
                resetHost();
              }}
            />
          </Col>
          <Col xs={12} md={4}>
            <Text strong>Host type</Text>
            <Select
              style={{ width: "100%", marginTop: 6 }}
              value={hostType}
              onChange={(value: HostType) => {
                setHostType(value);
                resetHost();
              }}
              options={[
                { value: "PHYSICAL", label: "Physical" },
                { value: "VIRTUAL", label: "Virtual" },
              ]}
            />
          </Col>
          <Col xs={12} md={8}>
            <Text strong>Server</Text>
            <Select
              showSearch
              optionFilterProp="label"
              style={{ width: "100%", marginTop: 6 }}
              placeholder={
                datacenterId ? "Select a server" : "Select a datacenter first"
              }
              disabled={!datacenterId}
              loading={
                hostType === "PHYSICAL"
                  ? physicalServersQuery.isLoading
                  : virtualServersQuery.isLoading
              }
              value={hostId}
              options={hostOptions}
              onChange={setHostId}
            />
          </Col>
          <Col xs={24} md={4}>
            <Text strong>Refresh</Text>
            <div style={{ marginTop: 6 }}>
              <Tooltip title="Reload topology">
                <Button
                  icon={<ReloadOutlined />}
                  disabled={!datacenterId || !hostId}
                  loading={query.isFetching}
                  onClick={() => query.refetch()}
                >
                  Refresh
                </Button>
              </Tooltip>
            </div>
          </Col>
        </Row>

        {!datacenterId || !hostId ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Select a datacenter and server to visualise its slots and storage mapping"
          />
        ) : query.isLoading ? (
          <Skeleton active paragraph={{ rows: 8 }} />
        ) : query.isError || !topology ? (
          <Alert
            type="error"
            showIcon
            message="Could not load the server topology"
            description="The topology request failed. Check the API and try again."
            action={
              <Button size="small" onClick={() => query.refetch()}>
                Retry
              </Button>
            }
          />
        ) : (
          <>
            {topology.host.type === "VIRTUAL" &&
            topology.host.hostServerHostname ? (
              <Alert
                type="info"
                showIcon
                message={`Showing the host backplane of ${topology.host.hostServerHostname} for guest ${topology.host.hostname}`}
                description="Slots marked as passthrough are mapped into this virtual server."
              />
            ) : null}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                gap: 10,
              }}
            >
              {[
                ["Slots", topology.summary.totalSlots],
                ["Occupied", topology.summary.occupiedSlots],
                ["Mapped", topology.summary.mappedDrives],
                ["Unmapped", topology.summary.unmappedDrives],
                ["Passthrough", topology.summary.passthroughSlots],
                ["Pools", topology.summary.poolCount],
                ["Vdevs", topology.summary.vdevCount],
              ].map(([label, value]) => (
                <div
                  key={String(label)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: token.borderRadiusLG,
                    background: token.colorFillQuaternary,
                  }}
                >
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {label}
                  </Text>
                  <div style={{ fontSize: 20, fontWeight: 600 }}>{value}</div>
                </div>
              ))}
            </div>

            <Space wrap size={12}>
              <Badge color="green" text="Mapped to VDEV" />
              <Badge color="orange" text="Drive without VDEV" />
              <Badge color="default" text="Empty slot" />
              <Badge color="purple" text="Passthrough" />
            </Space>

            <Row gutter={[16, 16]}>
              {groupedSlots.map((group) => (
                <Col xs={24} key={group.interfaceName}>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>
                    {group.interfaceName}{" "}
                    <Tag style={{ marginLeft: 6 }}>{group.slots.length}</Tag>
                  </div>
                  <Row gutter={[10, 10]}>
                    {group.slots.map((slot) => {
                      const status = slotStatus(slot);
                      const mapped = slot.occupancy?.mapping;
                      return (
                        <Col xs={24} sm={12} lg={8} xl={6} key={slot.id}>
                          <div
                            style={{
                              height: "100%",
                              padding: 12,
                              borderRadius: token.borderRadiusLG,
                              border: `1px solid ${
                                status.color === "green"
                                  ? token.colorSuccessBorder
                                  : status.color === "orange"
                                    ? token.colorWarningBorder
                                    : token.colorBorderSecondary
                              }`,
                              background:
                                status.color === "green"
                                  ? token.colorSuccessBg
                                  : status.color === "orange"
                                    ? token.colorWarningBg
                                    : token.colorFillQuaternary,
                            }}
                          >
                            <Space
                              direction="vertical"
                              size={6}
                              style={{ display: "flex" }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  gap: 8,
                                }}
                              >
                                <Text strong>{slot.slotLabel}</Text>
                                <Tag color={status.color}>{status.label}</Tag>
                              </div>
                              {slot.occupancy ? (
                                <>
                                  <Text
                                    strong
                                    ellipsis
                                    style={{ display: "block" }}
                                  >
                                    {slot.occupancy.label ||
                                      slot.occupancy.serialNumber ||
                                      "Unknown drive"}
                                  </Text>
                                  <Text
                                    type="secondary"
                                    style={{ fontSize: 12 }}
                                  >
                                    {[
                                      slot.occupancy.serialNumber,
                                      slot.occupancy.driveModelName,
                                    ]
                                      .filter(Boolean)
                                      .join(" · ")}
                                  </Text>
                                  {mapped ? (
                                    <Space wrap size={4}>
                                      <Tag color="blue">{mapped.poolName}</Tag>
                                      <Tag color="geekblue">
                                        {mapped.vdevName}
                                      </Tag>
                                      <Tag>{mapped.vdevClass}</Tag>
                                      {mapped.vdevHealth ? (
                                        <Tag
                                          color={
                                            healthColor[mapped.vdevHealth] ??
                                            "default"
                                          }
                                        >
                                          {mapped.vdevHealth}
                                        </Tag>
                                      ) : null}
                                    </Space>
                                  ) : (
                                    <Tag color="orange">No VDEV mapping</Tag>
                                  )}
                                </>
                              ) : (
                                <Text type="secondary">No drive seated</Text>
                              )}
                              {slot.passthrough ? (
                                <Tag color="purple" icon={<SwapOutlined />}>
                                  Passthrough → {slot.passthrough.hostname}
                                </Tag>
                              ) : null}
                              {slot.pcieBusAddress ? (
                                <Text
                                  type="secondary"
                                  style={{
                                    fontSize: 11,
                                    fontFamily: "monospace",
                                  }}
                                >
                                  {slot.pcieBusAddress}
                                </Text>
                              ) : null}
                            </Space>
                          </div>
                        </Col>
                      );
                    })}
                  </Row>
                </Col>
              ))}
            </Row>

            <div>
              <Text strong>Storage mapping</Text>
              {topology.pools.length === 0 ? (
                <Empty
                  style={{ marginTop: 12 }}
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No storage pools are attached to this host"
                />
              ) : (
                <Space
                  direction="vertical"
                  size={10}
                  style={{ display: "flex", marginTop: 10 }}
                >
                  {topology.pools.map((pool) => (
                    <div
                      key={pool.id}
                      style={{
                        padding: 12,
                        borderRadius: token.borderRadiusLG,
                        border: `1px solid ${token.colorBorderSecondary}`,
                      }}
                    >
                      <Space wrap>
                        <DatabaseOutlined />
                        <Text strong>{pool.poolName}</Text>
                        <Tag>{pool.poolTypeName}</Tag>
                        <Tag
                          color={
                            pool.ownerType === "PHYSICAL" ? "blue" : "purple"
                          }
                        >
                          {pool.ownerType === "PHYSICAL"
                            ? "Physical"
                            : "Virtual"}{" "}
                          · {pool.ownerName}
                        </Tag>
                      </Space>
                      {pool.vdevs.length === 0 ? (
                        <Text
                          type="secondary"
                          style={{ display: "block", marginTop: 8 }}
                        >
                          No vdevs in this pool
                        </Text>
                      ) : (
                        <Table
                          style={{ marginTop: 8 }}
                          size="small"
                          rowKey="id"
                          pagination={false}
                          dataSource={pool.vdevs}
                          columns={[
                            {
                              title: "VDEV",
                              dataIndex: "vdevName",
                              render: (value: string) => (
                                <Space size={4}>
                                  <PartitionOutlined />
                                  <Text strong>{value}</Text>
                                </Space>
                              ),
                            },
                            {
                              title: "Class",
                              dataIndex: "vdevClass",
                              width: 100,
                              render: (value: string) => <Tag>{value}</Tag>,
                            },
                            {
                              title: "Health",
                              dataIndex: "health",
                              width: 120,
                              render: (value: string | null) =>
                                value ? (
                                  <Tag color={healthColor[value] ?? "default"}>
                                    {value}
                                  </Tag>
                                ) : (
                                  "-"
                                ),
                            },
                            {
                              title: "Members",
                              render: (_, vdev: TopologyVdev) =>
                                vdev.members.length === 0 ? (
                                  <Text type="secondary">None</Text>
                                ) : (
                                  <Space wrap size={4}>
                                    {vdev.members.map((member) => (
                                      <Tag
                                        key={member.physicalDriveId}
                                        icon={<HddOutlined />}
                                      >
                                        {member.label || member.serialNumber}
                                        {member.slotLabel
                                          ? ` · ${member.slotLabel}`
                                          : ""}
                                      </Tag>
                                    ))}
                                  </Space>
                                ),
                            },
                          ]}
                        />
                      )}
                    </div>
                  ))}
                </Space>
              )}
            </div>
          </>
        )}
      </Space>
    </InsightCard>
  );
};
