"use client";

import {
  Show,
  TextField,
  EditButton,
  DeleteButton,
  ListButton,
} from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Card, Space, Typography } from "antd";
import { ProviderTag } from "@components/provider-tag";

const { Title } = Typography;

export default function CurrencyShow() {
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
        <Card title={"Currency Information"}>
          <Title level={5}>{"ID"}</Title>
          <TextField value={record?.id} />
          <Title level={5}>{"Name"}</Title>
          <TextField value={record?.name} />
          <Title level={5}>{"Code"}</Title>
          <TextField value={record?.code} />
          <Title level={5}>{"Symbol"}</Title>
          <TextField value={record?.symbol} />
          <Title level={5}>{"Provider"}</Title>
          <ProviderTag managed={record?.managed} />
        </Card>
      </Space>
    </Show>
  );
}
