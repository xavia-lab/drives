"use client";

import { DateField, Show } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { useLookupOptions } from "@hooks/use-lookup-options";
import { Card, Col, Descriptions, Row, Space, Typography } from "antd";

const { Text } = Typography;

export default function DatacenterShow() {
  const { result: record, query } = useShow({});
  const { isLoading } = query;

  const { options: countryOptions } = useLookupOptions({
    resource: "countries",
  });

  const findLabel = (
    options: { label: string; value: unknown }[],
    value: unknown,
  ) => options.find((option) => option.value === value)?.label ?? "-";

  return (
    <Show isLoading={isLoading}>
      <Space direction="vertical" size="large" style={{ display: "flex" }}>
        <Card title={"Datacenter"}>
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
              <Descriptions.Item label="Code">{record?.code}</Descriptions.Item>
              <Descriptions.Item label="Name" span={2}>
                {record?.name}
              </Descriptions.Item>
              <Descriptions.Item label="City">{record?.city}</Descriptions.Item>
              <Descriptions.Item label="Country">
                {findLabel(countryOptions, record?.countryId)}
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
