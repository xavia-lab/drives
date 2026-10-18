"use client";

import {
  DateField,
  DeleteButton,
  EditButton,
  ListButton,
  Show,
} from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import type { BaseRecord } from "@refinedev/core";
import { Card, Col, Descriptions, Row, Space, Tag, Typography } from "antd";
import { LinkedLabel } from "@components/linked-label";
import { useLookupOptions } from "@hooks/use-lookup-options";
import { CheckCircleFilled, CloseCircleFilled } from "@ant-design/icons";

const { Text } = Typography;

export default function StoragePoolShow() {
  const { result: record, query } = useShow({});
  const { isLoading } = query;

  const { options: poolTypeOptions } = useLookupOptions({
    resource: "pool-types",
  });

  const server = record?.server as BaseRecord | undefined;
  const virtualServer = record?.virtualServer as BaseRecord | undefined;

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
        <Card title={"Storage Pool"}>
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
              <Descriptions.Item label="Pool Name">
                {record?.poolName}
              </Descriptions.Item>
              <Descriptions.Item label="Pool Type">
                <LinkedLabel
                  resource="pool-types"
                  options={poolTypeOptions}
                  value={record?.poolTypeId}
                  fallback="-"
                />
              </Descriptions.Item>
              <Descriptions.Item label="Encryption">
                {record?.encryptionEnabled ? (
                  <CheckCircleFilled style={{ color: "#52c41a" }} />
                ) : (
                  <CloseCircleFilled style={{ color: "#ff4d4f" }} />
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Target Type">
                {record?.serverId ? (
                  <Tag color="geekblue">Physical</Tag>
                ) : (
                  <Tag color="purple">Virtual</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Target Server">
                {record?.serverId ? (
                  <LinkedLabel
                    resource="physical-servers"
                    value={record?.serverId}
                    label={server?.hostname as string | undefined}
                    fallback="-"
                  />
                ) : (
                  <LinkedLabel
                    resource="virtual-servers"
                    value={record?.virtualServerId}
                    label={virtualServer?.hostname as string | undefined}
                    fallback="-"
                  />
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
