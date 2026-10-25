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
import { TableSearchFormBridge } from "@components/table-search-form-bridge";
import type { BaseRecord } from "@refinedev/core";
import { Input, InputNumber, Space, Table } from "antd";

export default function OperatingSystemList() {
  const { searchFormProps, tableProps, sorters } = useTable({
    sorters: {
      initial: [{ field: "displayKey", order: "asc" }],
    },
    syncWithLocation: true,
  });

  return (
    <List title={"Operating Systems"}>
      <TableSearchFormBridge {...searchFormProps} />

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
          dataIndex="codeName"
          title={"Code Name"}
          sorter={true}
          defaultSortOrder={getDefaultSortOrder("codeName", sorters)}
          render={(value) => value ?? "-"}
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input placeholder="Search by Code Name" />
            </FilterDropdown>
          )}
        />
        <Table.Column
          dataIndex="family"
          title={"Family"}
          sorter={true}
          defaultSortOrder={getDefaultSortOrder("family", sorters)}
          render={(value) => value ?? "-"}
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input placeholder="Search by Family" />
            </FilterDropdown>
          )}
        />
        <Table.Column
          dataIndex="majorVersion"
          title={"Major"}
          width={100}
          align={"right"}
          sorter={true}
          defaultSortOrder={getDefaultSortOrder("majorVersion", sorters)}
          render={(value) => value ?? "-"}
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
                placeholder="Major #"
                style={{ width: "100%" }}
                controls={false}
              />
            </FilterDropdown>
          )}
        />
        <Table.Column
          dataIndex="minorVersion"
          title={"Minor"}
          width={100}
          align={"right"}
          sorter={true}
          defaultSortOrder={getDefaultSortOrder("minorVersion", sorters)}
          render={(value) => value ?? "-"}
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
                placeholder="Minor #"
                style={{ width: "100%" }}
                controls={false}
              />
            </FilterDropdown>
          )}
        />
        <Table.Column
          dataIndex="vendor"
          title={"Vendor"}
          sorter={true}
          defaultSortOrder={getDefaultSortOrder("vendor", sorters)}
          render={(value) => value ?? "-"}
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input placeholder="Search by Vendor" />
            </FilterDropdown>
          )}
        />
        <Table.Column
          dataIndex="eolDate"
          title={"EOL Date"}
          width={130}
          sorter={true}
          defaultSortOrder={getDefaultSortOrder("eolDate", sorters)}
          render={(value) => value ?? "-"}
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input placeholder="Search by EOL Date" />
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
