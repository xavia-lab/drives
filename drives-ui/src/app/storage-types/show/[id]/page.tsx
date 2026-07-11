"use client";

import {
  DeleteButton,
  EditButton,
  ListButton,
  Show,
  TextField,
} from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Card, Descriptions, Space, Typography } from "antd";
import { ProviderTag } from "@components/provider-tag";
import { CheckCircleFilled, CloseCircleFilled } from "@ant-design/icons";

const { Title } = Typography;

export default function StorageTypeShow() {
  const { result: record, query } = useShow({});
  const { isLoading } = query;

  return (
    <Show
      isLoading={isLoading}
      // 2. Customize header buttons based on record data
      headerButtons={({
        editButtonProps,
        deleteButtonProps,
        listButtonProps,
      }) => (
        <>
          {listButtonProps && <ListButton {...listButtonProps} />}
          {editButtonProps && (
            <EditButton
              {...editButtonProps}
              // Disable if 'managed' field is true
              disabled={record?.managed}
            />
          )}
          {deleteButtonProps && (
            <DeleteButton
              {...deleteButtonProps}
              // Disable if 'managed' field is true
              disabled={record?.managed}
            />
          )}
        </>
      )}
    >
      <Space direction="vertical" size="middle" style={{ display: "flex" }}>
        <Card title={"Storage Type Information"}>
          <Title level={5}>{"ID"}</Title>
          <TextField value={record?.id} />
          <Title level={5}>{"Name"}</Title>
          <TextField value={record?.name} />
          <Title level={5}>{"Wear Trackable"}</Title>
          <TextField
            value={
              record?.wearTrackable ? (
                <CheckCircleFilled style={{ color: "#52c41a" }} />
              ) : (
                <CloseCircleFilled style={{ color: "#ff4d4f" }} />
              )
            }
          />
          <Title level={5}>{"Provider"}</Title>
          <ProviderTag managed={record?.managed} />
        </Card>
      </Space>
    </Show>
  );
}
