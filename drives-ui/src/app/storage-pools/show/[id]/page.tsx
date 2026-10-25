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
import { StoragePoolHostActions } from "@app/storage-pools/_components/storage-pool-host-actions";
import { StoragePoolVdevManager } from "@app/storage-pools/_components/storage-pool-vdev-manager";
import {
  StoragePoolHostsTimeline,
  type StoragePoolHostEvent,
} from "@app/storage-pools/_components/storage-pool-hosts-timeline";

const { Text } = Typography;

export default function StoragePoolShow() {
  const { result: record, query } = useShow({});
  const { isLoading } = query;

  const { options: poolTypeOptions } = useLookupOptions({
    resource: "pool-types",
  });

  const currentHost = record?.currentHost as BaseRecord | undefined;
  const hosts = (record?.hosts as StoragePoolHostEvent[] | undefined) ?? [];
  const isPhysical = currentHost?.type === "PHYSICAL";

  return (
    <Show
      title={"Show Storage Pool"}
      isLoading={isLoading}
      headerButtons={({
        editButtonProps,
        deleteButtonProps,
        listButtonProps,
      }) => (
        <>
          {listButtonProps && (
            <ListButton {...listButtonProps}>Storage Pools</ListButton>
          )}
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
              <Descriptions.Item label="Current Host" span={2}>
                {currentHost ? (
                  <Space size={4}>
                    <Tag color={isPhysical ? "geekblue" : "purple"}>
                      {isPhysical ? "Physical" : "Virtual"}
                    </Tag>
                    <LinkedLabel
                      resource={
                        isPhysical ? "physical-servers" : "virtual-servers"
                      }
                      value={currentHost.serverId}
                      label={currentHost.hostname as string | undefined}
                      fallback="-"
                    />
                  </Space>
                ) : (
                  <Tag>Detached</Tag>
                )}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Card>

        <Card
          title={"Host History"}
          extra={
            <StoragePoolHostActions
              poolId={record?.id as string}
              isAttached={Boolean(currentHost)}
              onDone={async () => {
                await query.refetch();
              }}
            />
          }
        >
          <StoragePoolHostsTimeline events={hosts} />
        </Card>

        <StoragePoolVdevManager
          poolId={record?.id as string | undefined}
          poolTypeId={record?.poolTypeId as string | undefined}
        />

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
