"use client";

import {
  DateField,
  DeleteButton,
  EditButton,
  ListButton,
  Show,
} from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Card, Col, Descriptions, Row, Space, Tag, Typography } from "antd";

const { Text } = Typography;

export default function VdevProfileShow() {
  const { result: record, query } = useShow({});
  const { isLoading } = query;

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
          {editButtonProps && <EditButton {...editButtonProps} />}
          {deleteButtonProps && <DeleteButton {...deleteButtonProps} />}
        </>
      )}
    >
      <Space direction="vertical" size="large" style={{ display: "flex" }}>
        <Card title="Vdev Profile">
          <Card size="small">
            <Descriptions title="Details" bordered column={2}>
              <Descriptions.Item label="ID" span={2}>
                <Text copyable={{ text: record?.id?.toString() }}>
                  {record?.id}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Code">
                <Tag>{record?.code}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Display name">
                {record?.displayName}
              </Descriptions.Item>
              <Descriptions.Item label="Technology">
                {record?.technology}
              </Descriptions.Item>
              <Descriptions.Item label="Capacity mode">
                {record?.capacityMode}
              </Descriptions.Item>
              <Descriptions.Item label="Min members">
                {record?.minMembers}
              </Descriptions.Item>
              <Descriptions.Item label="Max members">
                {record?.maxMembers ?? "Unlimited"}
              </Descriptions.Item>
              <Descriptions.Item label="Parity members">
                {record?.parityMembers}
              </Descriptions.Item>
              <Descriptions.Item label="Mirror copies">
                {record?.mirrorCopies}
              </Descriptions.Item>
              <Descriptions.Item label="Stripe width">
                {record?.stripeWidth ?? "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Sort order">
                {record?.sortOrder}
              </Descriptions.Item>
              <Descriptions.Item label="Metadata" span={2}>
                <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                  {record?.metadata
                    ? JSON.stringify(record.metadata, null, 2)
                    : "-"}
                </pre>
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
