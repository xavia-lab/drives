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
import { useLookupOptions } from "@hooks/use-lookup-options";
import { LinkedLabel } from "@components/linked-label";
import { Card, Col, Descriptions, Row, Space, Typography } from "antd";

const { Text } = Typography;

export default function DriveModelShow() {
  const { result: record, query } = useShow({});
  const { isLoading } = query;

  const { options: manufacturerOptions } = useLookupOptions({
    resource: "vendors",
  });
  const { options: storageTypeOptions } = useLookupOptions({
    resource: "storage-types",
  });
  const { options: formFactorOptions } = useLookupOptions({
    resource: "form-factors",
  });
  const { options: interfaceOptions } = useLookupOptions({
    resource: "interfaces",
  });
  const { options: capacityOptions } = useLookupOptions({
    resource: "capacities",
  });

  return (
    <Show
      title={"Show Drive Model"}
      isLoading={isLoading}
      headerButtons={({
        listButtonProps,
        editButtonProps,
        deleteButtonProps,
        refreshButtonProps,
      }) => (
        <>
          {listButtonProps ? (
            <ListButton {...listButtonProps}>Drive Models</ListButton>
          ) : null}
          {editButtonProps ? <EditButton {...editButtonProps} /> : null}
          {deleteButtonProps ? <DeleteButton {...deleteButtonProps} /> : null}
          <RefreshButton {...refreshButtonProps} />
        </>
      )}
    >
      <Space direction="vertical" size="large" style={{ display: "flex" }}>
        <Card title={"Drive Model"}>
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
              <Descriptions.Item label="Model Number">
                {record?.modelNumber}
              </Descriptions.Item>
              <Descriptions.Item label="Max Endurance (TBW)">
                {record?.maxEnduranceTbw ?? "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Manufacturer">
                <LinkedLabel
                  resource="vendors"
                  options={manufacturerOptions}
                  value={record?.manufacturerId}
                  fallback="-"
                />
              </Descriptions.Item>
              <Descriptions.Item label="Storage Type">
                <LinkedLabel
                  resource="storage-types"
                  options={storageTypeOptions}
                  value={record?.storageTypeId}
                  fallback="-"
                />
              </Descriptions.Item>
              <Descriptions.Item label="Form Factor">
                <LinkedLabel
                  resource="form-factors"
                  options={formFactorOptions}
                  value={record?.formFactorId}
                  fallback="-"
                />
              </Descriptions.Item>
              <Descriptions.Item label="Interface">
                <LinkedLabel
                  resource="interfaces"
                  options={interfaceOptions}
                  value={record?.interfaceId}
                  fallback="-"
                />
              </Descriptions.Item>
              <Descriptions.Item label="Capacity" span={2}>
                <LinkedLabel
                  resource="capacities"
                  options={capacityOptions}
                  value={record?.capacityId}
                  fallback="-"
                />
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
