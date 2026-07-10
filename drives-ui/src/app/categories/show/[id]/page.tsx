"use client";

import {
  DeleteButton,
  EditButton,
  ListButton,
  Show,
  TextField,
} from "@refinedev/antd";
import { useOne, useShow } from "@refinedev/core";
import { Card, Space, Typography } from "antd";
import { ProviderTag } from "@components/provider-tag";

const { Title } = Typography;

export default function CategoryShow() {
  const { result: record, query } = useShow({});
  const { isLoading } = query;

  const {
    result: category,
    query: { isLoading: categoryIsLoading },
  } = useOne({
    resource: "categories",
    id: record?.parentId || "",
    queryOptions: {
      enabled: !!record,
    },
  });

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
        <Card title={"Category Information"}>
          <Title level={5}>{"ID"}</Title>
          <TextField value={record?.id} />
          <Title level={5}>{"Code"}</Title>
          <TextField value={record?.code} />
          <Title level={5}>{"Name"}</Title>
          <TextField value={record?.name} />
          <Title level={5}>{"Parent"}</Title>
          <TextField
            value={categoryIsLoading ? <>Loading...</> : <>{category?.title}</>}
          />
          <Title level={5}>{"Provider"}</Title>
          <ProviderTag managed={record?.managed} />
        </Card>
      </Space>
    </Show>
  );
}
