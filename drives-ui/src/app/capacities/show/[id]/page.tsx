"use client";

import {
  DeleteButton,
  EditButton,
  ListButton,
  NumberField,
  Show,
  TextField,
} from "@refinedev/antd";
import { useOne, useShow } from "@refinedev/core";
import { Card, Space, Typography } from "antd";
import { ProviderTag } from "@components/provider-tag";

const { Title } = Typography;

export default function CapacityShow() {
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
        <Card title={"Capacity Information"}>
          <Title level={5}>{"ID"}</Title>
          <TextField value={record?.id} />
          <Title level={5}>{"Name"}</Title>
          <TextField value={record?.name} />
          <Title level={5}>{"Value"}</Title>
          <NumberField
            value={record?.value}
            options={{
              notation: "compact",
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }}
          />
          <Title level={5}>{"Unit"}</Title>
          <TextField value={record?.unit} />
          <Title level={5}>{"Provider"}</Title>
          <ProviderTag managed={record?.managed} />
        </Card>
      </Space>
    </Show>
  );
}
