"use client";

import {
  DeleteButton,
  EditButton,
  List,
  ShowButton,
  useTable,
  getDefaultSortOrder,
  FilterDropdown,
} from "@refinedev/antd";
import type { BaseRecord } from "@refinedev/core";
import { Space, Table, Input, Tag } from "antd";
import { ProviderTag } from "@components/provider-tag";

export default function CountryList() {
  const { tableProps, sorters, filters } = useTable({
    sorters: {
      initial: [{ field: "id", order: "asc" }],
    },
    syncWithLocation: true, // Persists state in the URL
  });

  // Safely extract pagination defaults by checking if it is an object
  const pagination =
    typeof tableProps.pagination === "object" ? tableProps.pagination : null;

  const current = pagination?.current ?? 1;
  const pageSize = pagination?.pageSize ?? 10;

  return (
    <List>
      <Table {...tableProps} rowKey="id">
        {/* Sequential Index Column */}
        <Table.Column
          title="#"
          width={70}
          render={(_, __, index) => {
            return (current - 1) * pageSize + index + 1;
          }}
        />
        <Table.Column
          dataIndex="name"
          title={"Name"}
          sorter={true}
          defaultSortOrder={getDefaultSortOrder("name", sorters)}
          // Custom Filter Dropdown
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input placeholder="Search by Name" />
            </FilterDropdown>
          )}
        />
        <Table.Column
          dataIndex="code"
          title={"Code"}
          width={150}
          sorter={true}
          defaultSortOrder={getDefaultSortOrder("code", sorters)}
          // Custom Filter Dropdown
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input placeholder="Search by Code" />
            </FilterDropdown>
          )}
        />
        <Table.Column
          dataIndex="managed"
          title="Provider"
          key="managed"
          width={150}
          sorter
          defaultSortOrder={getDefaultSortOrder("managed", sorters)}
          render={(managed: boolean) => <ProviderTag managed={managed} />}
        />
        <Table.Column
          title={"Actions"}
          dataIndex="actions"
          width={150}
          render={(_, record: BaseRecord) => (
            <Space>
              <EditButton
                hideText
                size="small"
                recordItemId={record.id}
                disabled={record.managed}
              />
              <ShowButton hideText size="small" recordItemId={record.id} />
              <DeleteButton
                hideText
                size="small"
                recordItemId={record.id}
                disabled={record.managed}
              />
            </Space>
          )}
        />
      </Table>
    </List>
  );
}
