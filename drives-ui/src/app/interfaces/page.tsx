"use client";

import {
  DeleteButton,
  EditButton,
  List,
  ShowButton,
  useTable,
  getDefaultSortOrder,
  FilterDropdown,
  useSelect,
  getDefaultFilter,
} from "@refinedev/antd";
import { BaseRecord } from "@refinedev/core";
import { Input, Select, Space, Table } from "antd";
import { ProviderTag } from "@components/provider-tag";

export default function InterfaceList() {
  const { tableProps, sorters, filters } = useTable({
    sorters: {
      initial: [{ field: "id", order: "asc" }],
    },
    syncWithLocation: true,
  });

  // Safely extract pagination defaults by checking if it is an object
  const pagination =
    typeof tableProps.pagination === "object" ? tableProps.pagination : null;

  const current = pagination?.current ?? 1;
  const pageSize = pagination?.pageSize ?? 10;

  const { selectProps: busProtocolsSelectProps } = useSelect({
    resource: "bus-protocols",
    optionLabel: "title", // Automatically maps 'title' to label
    optionValue: "id", // Automatically maps 'id' to value
  });

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
          dataIndex="busProtocolId"
          title="Bus Protocol"
          width={200}
          sorter={{ multiple: 1 }}
          defaultFilteredValue={[]}
          filteredValue={
            getDefaultFilter("busProtocolId", filters, "in") || null
          }
          filterDropdown={(props) => (
            <FilterDropdown
              {...props}
              mapValue={(selectedKeys) => {
                // For multiple mode, selectedKeys is an array of IDs
                return selectedKeys?.map((val) =>
                  isNaN(Number(val)) ? val : Number(val),
                );
              }}
            >
              <Select
                style={{ minWidth: 200 }}
                placeholder="Search Bus Protocol"
                mode="multiple"
                showSearch
                allowClear
                optionLabelProp="label"
                optionFilterProp="label"
                {...busProtocolsSelectProps} // Spreads all options, loading state, and search logic
              />
            </FilterDropdown>
          )}
          render={(value) =>
            // We still use the 'options' from selectProps to find the label for the current row
            busProtocolsSelectProps.options?.find(
              (item) => item.value === value,
            )?.label ?? "Loading..."
          }
        />
        <Table.Column
          dataIndex="linkGeneration"
          title={"Link Generation"}
          align={"right"}
          width={200}
          sorter={true}
          defaultSortOrder={getDefaultSortOrder("linkGeneration", sorters)}
          // render={(value) =>
          //   value !== undefined ? `${Number(value).toFixed(2)}` : "-"
          // }
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input placeholder="Search by link generation" />
            </FilterDropdown>
          )}
        />
        <Table.Column
          dataIndex="throughput"
          title={"Throughput (Gbps)"}
          align={"right"}
          width={200}
          sorter={true}
          defaultSortOrder={getDefaultSortOrder("throughput", sorters)}
          render={(value) =>
            value !== undefined ? `${Number(value).toFixed(2)}` : "-"
          }
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input placeholder="Search by throughput" />
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
