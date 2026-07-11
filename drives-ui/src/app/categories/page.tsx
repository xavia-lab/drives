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
import { useMany } from "@refinedev/core";
import { Input, Space, Table } from "antd";
import { ProviderTag } from "@components/provider-tag";

export default function CategoryList() {
  const { result, tableProps, sorters, filters } = useTable({
    sorters: {
      initial: [{ field: "id", order: "asc" }],
    },
    syncWithLocation: true,
  });

  const {
    result: { data: categories },
    query: { isLoading: categoryIsLoading },
  } = useMany({
    resource: "categories",
    ids: result?.data?.map((item: any) => item?.parentId).filter(Boolean) ?? [],
    queryOptions: {
      enabled: !!result?.data,
    },
  });

  return (
    <List>
      <Table {...tableProps} rowKey="id">
        <Table.Column
          dataIndex="id"
          title={"ID"}
          width={150}
          sorter={true}
          defaultSortOrder={getDefaultSortOrder("id", sorters)}
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
          dataIndex="parentId"
          title={"Parent"}
          key="parentId"
          width={150}
          sorter={true}
          defaultSortOrder={getDefaultSortOrder("parentId", sorters)}
          render={(managed, record: BaseRecord) => {
            return categoryIsLoading ? (
              <>Loading...</>
            ) : (
              categories?.find((item) => item.id === record.parentId)?.title
            );
          }}
        />
        <Table.Column
          dataIndex="managed"
          title={"Provider"}
          key="managed"
          width={150}
          sorter={true}
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
