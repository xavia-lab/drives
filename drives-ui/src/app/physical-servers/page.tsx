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
import type { TableProps } from "antd";
import type { SorterResult } from "antd/es/table/interface";
import { useLookupOptions } from "@hooks/use-lookup-options";

export default function PhysicalServerList() {
  const { tableProps, sorters, filters } = useTable({
    sorters: {
      initial: [{ field: "displayKey", order: "asc" }],
    },
    syncWithLocation: true,
  });

  // The Memory column displays `value unit` but sorts server-side by the stored
  // `absoluteMemory` byte count (so "1 GiB" > "512 MiB"). Refine derives the sort
  // field from the column key, so remap it without touching the value filter.
  const handleTableChange: TableProps<BaseRecord>["onChange"] = (
    pagination,
    filters,
    sorter,
    extra,
  ) => {
    const remapSorter = (item: SorterResult<BaseRecord>) =>
      item?.field === "memoryValue"
        ? { ...item, columnKey: "absoluteMemory" }
        : item;
    const nextSorter = Array.isArray(sorter)
      ? sorter.map(remapSorter)
      : remapSorter(sorter);
    tableProps.onChange?.(pagination, filters, nextSorter, extra);
  };

  const { options: cpuModelOptions, isLoading: cpuModelLoading } =
    useLookupOptions({ resource: "cpu-models" });
  const { options: operatingSystemOptions, isLoading: operatingSystemLoading } =
    useLookupOptions({ resource: "operating-systems" });
  const { options: rackOptions, isLoading: rackLoading } = useLookupOptions({
    resource: "racks",
  });

  const numberMapValue = (value: unknown) => {
    const raw = Array.isArray(value) ? value[0] : value;
    return raw === undefined || raw === null || raw === ""
      ? undefined
      : Number(raw);
  };

  const renderLookup = (
    options: { label: string; value: unknown }[],
    value: unknown,
  ) => options.find((item) => item.value === value)?.label ?? "Loading...";

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
            <FilterDropdown {...props} mapValue={numberMapValue}>
              <InputNumber
                placeholder="DisplayKey #"
                style={{ width: "100%" }}
                controls={false}
              />
            </FilterDropdown>
          )}
        />
        <Table.Column
          dataIndex="hostname"
          title={"Hostname"}
          sorter={true}
          defaultSortOrder={getDefaultSortOrder("hostname", sorters)}
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input placeholder="Search by Hostname" />
            </FilterDropdown>
          )}
        />
        <Table.Column
          dataIndex="cpuModelId"
          title={"CPU Model"}
          width={200}
          sorter={{ multiple: 1 }}
          filteredValue={getDefaultFilter("cpuModelId", filters, "in") || null}
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Select
                style={{ minWidth: 200 }}
                placeholder="Search CPU Model"
                mode="multiple"
                showSearch
                allowClear
                optionLabelProp="label"
                optionFilterProp="label"
                options={cpuModelOptions}
                loading={cpuModelLoading}
              />
            </FilterDropdown>
          )}
          render={(value) => renderLookup(cpuModelOptions, value)}
        />
        <Table.Column
          dataIndex="cpuCount"
          title={"CPU Count"}
          width={110}
          align={"right"}
          sorter={true}
          defaultSortOrder={getDefaultSortOrder("cpuCount", sorters)}
          filterDropdown={(props) => (
            <FilterDropdown {...props} mapValue={numberMapValue}>
              <InputNumber
                placeholder="CPU Count"
                style={{ width: "100%" }}
                controls={false}
              />
            </FilterDropdown>
          )}
        />
        <Table.Column
          dataIndex="memoryValue"
          title={"Memory"}
          width={140}
          align={"right"}
          sorter={true}
          defaultSortOrder={getDefaultSortOrder("absoluteMemory", sorters)}
          filterDropdown={(props) => (
            <FilterDropdown {...props} mapValue={numberMapValue}>
              <InputNumber
                placeholder="Memory value"
                style={{ width: "100%" }}
                controls={false}
              />
            </FilterDropdown>
          )}
          render={(_, record: BaseRecord) =>
            `${Number(record.memoryValue)} ${record.memoryUnit}`
          }
        />
        <Table.Column
          dataIndex="operatingSystemId"
          title={"Operating System"}
          width={200}
          sorter={{ multiple: 2 }}
          filteredValue={
            getDefaultFilter("operatingSystemId", filters, "in") || null
          }
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Select
                style={{ minWidth: 200 }}
                placeholder="Search Operating System"
                mode="multiple"
                showSearch
                allowClear
                optionLabelProp="label"
                optionFilterProp="label"
                options={operatingSystemOptions}
                loading={operatingSystemLoading}
              />
            </FilterDropdown>
          )}
          render={(value) => renderLookup(operatingSystemOptions, value)}
        />
        <Table.Column
          dataIndex="rackId"
          title={"Rack"}
          width={160}
          sorter={{ multiple: 3 }}
          filteredValue={getDefaultFilter("rackId", filters, "in") || null}
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Select
                style={{ minWidth: 160 }}
                placeholder="Search Rack"
                mode="multiple"
                showSearch
                allowClear
                optionLabelProp="label"
                optionFilterProp="label"
                options={rackOptions}
                loading={rackLoading}
              />
            </FilterDropdown>
          )}
          render={(value) => renderLookup(rackOptions, value)}
        />
        <Table.Column
          dataIndex="rackUnitPosition"
          title={"Rack Unit Position"}
          width={140}
          align={"right"}
          sorter={true}
          defaultSortOrder={getDefaultSortOrder("rackUnitPosition", sorters)}
          filterDropdown={(props) => (
            <FilterDropdown {...props} mapValue={numberMapValue}>
              <InputNumber
                placeholder="Position"
                style={{ width: "100%" }}
                controls={false}
              />
            </FilterDropdown>
          )}
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
