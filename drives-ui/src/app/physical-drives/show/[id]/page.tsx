"use client";

import { DateField, Show } from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { LinkedLabel } from "@components/linked-label";
import { useLookupOptions } from "@hooks/use-lookup-options";
import { Card, Col, Descriptions, Row, Space, Typography } from "antd";

const { Text } = Typography;

export default function PhysicalDriveShow() {
  const { result: record, query } = useShow({});
  const { isLoading } = query;

  const { options: driveModelOptions } = useLookupOptions({
    resource: "drive-models",
    optionLabel: "title",
  });
  const { options: retailerOptions } = useLookupOptions({
    resource: "vendors",
  });
  const { options: currencyOptions } = useLookupOptions({
    resource: "currencies",
  });

  return (
    <Show isLoading={isLoading}>
      <Space direction="vertical" size="large" style={{ display: "flex" }}>
        <Card title={"Physical Drive"}>
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
              <Descriptions.Item label="Label">
                {record?.label ?? "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Serial Number">
                {record?.serialNumber}
              </Descriptions.Item>
              <Descriptions.Item label="Worldwide Name (WWN)">
                {record?.worldwideNameWwn ?? "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Drive Model" span={2}>
                <LinkedLabel
                  resource="drive-models"
                  options={driveModelOptions}
                  value={record?.driveModelId}
                  fallback="-"
                />
              </Descriptions.Item>
              <Descriptions.Item label="Retailer">
                <LinkedLabel
                  resource="vendors"
                  options={retailerOptions}
                  value={record?.retailerVendorId}
                  fallback="-"
                />
              </Descriptions.Item>
              <Descriptions.Item label="Currency">
                <LinkedLabel
                  resource="currencies"
                  options={currencyOptions}
                  value={record?.currencyId}
                  fallback="-"
                />
              </Descriptions.Item>
              <Descriptions.Item label="Acquisition Cost">
                {record?.acquisitionCost !== undefined &&
                record?.acquisitionCost !== null
                  ? Number(record.acquisitionCost).toFixed(2)
                  : "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Purchase Date">
                {record?.purchaseDate ?? "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Warranty Expiry Date" span={2}>
                {record?.warrantyExpiryDate ?? "-"}
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
