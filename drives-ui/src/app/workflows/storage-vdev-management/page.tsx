"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Breadcrumb,
  Button,
  Card,
  Col,
  Empty,
  Row,
  Select,
  Space,
  Steps,
  Tag,
  Typography,
} from "antd";
import {
  HomeOutlined,
  DatabaseOutlined,
  FolderOpenOutlined,
} from "@ant-design/icons";
import { useApiUrl, useCustom } from "@refinedev/core";
import { LookupSelect } from "@components/lookup-select";
import { useLookupOptions } from "@hooks/use-lookup-options";
import { StoragePoolVdevManager } from "@app/storage-pools/_components/storage-pool-vdev-manager";

const { Text, Title } = Typography;

type HostType = "physical" | "virtual";

interface AttachedPool {
  id: string;
  poolName: string;
  poolTypeId: string;
  encryptionEnabled: boolean;
}

export default function StorageVdevManagementPage() {
  const apiUrl = useApiUrl();
  const [hostType, setHostType] = useState<HostType>("physical");
  const [hostId, setHostId] = useState<string | undefined>();
  const [poolId, setPoolId] = useState<string | undefined>();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get("hostType");
    const id = params.get("hostId");
    if (type === "physical" || type === "virtual") {
      setHostType(type);
    }
    if (id) setHostId(id);
  }, []);

  const { options: poolTypeOptions } = useLookupOptions({
    resource: "pool-types",
  });

  const { result, query } = useCustom<AttachedPool[]>({
    url: `${apiUrl}/storage-pools/attached`,
    method: "get",
    config: {
      query:
        hostType === "physical"
          ? { physicalServerId: hostId }
          : { virtualServerId: hostId },
    },
    queryOptions: { enabled: Boolean(hostId) },
  });

  const pools = useMemo(
    () => (Array.isArray(result?.data) ? result.data : []),
    [result],
  );
  const selectedPool = pools.find((pool) => pool.id === poolId);
  const currentStep = !hostId ? 0 : !poolId ? 1 : 2;

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
          { title: "Storage Vdev Management" },
        ]}
      />

      <Space direction="vertical" size="large" style={{ display: "flex" }}>
        <Card>
          <Steps
            current={currentStep}
            items={[
              { title: "Select server" },
              { title: "Select pool" },
              { title: "Manage vdevs" },
            ]}
          />
        </Card>

        <Card
          title={
            <Space>
              <DatabaseOutlined /> Host &amp; pool
            </Space>
          }
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Text strong>Host type</Text>
              <Select
                style={{ width: "100%", marginTop: 8 }}
                value={hostType}
                onChange={(value) => {
                  setHostType(value as HostType);
                  setHostId(undefined);
                  setPoolId(undefined);
                }}
                options={[
                  { value: "physical", label: "Physical server" },
                  { value: "virtual", label: "Virtual server" },
                ]}
              />
            </Col>
            <Col xs={24} md={8}>
              <Text strong>Server</Text>
              <div style={{ marginTop: 8 }}>
                <LookupSelect
                  key={hostType}
                  resource={
                    hostType === "physical"
                      ? "physical-servers"
                      : "virtual-servers"
                  }
                  optionLabel="hostname"
                  placeholder="Select a server"
                  value={hostId}
                  style={{ width: "100%" }}
                  onChange={(value) => {
                    setHostId(value as string);
                    setPoolId(undefined);
                  }}
                />
              </div>
            </Col>
            <Col xs={24} md={8}>
              <Text strong>Storage pool</Text>
              <Select
                style={{ width: "100%", marginTop: 8 }}
                placeholder={
                  hostId ? "Select an attached pool" : "Select a server first"
                }
                disabled={!hostId || query.isLoading}
                loading={query.isLoading}
                value={poolId}
                onChange={(value) => setPoolId(value)}
                options={pools.map((pool) => ({
                  value: pool.id,
                  label: pool.poolName,
                }))}
              />
            </Col>
          </Row>

          {hostId && !query.isLoading && pools.length === 0 ? (
            <Empty
              style={{ marginTop: 24 }}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No storage pools are currently attached to this server"
            />
          ) : null}

          {selectedPool ? (
            <Space direction="vertical" size={4} style={{ marginTop: 16 }}>
              <Space wrap>
                <Tag color="blue">{selectedPool.poolName}</Tag>
                <Tag>
                  {poolTypeOptions.find(
                    (option) => option.value === selectedPool.poolTypeId,
                  )?.label ?? "Storage pool"}
                </Tag>
                <Tag
                  color={selectedPool.encryptionEnabled ? "green" : "default"}
                >
                  {selectedPool.encryptionEnabled ? "Encrypted" : "Plain"}
                </Tag>
              </Space>
              <Link href={`/storage-pools/show/${selectedPool.id}`}>
                <Button type="link" icon={<FolderOpenOutlined />}>
                  Open pool details
                </Button>
              </Link>
            </Space>
          ) : null}
        </Card>

        {poolId ? (
          <StoragePoolVdevManager
            poolId={poolId}
            poolTypeId={selectedPool?.poolTypeId}
          />
        ) : (
          <Card>
            <Title level={5} style={{ marginTop: 0 }}>
              Select a pool to manage its vdevs
            </Title>
            <Text type="secondary">
              Once a pool is selected, you can create vdevs, add or remove
              member drives, move drives between vdevs, and save the complete
              layout in one transaction.
            </Text>
          </Card>
        )}
      </Space>
    </div>
  );
}
