"use client";

import {
  DateField,
  DeleteButton,
  EditButton,
  ListButton,
  Show,
} from "@refinedev/antd";
import { useOne, useShow } from "@refinedev/core";
import { Card, Col, Descriptions, Row, Space, Typography } from "antd";
import { ProviderTag } from "@components/provider-tag";
import { LinkedLabel } from "@components/linked-label";
import { CheckCircleFilled, CloseCircleFilled } from "@ant-design/icons";

const { Text } = Typography;

const BooleanIcon = ({ value }: { value?: boolean }) =>
  value ? (
    <CheckCircleFilled style={{ color: "#52c41a" }} />
  ) : (
    <CloseCircleFilled style={{ color: "#ff4d4f" }} />
  );

export default function VendorShow() {
  const { result: record, query } = useShow({});
  const { isLoading } = query;

  const {
    result: country,
    query: { isLoading: countryIsLoading },
  } = useOne({
    resource: "countries",
    id: record?.countryId || "",
    queryOptions: {
      enabled: !!record,
    },
  });

  return (
    <Show
      isLoading={isLoading}
      headerButtons={({
        editButtonProps,
        deleteButtonProps,
        listButtonProps,
      }) => (
        <>
          {listButtonProps && <ListButton {...listButtonProps} />}
          {editButtonProps && (
            <EditButton {...editButtonProps} disabled={record?.managed} />
          )}
          {deleteButtonProps && (
            <DeleteButton {...deleteButtonProps} disabled={record?.managed} />
          )}
        </>
      )}
    >
      <Space direction="vertical" size="large" style={{ display: "flex" }}>
        <Card title={"Vendor"}>
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
              <Descriptions.Item label="Country">
                <LinkedLabel
                  resource="countries"
                  value={record?.countryId}
                  label={country?.name}
                  fallback={countryIsLoading ? "Loading..." : "-"}
                />
              </Descriptions.Item>
              <Descriptions.Item label="Provider">
                <ProviderTag managed={record?.managed} />
              </Descriptions.Item>
              <Descriptions.Item label="Manufacturer">
                <BooleanIcon value={record?.isManufacturer} />
              </Descriptions.Item>
              <Descriptions.Item label="Retailer">
                <BooleanIcon value={record?.isRetailer} />
              </Descriptions.Item>
              <Descriptions.Item label="Support Contact Email">
                {record?.supportContactEmail ?? "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Portal URL">
                {record?.portalUrl ? (
                  <a href={record.portalUrl} target="_blank" rel="noreferrer">
                    {record.portalUrl}
                  </a>
                ) : (
                  "-"
                )}
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
