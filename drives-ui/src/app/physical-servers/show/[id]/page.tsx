"use client";

import { DateField, Show } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { useLookupOptions } from "@hooks/use-lookup-options";
import { Card, Col, Descriptions, Row, Space, Typography } from "antd";

const { Text } = Typography;

export default function PhysicalServerShow() {
  const { result: record, query } = useShow({});
  const { isLoading } = query;

  const { options: cpuModelOptions } = useLookupOptions({
    resource: "cpu-models",
  });
  const { options: operatingSystemOptions } = useLookupOptions({
    resource: "operating-systems",
  });
  const { options: rackOptions } = useLookupOptions({ resource: "racks" });

  const findLabel = (
    options: { label: string; value: unknown }[],
    value: unknown,
  ) => options.find((option) => option.value === value)?.label ?? "-";

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
              <Descriptions.Item label="CPU Model" span={2}>
                {findLabel(cpuModelOptions, record?.cpuModelId)}
              </Descriptions.Item>
              <Descriptions.Item label="CPU Count">
                {record?.cpuCount}
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
                {findLabel(operatingSystemOptions, record?.operatingSystemId)}
              </Descriptions.Item>
              <Descriptions.Item label="Rack">
                {findLabel(rackOptions, record?.rackId)}
              </Descriptions.Item>
              <Descriptions.Item label="Rack Unit Position">
                {record?.rackUnitPosition}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Card>

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
