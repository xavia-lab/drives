"use client";

import {
  DateField,
  DeleteButton,
  EditButton,
  ListButton,
  RefreshButton,
  Show,
} from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { LinkedLabel } from "@components/linked-label";
import { useLookupOptions } from "@hooks/use-lookup-options";
import { CurrencyFormatter } from "@utils/currency-formatter";
import { Card, Col, Descriptions, Row, Space, Typography } from "antd";

const { Text } = Typography;
const currencyFormatter = new CurrencyFormatter();

export default function PhysicalCpuShow() {
  const { result: record, query } = useShow({});
  const { isLoading } = query;

  const { options: cpuModelOptions } = useLookupOptions({
    resource: "cpu-models",
    optionLabel: "name",
  });
  const { options: retailerOptions } = useLookupOptions({
    resource: "vendors",
  });
  const { options: currencyOptions } = useLookupOptions({
    resource: "currencies",
    optionLabel: "code",
  });

  const currencyCode = currencyOptions.find(
    (option) => option.value === record?.currencyId,
  )?.label;
  const acquisitionCost =
    record?.acquisitionCost !== undefined && record?.acquisitionCost !== null
      ? currencyFormatter.format(Number(record.acquisitionCost), currencyCode, {
          withSymbol: true,
        })
      : "-";

  return (
    <Show
      title={"Show Physical CPU"}
      isLoading={isLoading}
      headerButtons={({
        listButtonProps,
        editButtonProps,
        deleteButtonProps,
        refreshButtonProps,
      }) => (
        <>
          {listButtonProps ? (
            <ListButton {...listButtonProps}>Physical CPUs</ListButton>
          ) : null}
          {editButtonProps ? <EditButton {...editButtonProps} /> : null}
          {deleteButtonProps ? <DeleteButton {...deleteButtonProps} /> : null}
          <RefreshButton {...refreshButtonProps} />
        </>
      )}
    >
      <Space direction="vertical" size="large" style={{ display: "flex" }}>
        <Card title={"Physical CPU"}>
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
              <Descriptions.Item label="Serial Number" span={2}>
                {record?.serialNumber ?? "-"}
              </Descriptions.Item>
              <Descriptions.Item label="CPU Model" span={2}>
                <LinkedLabel
                  resource="cpu-models"
                  options={cpuModelOptions}
                  value={record?.cpuModelId}
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
              <Descriptions.Item label="Acquisition Cost" span={2}>
                {acquisitionCost}
              </Descriptions.Item>
              <Descriptions.Item label="Purchase Date">
                {record?.purchaseDate ?? "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Warranty Expiry Date">
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
