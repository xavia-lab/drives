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
import type { BaseRecord } from "@refinedev/core";
import { Input, InputNumber, Select, Space, Table } from "antd";
import { ProviderTag } from "@components/provider-tag";
import { CheckCircleFilled, CloseCircleFilled } from "@ant-design/icons";

export default function VendorList() {
  const { tableProps, sorters, filters } = useTable({
    sorters: {
      initial: [{ field: "displayKey", order: "asc" }],
    },
    syncWithLocation: true,
  });

  const { selectProps: countrySelectProps } = useSelect({
    resource: "countries",
    optionLabel: "name",
    optionValue: "id",
  });

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
          dataIndex="isManufacturer"
          title={"Manufacturer"}
          width={140}
          align={"center"}
          sorter={true}
          defaultSortOrder={getDefaultSortOrder("isManufacturer", sorters)}
          render={(value) =>
            value ? (
              <CheckCircleFilled style={{ color: "#52c41a" }} />
            ) : (
              <CloseCircleFilled style={{ color: "#ff4d4f" }} />
            )
          }
        />
        <Table.Column
          dataIndex="isRetailer"
          title={"Retailer"}
          width={120}
          align={"center"}
          sorter={true}
          defaultSortOrder={getDefaultSortOrder("isRetailer", sorters)}
          render={(value) =>
            value ? (
              <CheckCircleFilled style={{ color: "#52c41a" }} />
            ) : (
              <CloseCircleFilled style={{ color: "#ff4d4f" }} />
            )
          }
        />
        <Table.Column
          dataIndex="countryId"
          title="Country"
          width={200}
          sorter={true}
          defaultSortOrder={getDefaultSortOrder("countryId", sorters)}
          defaultFilteredValue={[]}
          filteredValue={getDefaultFilter("countryId", filters, "in") || null}
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
                style={{ minWidth: 200 }}
                placeholder="Search Country"
                mode="multiple"
                showSearch
                allowClear
                optionLabelProp="label"
                optionFilterProp="label"
                {...countrySelectProps}
              />
            </FilterDropdown>
          )}
          render={(value) =>
            countrySelectProps.options?.find((item) => item.value === value)
              ?.label ?? "Loading..."
          }
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
