"use client";

import { DateField, Show } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { LinkedLabel } from "@components/linked-label";
import { AttachedStoragePools } from "@components/attached-storage-pools";
import { useLookupOptions } from "@hooks/use-lookup-options";
import {
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Row,
  Space,
  Tree,
  Typography,
} from "antd";
import { DeploymentUnitOutlined } from "@ant-design/icons";
import Link from "next/link";
import type { DataNode } from "antd/es/tree";

const { Text } = Typography;

type ServerSlotRecord = {
  id: string;
  slotLabel: string;
  supportedInterfaceId: string;
  pcieBusAddress?: string | null;
};

export default function PhysicalServerShow() {
  const { result: record, query } = useShow({});
  const { isLoading } = query;

  const { options: physicalCpuOptions } = useLookupOptions({
    resource: "physical-cpus",
    optionLabel: "label",
  });
  const { options: operatingSystemOptions } = useLookupOptions({
    resource: "operating-systems",
  });
  const { options: rackOptions } = useLookupOptions({ resource: "racks" });
  const { options: interfaceOptions } = useLookupOptions({
    resource: "interfaces",
  });

  const slots = (record?.slots as ServerSlotRecord[] | undefined) ?? [];
  const cpus =
    (record?.cpus as
      { id: string; label?: string; serialNumber?: string }[] | undefined) ??
    [];

  const interfaceLabel = (id: string) =>
    interfaceOptions.find((option) => option.value === id)?.label ?? id;

  const slotGroups = new Map<string, ServerSlotRecord[]>();
  for (const slot of slots) {
    const group = slotGroups.get(slot.supportedInterfaceId) ?? [];
    group.push(slot);
    slotGroups.set(slot.supportedInterfaceId, group);
  }

  const slotsTree: DataNode[] = [
    {
      key: "server",
      title: record?.hostname ? String(record.hostname) : "Physical Server",
      children: Array.from(slotGroups.entries())
        .sort(([a], [b]) => interfaceLabel(a).localeCompare(interfaceLabel(b)))
        .map(([interfaceId, groupSlots]) => ({
          key: `interface-${interfaceId}`,
          title: interfaceLabel(interfaceId),
          children: [...groupSlots]
            .sort((a, b) => a.slotLabel.localeCompare(b.slotLabel))
            .map((slot) => ({
              key: `slot-${slot.id}`,
              title: slot.pcieBusAddress
                ? `${slot.slotLabel} (${slot.pcieBusAddress})`
                : slot.slotLabel,
            })),
        })),
    },
  ];

  return (
    <Show isLoading={isLoading}>
      <Space direction="vertical" size="large" style={{ display: "flex" }}>
        <Card title={"Physical Server"}>
          <Card size="small">
            <Descriptions title="Details" bordered column={2}>
              <Descriptions.Item label="ID" span={2}>
                <Text
                  copyable={{ text: record?.id?.toString() }}
                  style={{ fontFamily: "monospace", wordBreak: "break-all" }}
                >
                  {record?.id}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Display Key">
                {record?.displayKey}
              </Descriptions.Item>
              <Descriptions.Item label="Hostname">
                {record?.hostname}
              </Descriptions.Item>
              <Descriptions.Item label="Physical CPUs" span={2}>
                {cpus.length > 0 ? (
                  <Space direction="vertical" size={4}>
                    {cpus.map((cpu) => (
                      <LinkedLabel
                        key={cpu.id}
                        resource="physical-cpus"
                        options={physicalCpuOptions}
                        value={cpu.id}
                        label={cpu.label ?? cpu.serialNumber}
                      />
                    ))}
                  </Space>
                ) : (
                  "-"
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Memory">
                {record?.memoryValue !== undefined
                  ? `${Number(record.memoryValue)} ${record.memoryUnit}`
                  : "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Absolute Memory (bytes)" span={2}>
                {record?.absoluteMemory}
              </Descriptions.Item>
              <Descriptions.Item label="Operating System" span={2}>
                <LinkedLabel
                  resource="operating-systems"
                  options={operatingSystemOptions}
                  value={record?.operatingSystemId}
                  fallback="-"
                />
              </Descriptions.Item>
              <Descriptions.Item label="Rack">
                <LinkedLabel
                  resource="racks"
                  options={rackOptions}
                  value={record?.rackId}
                  fallback="-"
                />
              </Descriptions.Item>
              <Descriptions.Item label="Rack Unit Position">
                {record?.rackUnitPosition}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Card>

        <Card
          title={"Server Slots"}
          extra={
            <Link href={`/physical-servers/assign/${record?.id}`}>
              <Button type="primary" icon={<DeploymentUnitOutlined />}>
                Assign Drives
              </Button>
            </Link>
          }
        >
          {slots.length > 0 ? (
            <Tree
              treeData={slotsTree}
              defaultExpandAll
              selectable={false}
              showLine
            />
          ) : (
            <Empty
              description="No slots configured"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )}
        </Card>

        <AttachedStoragePools
          serverType="physical"
          serverId={record?.id as string | undefined}
        />

        <Row justify="center" gutter={32}>
          <Col style={{ textAlign: "center" }}>
            <Text type="secondary" style={{ display: "block", fontSize: 12 }}>
              Created
            </Text>
            <DateField value={record?.createdAt} format="LLL" />
          </Col>
          <Col style={{ textAlign: "center" }}>
            <Text type="secondary" style={{ display: "block", fontSize: 12 }}>
              Last Updated
            </Text>
            <DateField value={record?.updatedAt} format="LLL" />
          </Col>
        </Row>
      </Space>
    </Show>
  );
}
