"use client";

import { DateField, Show } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { LinkedLabel } from "@components/linked-label";
import { AttachedStoragePools } from "@components/attached-storage-pools";
import { useLookupOptions } from "@hooks/use-lookup-options";
import {
  Card,
  Col,
  Descriptions,
  Empty,
  Row,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";

const { Text } = Typography;

type PassthroughServerSlot = {
  id: string;
  slotLabel: string;
  supportedInterfaceId: string;
  pcieBusAddress?: string | null;
};

type PassthroughSlotRecord = {
  id: string;
  serverSlotId: string;
  serverSlot?: PassthroughServerSlot;
};

export default function VirtualServerShow() {
  const { result: record, query } = useShow({});
  const { isLoading } = query;

  const { options: hostServerOptions } = useLookupOptions({
    resource: "physical-servers",
    optionLabel: "hostname",
  });
  const { options: operatingSystemOptions } = useLookupOptions({
    resource: "operating-systems",
  });
  const { options: interfaceOptions } = useLookupOptions({
    resource: "interfaces",
  });

  const passthroughSlots =
    (record?.passthroughSlots as PassthroughSlotRecord[] | undefined) ?? [];

  return (
    <Show isLoading={isLoading}>
      <Space direction="vertical" size="large" style={{ display: "flex" }}>
        <Card title={"Virtual Server"}>
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
              <Descriptions.Item label="Host Server" span={2}>
                <LinkedLabel
                  resource="physical-servers"
                  options={hostServerOptions}
                  value={record?.hostServerId}
                  fallback="-"
                />
              </Descriptions.Item>
              <Descriptions.Item label="VMID">
                {record?.vmid ?? "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Type">
                <Tag>{String(record?.type ?? "-")}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Operating System" span={2}>
                <LinkedLabel
                  resource="operating-systems"
                  options={operatingSystemOptions}
                  value={record?.operatingSystemId}
                  fallback="-"
                />
              </Descriptions.Item>
              <Descriptions.Item label="Allocated vCPUs">
                {record?.allocatedVcpus}
              </Descriptions.Item>
              <Descriptions.Item label="Allocated Memory">
                {record?.allocatedMemoryValue !== undefined
                  ? `${Number(record.allocatedMemoryValue)} ${record.allocatedMemoryUnit}`
                  : "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Absolute Allocated (bytes)" span={2}>
                {record?.absoluteAllocatedMemory}
              </Descriptions.Item>
              <Descriptions.Item label="Active">
                <Tag color={record?.isActive ? "green" : "red"}>
                  {record?.isActive ? "Active" : "Inactive"}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Notes" span={2}>
                {record?.notes ?? "-"}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Card>

        <Card title={"Passthrough Slots"}>
          {passthroughSlots.length > 0 ? (
            <Table
              dataSource={passthroughSlots}
              rowKey="id"
              pagination={false}
              size="small"
            >
              <Table.Column
                title={"Slot Label"}
                render={(_, row: PassthroughSlotRecord) =>
                  row.serverSlot?.slotLabel ?? row.serverSlotId
                }
              />
              <Table.Column
                title={"Interface"}
                render={(_, row: PassthroughSlotRecord) =>
                  row.serverSlot ? (
                    <LinkedLabel
                      resource="interfaces"
                      options={interfaceOptions}
                      value={row.serverSlot.supportedInterfaceId}
                      fallback="-"
                    />
                  ) : (
                    "-"
                  )
                }
              />
              <Table.Column
                title={"PCIe Bus Address"}
                render={(_, row: PassthroughSlotRecord) =>
                  row.serverSlot?.pcieBusAddress ?? "-"
                }
              />
            </Table>
          ) : (
            <Empty
              description="No passthrough slots configured"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )}
        </Card>

        <AttachedStoragePools
          serverType="virtual"
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
