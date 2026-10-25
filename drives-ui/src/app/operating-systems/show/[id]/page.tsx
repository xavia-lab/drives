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
import { Card, Col, Descriptions, Row, Space, Typography } from "antd";

const { Text } = Typography;

export default function OperatingSystemShow() {
  const { result: record, query } = useShow({});
  const { isLoading } = query;

  return (
    <Show
      title={"Show Operating System"}
      isLoading={isLoading}
      headerButtons={({
        listButtonProps,
        editButtonProps,
        deleteButtonProps,
        refreshButtonProps,
      }) => (
        <>
          {listButtonProps ? (
            <ListButton {...listButtonProps}>Operating Systems</ListButton>
          ) : null}
          {editButtonProps ? <EditButton {...editButtonProps} /> : null}
          {deleteButtonProps ? <DeleteButton {...deleteButtonProps} /> : null}
          <RefreshButton {...refreshButtonProps} />
        </>
      )}
    >
      <Space direction="vertical" size="large" style={{ display: "flex" }}>
        <Card title={"Operating System"}>
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
              <Descriptions.Item label="Code Name">
                {record?.codeName ?? "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Vendor">
                {record?.vendor ?? "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Family">
                {record?.family ?? "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Major Version">
                {record?.majorVersion ?? "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Minor Version">
                {record?.minorVersion ?? "-"}
              </Descriptions.Item>
              <Descriptions.Item label="EOL Date" span={2}>
                {record?.eolDate ?? "-"}
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
