"use client";

import {
  DeleteButton,
  EditButton,
  List,
  ShowButton,
  getDefaultSortOrder,
  useTable,
} from "@refinedev/antd";
import { TableSearchFormBridge } from "@components/table-search-form-bridge";
import type { BaseRecord } from "@refinedev/core";
import { Space, Table, Tag } from "antd";

export default function VdevProfileList() {
  const { searchFormProps, tableProps, sorters } = useTable({
    sorters: {
      initial: [{ field: "sortOrder", order: "asc" }],
    },
    syncWithLocation: true,
  });

  return (
    <List>
      <TableSearchFormBridge {...searchFormProps} />
      <Table {...tableProps} rowKey="id" scroll={{ x: true }}>
        <Table.Column
          dataIndex="displayKey"
          title="#"
          width={70}
          align="right"
          sorter
          defaultSortOrder={getDefaultSortOrder("displayKey", sorters)}
        />
        <Table.Column
          dataIndex="code"
          title="Code"
          width={150}
          sorter
          defaultSortOrder={getDefaultSortOrder("code", sorters)}
          render={(value: string) => <Tag>{value}</Tag>}
        />
        <Table.Column
          dataIndex="displayName"
          title="Display name"
          sorter
          defaultSortOrder={getDefaultSortOrder("displayName", sorters)}
        />
        <Table.Column dataIndex="technology" title="Technology" width={120} />
        <Table.Column
          dataIndex="capacityMode"
          title="Capacity mode"
          width={160}
        />
        <Table.Column
          dataIndex="minMembers"
          title="Min"
          width={70}
          align="right"
        />
        <Table.Column
          dataIndex="maxMembers"
          title="Max"
          width={70}
          align="right"
          render={(value) => value ?? "∞"}
        />
        <Table.Column
          dataIndex="parityMembers"
          title="Parity"
          width={80}
          align="right"
        />
        <Table.Column
          dataIndex="mirrorCopies"
          title="Mirrors"
          width={80}
          align="right"
        />
        <Table.Column
          dataIndex="sortOrder"
          title="Sort"
          width={70}
          align="right"
          sorter
        />
        <Table.Column
          title="Actions"
          dataIndex="actions"
          width={160}
          render={(_, record: BaseRecord) => (
            <Space>
              <EditButton hideText size="small" recordItemId={record.id} />
              <ShowButton hideText size="small" recordItemId={record.id} />
              <DeleteButton hideText size="small" recordItemId={record.id} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
}
