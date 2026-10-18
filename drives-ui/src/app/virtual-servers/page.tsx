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
import { Input, InputNumber, Select, Space, Table, Tag } from "antd";
import type { TableProps } from "antd";
import type { SorterResult } from "antd/es/table/interface";
import { useLookupOptions } from "@hooks/use-lookup-options";

export default function VirtualServerList() {
  const { tableProps, sorters, filters } = useTable({
    sorters: {
      initial: [{ field: "displayKey", order: "asc" }],
    },
    syncWithLocation: true,
  });

  // The Memory column displays `value unit` but sorts server-side by the stored
  // `absoluteAllocatedMemory` byte count (so "1 GiB" > "512 MiB"). Refine derives
  // the sort field from the column key, so remap it without touching the filter.
  const handleTableChange: TableProps<BaseRecord>["onChange"] = (
    pagination,
    filters,
    sorter,
    extra,
  ) => {
    const remapSorter = (item: SorterResult<BaseRecord>) =>
      item?.field === "allocatedMemoryValue"
        ? { ...item, columnKey: "absoluteAllocatedMemory" }
        : item;
    const nextSorter = Array.isArray(sorter)
      ? sorter.map(remapSorter)
      : remapSorter(sorter);
    tableProps.onChange?.(pagination, filters, nextSorter, extra);
  };

  const { options: hostServerOptions, isLoading: hostServerLoading } =
    useLookupOptions({ resource: "physical-servers", optionLabel: "hostname" });
  const { options: operatingSystemOptions, isLoading: operatingSystemLoading } =
    useLookupOptions({ resource: "operating-systems" });

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
          dataIndex="hostServerId"
          title={"Host Server"}
          width={200}
          sorter={{ multiple: 1 }}
          filteredValue={
            getDefaultFilter("hostServerId", filters, "in") || null
          }
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Select
                style={{ minWidth: 220 }}
                placeholder="Search Host Server"
                mode="multiple"
                showSearch
                allowClear
                optionLabelProp="label"
                optionFilterProp="label"
                options={hostServerOptions}
                loading={hostServerLoading}
              />
            </FilterDropdown>
          )}
          render={(value) => renderLookup(hostServerOptions, value)}
        />
        <Table.Column
          dataIndex="type"
          title={"Type"}
          width={120}
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Select
                style={{ minWidth: 140 }}
                placeholder="Type"
                mode="multiple"
                allowClear
                options={[
                  { label: "VM", value: "VM" },
                  { label: "Container", value: "CONTAINER" },
                ]}
              />
            </FilterDropdown>
          )}
          render={(value) => <Tag>{String(value)}</Tag>}
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
          dataIndex="allocatedVcpus"
          title={"vCPUs"}
          width={90}
          align={"right"}
          sorter={true}
          defaultSortOrder={getDefaultSortOrder("allocatedVcpus", sorters)}
          filterDropdown={(props) => (
            <FilterDropdown {...props} mapValue={numberMapValue}>
              <InputNumber
                placeholder="vCPUs"
                style={{ width: "100%" }}
                controls={false}
              />
            </FilterDropdown>
          )}
        />
        <Table.Column
          dataIndex="allocatedMemoryValue"
          title={"Allocated Memory"}
          width={160}
          align={"right"}
          sorter={true}
          defaultSortOrder={getDefaultSortOrder(
            "absoluteAllocatedMemory",
            sorters,
          )}
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
            `${Number(record.allocatedMemoryValue)} ${record.allocatedMemoryUnit}`
          }
        />
        <Table.Column
          dataIndex="isActive"
          title={"Active"}
          width={90}
          align={"center"}
          render={(value) => (
            <Tag color={value ? "green" : "red"}>
              {value ? "Active" : "Inactive"}
            </Tag>
          )}
        />
        <Table.Column
          dataIndex="passthroughSlots"
          title={"Passthrough"}
          width={120}
          align={"right"}
          render={(_, record: BaseRecord) =>
            (record.passthroughSlots as unknown[] | undefined)?.length ?? 0
          }
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
