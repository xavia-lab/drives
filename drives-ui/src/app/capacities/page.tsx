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
import type { TableProps } from "antd";
import type { SorterResult } from "antd/es/table/interface";
import { Input, InputNumber, Space, Table } from "antd";
import { ProviderTag } from "@components/provider-tag";

export default function CapacityList() {
  const { tableProps, sorters } = useTable({
    sorters: {
      initial: [{ field: "displayKey", order: "asc" }],
    },
    syncWithLocation: true,
  });

  // The Name column displays `name` but sorts server-side by the stored
  // `absoluteCapacity` byte count (so "1TB" > "512GB"). Refine derives the
  // sort field from the column key, so remap it here without affecting the
  // name filter (which keeps its own key).
  const handleTableChange: TableProps<BaseRecord>["onChange"] = (
    pagination,
    filters,
    sorter,
    extra,
  ) => {
    const remapSorter = (item: SorterResult<BaseRecord>) =>
      item?.field === "name"
        ? { ...item, columnKey: "absoluteCapacity" }
        : item;
    const nextSorter = Array.isArray(sorter)
      ? sorter.map(remapSorter)
      : remapSorter(sorter);
    tableProps.onChange?.(pagination, filters, nextSorter, extra);
  };

  return (
    <List>
      <Table {...tableProps} onChange={handleTableChange} rowKey="id">
        <Table.Column
          dataIndex="displayKey"
          title={"#"}
          width={70}
          align={"right"}
          sorter={true}
          defaultSortOrder={getDefaultSortOrder("displayKey", sorters)}
          filterDropdown={(props) => (
            <FilterDropdown
              {...props}
              mapValue={(value: unknown) => {
                const raw = Array.isArray(value) ? value[0] : value;
                return raw === undefined || raw === null || raw === ""
                  ? undefined
                  : Number(raw);
              }}
            >
              <InputNumber
                placeholder="DisplayKey #"
                style={{ width: "100%" }}
                controls={false}
              />
            </FilterDropdown>
          )}
        />
        <Table.Column
          dataIndex="name"
          title={"Name"}
          sorter={true}
          defaultSortOrder={getDefaultSortOrder("absoluteCapacity", sorters)}
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input placeholder="Search by Name" />
            </FilterDropdown>
          )}
        />
        <Table.Column
          dataIndex="value"
          title={"Value"}
          align={"right"}
          sorter={true}
          defaultSortOrder={getDefaultSortOrder("value", sorters)}
          render={(value) =>
            value !== undefined ? `${Number(value).toFixed(2)}` : "-"
          }
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input placeholder="Search by value" />
            </FilterDropdown>
          )}
        />
        <Table.Column
          dataIndex="unit"
          title={"Unit"}
          sorter={true}
          defaultSortOrder={getDefaultSortOrder("unit", sorters)}
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input placeholder="Search by unit" />
            </FilterDropdown>
          )}
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
