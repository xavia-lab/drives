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
import type { BaseRecord } from "@refinedev/core";
import { Input, InputNumber, Select, Space, Table } from "antd";
import { EnumTag } from "@components/enum-tag";
import {
  ARCHITECTURE_OPTIONS,
  ARCHITECTURE_COLORS,
} from "@app/cpu-models/_components/cpu-model-form";
import { useLookupOptions } from "@hooks/use-lookup-options";

export default function CpuModelList() {
  const { tableProps, sorters, filters } = useTable({
    sorters: {
      initial: [{ field: "displayKey", order: "asc" }],
    },
    syncWithLocation: true,
  });

  const { options: vendorOptions, isLoading: vendorLoading } = useLookupOptions(
    {
      resource: "vendors",
      optionLabel: "name",
      optionValue: "id",
    },
  );

  return (
    <List>
      <Table {...tableProps} rowKey="id">
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
          defaultSortOrder={getDefaultSortOrder("name", sorters)}
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input placeholder="Search by Name" />
            </FilterDropdown>
          )}
        />
        <Table.Column
          dataIndex="vendorId"
          title={"Vendor"}
          width={220}
          sorter={true}
          defaultSortOrder={getDefaultSortOrder("vendorId", sorters)}
          defaultFilteredValue={[]}
          filteredValue={getDefaultFilter("vendorId", filters, "in") || null}
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
                placeholder="Search Vendor"
                mode="multiple"
                showSearch
                allowClear
                optionLabelProp="label"
                optionFilterProp="label"
                options={vendorOptions}
                loading={vendorLoading}
              />
            </FilterDropdown>
          )}
          render={(value) =>
            vendorOptions.find((item) => item.value === value)?.label ??
            "Loading..."
          }
        />
        <Table.Column
          dataIndex="architecture"
          title={"Architecture"}
          width={150}
          sorter={true}
          defaultSortOrder={getDefaultSortOrder("architecture", sorters)}
          defaultFilteredValue={[]}
          filteredValue={
            getDefaultFilter("architecture", filters, "in") || null
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
                style={{ minWidth: 160 }}
                placeholder="Search Architecture"
                mode="multiple"
                allowClear
                options={ARCHITECTURE_OPTIONS}
              />
            </FilterDropdown>
          )}
          render={(value: string) => (
            <EnumTag
              value={value}
              options={ARCHITECTURE_OPTIONS}
              colorMap={ARCHITECTURE_COLORS}
              tooltipPrefix="Architecture"
            />
          )}
        />
        <Table.Column
          dataIndex="physicalCores"
          title={"Physical Cores"}
          width={150}
          align={"right"}
          sorter={true}
          defaultSortOrder={getDefaultSortOrder("physicalCores", sorters)}
        />
        <Table.Column
          dataIndex="threads"
          title={"Threads"}
          width={120}
          align={"right"}
          sorter={true}
          defaultSortOrder={getDefaultSortOrder("threads", sorters)}
        />
        <Table.Column
          dataIndex="tdpWatts"
          title={"TDP (Watts)"}
          width={130}
          align={"right"}
          sorter={true}
          defaultSortOrder={getDefaultSortOrder("tdpWatts", sorters)}
          render={(value) => value ?? "-"}
        />
        <Table.Column
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
