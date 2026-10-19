"use client";

import { DateField, Show } from "@refinedev/antd";
import { stringifyTableParams, useShow } from "@refinedev/core";
import { LinkedLabel } from "@components/linked-label";
import { useLookupOptions } from "@hooks/use-lookup-options";
import { Button, Card, Col, Descriptions, Row, Space, Typography } from "antd";
import { UnorderedListOutlined } from "@ant-design/icons";

const { Text } = Typography;

export default function DatacenterShow() {
  const { result: record, query } = useShow({});
  const { isLoading } = query;

  const { options: countryOptions } = useLookupOptions({
    resource: "countries",
  });

  // Deep-link into the paged Physical Drives list with the location filter
  // pre-applied, rather than loading every drive into this page.
  const drivesHref = record?.id
    ? `/physical-drives?${stringifyTableParams({
        sorters: [],
        filters: [
          {
            field: "currentLocation",
            operator: "in",
            value: [record.id as string],
          },
        ],
      })}`
    : "/physical-drives";

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
                <LinkedLabel
                  resource="countries"
                  options={countryOptions}
                  value={record?.countryId}
                  fallback="-"
                />
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Card>

        <Card title={"Drives Located Here"}>
          <Space direction="vertical" size={8}>
            <Text type="secondary">
              Browse all drives currently located in this datacenter.
            </Text>
            <Button
              type="primary"
              icon={<UnorderedListOutlined />}
              href={drivesHref}
            >
              View Drives
            </Button>
          </Space>
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
