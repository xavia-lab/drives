"use client";

import { DateField, Show } from "@refinedev/antd";
import { useOne, useShow } from "@refinedev/core";
import { Card, Col, Descriptions, Row, Space, Typography } from "antd";
import { EnumTag } from "@components/enum-tag";
import {
  ARCHITECTURE_OPTIONS,
  ARCHITECTURE_COLORS,
} from "@app/cpu-models/_components/cpu-model-form";

const { Text } = Typography;

export default function CpuModelShow() {
  const { result: record, query } = useShow({});
  const { isLoading } = query;

  const {
    result: vendor,
    query: { isLoading: vendorIsLoading },
  } = useOne({
    resource: "vendors",
    id: record?.vendorId || "",
    queryOptions: {
      enabled: !!record,
    },
  });

  return (
    <Show isLoading={isLoading}>
      <Space direction="vertical" size="large" style={{ display: "flex" }}>
        <Card title={"CPU Model"}>
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
              <Descriptions.Item label="Name">{record?.name}</Descriptions.Item>
              <Descriptions.Item label="Vendor">
                {vendorIsLoading ? <>Loading...</> : <>{vendor?.name}</>}
              </Descriptions.Item>
              <Descriptions.Item label="Architecture">
                <EnumTag
                  value={record?.architecture}
                  options={ARCHITECTURE_OPTIONS}
                  colorMap={ARCHITECTURE_COLORS}
                  tooltipPrefix="Architecture"
                />
              </Descriptions.Item>
              <Descriptions.Item label="Physical Cores">
                {record?.physicalCores}
              </Descriptions.Item>
              <Descriptions.Item label="Threads">
                {record?.threads}
              </Descriptions.Item>
              <Descriptions.Item label="TDP (Watts)">
                {record?.tdpWatts ?? "-"}
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
