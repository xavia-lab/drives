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

export default function DriveModelList() {
  const { searchFormProps, tableProps, sorters, filters } = useTable({
    sorters: {
      initial: [{ field: "displayKey", order: "asc" }],
    },
    syncWithLocation: true,
  });

  const { options: manufacturerOptions, isLoading: manufacturerLoading } =
    useLookupOptions({ resource: "vendors" });
  const { options: storageTypeOptions, isLoading: storageTypeLoading } =
    useLookupOptions({ resource: "storage-types" });
  const { options: formFactorOptions, isLoading: formFactorLoading } =
    useLookupOptions({ resource: "form-factors" });
  const { options: interfaceOptions, isLoading: interfaceLoading } =
    useLookupOptions({ resource: "interfaces" });
  const { options: capacityOptions, isLoading: capacityLoading } =
    useLookupOptions({ resource: "capacities" });

  return (
    <List title={"Drive Models"}>
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
          filteredValue={getDefaultFilter("modelNumber", filters) || null}
          dataIndex="modelNumber"
          title={"Model Number"}
          sorter={true}
          defaultSortOrder={getDefaultSortOrder("modelNumber", sorters)}
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input placeholder="Search by Model Number" />
            </FilterDropdown>
          )}
        />
        <Table.Column
          dataIndex="manufacturerId"
          title={"Manufacturer"}
          width={200}
          sorter={{ multiple: 1 }}
          filteredValue={
            getDefaultFilter("manufacturerId", filters, "in") || null
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
                style={{ minWidth: 200 }}
                placeholder="Search Manufacturer"
                mode="multiple"
                showSearch
                allowClear
                optionLabelProp="label"
                optionFilterProp="label"
                options={manufacturerOptions}
                loading={manufacturerLoading}
              />
            </FilterDropdown>
          )}
          render={(value) => (
            <LinkedLabel
              resource="vendors"
              options={manufacturerOptions}
              value={value}
            />
          )}
        />
        <Table.Column
          dataIndex="storageTypeId"
          title={"Storage Type"}
          width={160}
          sorter={{ multiple: 2 }}
          filteredValue={
            getDefaultFilter("storageTypeId", filters, "in") || null
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
                placeholder="Search Storage Type"
                mode="multiple"
                showSearch
                allowClear
                optionLabelProp="label"
                optionFilterProp="label"
                options={storageTypeOptions}
                loading={storageTypeLoading}
              />
            </FilterDropdown>
          )}
          render={(value) => (
            <LinkedLabel
              resource="storage-types"
              options={storageTypeOptions}
              value={value}
            />
          )}
        />
        <Table.Column
          dataIndex="formFactorId"
          title={"Form Factor"}
          width={140}
          sorter={{ multiple: 3 }}
          filteredValue={
            getDefaultFilter("formFactorId", filters, "in") || null
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
                placeholder="Search Form Factor"
                mode="multiple"
                showSearch
                allowClear
                optionLabelProp="label"
                optionFilterProp="label"
                options={formFactorOptions}
                loading={formFactorLoading}
              />
            </FilterDropdown>
          )}
          render={(value) => (
            <LinkedLabel
              resource="form-factors"
              options={formFactorOptions}
              value={value}
            />
          )}
        />
        <Table.Column
          dataIndex="interfaceId"
          title={"Interface"}
          width={180}
          sorter={{ multiple: 4 }}
          filteredValue={getDefaultFilter("interfaceId", filters, "in") || null}
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
                style={{ minWidth: 180 }}
                placeholder="Search Interface"
                mode="multiple"
                showSearch
                allowClear
                optionLabelProp="label"
                optionFilterProp="label"
                options={interfaceOptions}
                loading={interfaceLoading}
              />
            </FilterDropdown>
          )}
          render={(value) => (
            <LinkedLabel
              resource="interfaces"
              options={interfaceOptions}
              value={value}
            />
          )}
        />
        <Table.Column
          dataIndex="capacityId"
          title={"Capacity"}
          width={130}
          sorter={{ multiple: 5 }}
          filteredValue={getDefaultFilter("capacityId", filters, "in") || null}
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
                style={{ minWidth: 130 }}
                placeholder="Search Capacity"
                mode="multiple"
                showSearch
                allowClear
                optionLabelProp="label"
                optionFilterProp="label"
                options={capacityOptions}
                loading={capacityLoading}
              />
            </FilterDropdown>
          )}
          render={(value) => (
            <LinkedLabel
              resource="capacities"
              options={capacityOptions}
              value={value}
            />
          )}
        />
        <Table.Column
          filteredValue={null}
          dataIndex="maxEnduranceTbw"
          title={"Max Endurance (TBW)"}
          width={170}
          align={"right"}
          sorter={true}
          defaultSortOrder={getDefaultSortOrder("maxEnduranceTbw", sorters)}
          render={(value) => value ?? "-"}
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
