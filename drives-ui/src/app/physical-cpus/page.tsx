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
import { CurrencyFormatter } from "@utils/currency-formatter";

const currencyFormatter = new CurrencyFormatter();

export default function PhysicalCpuList() {
  const { searchFormProps, tableProps, sorters, filters } = useTable({
    sorters: {
      initial: [{ field: "displayKey", order: "asc" }],
    },
    syncWithLocation: true,
  });

  const { options: cpuModelOptions, isLoading: cpuModelLoading } =
    useLookupOptions({ resource: "cpu-models", optionLabel: "name" });
  const { options: retailerOptions, isLoading: retailerLoading } =
    useLookupOptions({ resource: "vendors" });
  const { options: currencyOptions } = useLookupOptions({
    resource: "currencies",
    optionLabel: "code",
  });

  return (
    <List title={"Physical CPUs"}>
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
          filteredValue={getDefaultFilter("label", filters) || null}
          dataIndex="label"
          title={"Label"}
          width={220}
          sorter={true}
          defaultSortOrder={getDefaultSortOrder("label", sorters)}
          render={(value) => value ?? "-"}
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input placeholder="Search by Label" />
            </FilterDropdown>
          )}
        />
        <Table.Column
          filteredValue={getDefaultFilter("serialNumber", filters) || null}
          dataIndex="serialNumber"
          title={"Serial Number"}
          width={180}
          sorter={true}
          defaultSortOrder={getDefaultSortOrder("serialNumber", sorters)}
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input placeholder="Search by Serial Number" />
            </FilterDropdown>
          )}
        />
        <Table.Column
          dataIndex="cpuModelId"
          title={"CPU Model"}
          width={240}
          sorter={{ multiple: 1 }}
          filteredValue={getDefaultFilter("cpuModelId", filters, "in") || null}
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
                style={{ minWidth: 240 }}
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
          render={(value) => (
            <LinkedLabel
              resource="cpu-models"
              options={cpuModelOptions}
              value={value}
            />
          )}
        />
        <Table.Column
          dataIndex="retailerVendorId"
          title={"Retailer"}
          width={180}
          sorter={{ multiple: 2 }}
          filteredValue={
            getDefaultFilter("retailerVendorId", filters, "in") || null
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
                style={{ minWidth: 180 }}
                placeholder="Search Retailer"
                mode="multiple"
                showSearch
                allowClear
                optionLabelProp="label"
                optionFilterProp="label"
                options={retailerOptions}
                loading={retailerLoading}
              />
            </FilterDropdown>
          )}
          render={(value) => (
            <LinkedLabel
              resource="vendors"
              options={retailerOptions}
              value={value}
            />
          )}
        />
        <Table.Column
          filteredValue={null}
          dataIndex="acquisitionCost"
          title={"Acquisition Cost"}
          width={160}
          align={"right"}
          sorter={true}
          defaultSortOrder={getDefaultSortOrder("acquisitionCost", sorters)}
          render={(value, record: BaseRecord) => {
            if (value === undefined || value === null) return "-";
            const currencyCode = currencyOptions.find(
              (option) => option.value === record.currencyId,
            )?.label;
            return currencyFormatter.format(Number(value), currencyCode, {
              withSymbol: true,
            });
          }}
        />
        <Table.Column
          filteredValue={null}
          dataIndex="purchaseDate"
          title={"Purchase Date"}
          width={140}
          sorter={true}
          defaultSortOrder={getDefaultSortOrder("purchaseDate", sorters)}
          render={(value) => value ?? "-"}
        />
        <Table.Column
          filteredValue={null}
          dataIndex="warrantyExpiryDate"
          title={"Warranty Expiry"}
          width={150}
          sorter={true}
          defaultSortOrder={getDefaultSortOrder("warrantyExpiryDate", sorters)}
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
