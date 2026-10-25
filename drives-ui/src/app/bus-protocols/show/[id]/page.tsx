"use client";

import {
  DateField,
  DeleteButton,
  EditButton,
  ListButton,
  Show,
} from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Card, Col, Descriptions, Row, Space, Typography } from "antd";
import { ProviderTag } from "@components/provider-tag";
import { CheckCircleFilled, CloseCircleFilled } from "@ant-design/icons";

const { Text } = Typography;

export default function BusProtocolShow() {
  const { result: record, query } = useShow({});
  const { isLoading } = query;

  return (
    <Show
      title={"Show Bus Protocol"}
      isLoading={isLoading}
      headerButtons={({
        editButtonProps,
        deleteButtonProps,
        listButtonProps,
      }) => (
        <>
          {listButtonProps && (
            <ListButton {...listButtonProps}>Bus Protocols</ListButton>
          )}
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
        <Card title={"Bus Protocol"}>
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
              <Descriptions.Item label="Command Set">
                {record?.commandSet}
              </Descriptions.Item>
              <Descriptions.Item label="Supports Hotplug">
                {record?.supportsHotPlug ? (
                  <CheckCircleFilled style={{ color: "#52c41a" }} />
                ) : (
                  <CloseCircleFilled style={{ color: "#ff4d4f" }} />
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Provider">
                <ProviderTag managed={record?.managed} />
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
