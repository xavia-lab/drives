"use client";

import {
  DeleteButton,
  EditButton,
  List,
  ShowButton,
  useTable,
  getDefaultSortOrder,
  FilterDropdown,
  getDefaultFilter,
} from "@refinedev/antd";
import { TableSearchFormBridge } from "@components/table-search-form-bridge";
import type { BaseRecord } from "@refinedev/core";
import { Input, InputNumber, Select, Space, Table } from "antd";
import { LinkedLabel } from "@components/linked-label";
import { useLookupOptions } from "@hooks/use-lookup-options";

export default function RackList() {
  const { searchFormProps, tableProps, sorters, filters } = useTable({
    sorters: {
      initial: [{ field: "displayKey", order: "asc" }],
    },
    syncWithLocation: true,
  });

  const { options: datacenterOptions, isLoading: datacenterLoading } =
    useLookupOptions({ resource: "datacenters" });

  return (
    <List>
      <TableSearchFormBridge {...searchFormProps} />

      <Table {...tableProps} rowKey="id">
        <Table.Column
          filteredValue={getDefaultFilter("displayKey", filters) || null}
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
          filteredValue={getDefaultFilter("name", filters) || null}
          dataIndex="name"
          title={"Name"}
          sorter={true}
          defaultSortOrder={getDefaultSortOrder("name", sorters)}
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input placeholder="Search by Name" />
            </FilterDropdown>
          )}
        />
        <Table.Column
          dataIndex="datacenterId"
          title={"Datacenter"}
          width={220}
          sorter={{ multiple: 1 }}
          filteredValue={
            getDefaultFilter("datacenterId", filters, "in") || null
          }
          filterDropdown={(props) => (
            <FilterDropdown
              {...props}
              mapValue={(selectedKeys) =>
                selectedKeys?.map((val) =>
                  isNaN(Number(val)) ? val : Number(val),
                )
              }
            >
              <Select
                style={{ minWidth: 220 }}
                placeholder="Search Datacenter"
                mode="multiple"
                showSearch
                allowClear
                optionLabelProp="label"
                optionFilterProp="label"
                options={datacenterOptions}
                loading={datacenterLoading}
              />
            </FilterDropdown>
          )}
          render={(value) => (
            <LinkedLabel
              resource="datacenters"
              options={datacenterOptions}
              value={value}
            />
          )}
        />
        <Table.Column
          filteredValue={getDefaultFilter("totalRackUnits", filters) || null}
          dataIndex="totalRackUnits"
          title={"Total Rack Units"}
          width={150}
          sorter={true}
          defaultSortOrder={getDefaultSortOrder("totalRackUnits", sorters)}
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
                placeholder="Units"
                style={{ width: "100%" }}
                controls={false}
              />
            </FilterDropdown>
          )}
        />
        <Table.Column
          filteredValue={null}
          title={"Actions"}
          dataIndex="actions"
          width={150}
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
