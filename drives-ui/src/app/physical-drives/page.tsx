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
import { Button, Input, InputNumber, Select, Space, Table, Tag } from "antd";
import { ClearOutlined } from "@ant-design/icons";
import { LinkedLabel } from "@components/linked-label";
import { useLookupOptions } from "@hooks/use-lookup-options";
import { CurrencyFormatter } from "@utils/currency-formatter";

const currencyFormatter = new CurrencyFormatter();

export default function PhysicalDriveList() {
  const { tableProps, sorters, filters, setFilters } = useTable({
    sorters: {
      initial: [{ field: "displayKey", order: "asc" }],
    },
    syncWithLocation: true,
  });

  const { options: driveModelOptions, isLoading: driveModelLoading } =
    useLookupOptions({ resource: "drive-models", optionLabel: "title" });
  const { options: retailerOptions, isLoading: retailerLoading } =
    useLookupOptions({ resource: "vendors" });
  const { options: currencyOptions } = useLookupOptions({
    resource: "currencies",
    optionLabel: "code",
  });
  const { options: datacenterOptions, isLoading: datacenterLoading } =
    useLookupOptions({ resource: "datacenters", optionLabel: "name" });

  return (
    <List
      headerButtons={
        <Button
          icon={<ClearOutlined />}
          onClick={() => setFilters([], "replace")}
        >
          Clear Filters
        </Button>
      }
    >
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
          dataIndex="driveModelId"
          title={"Drive Model"}
          width={240}
          sorter={{ multiple: 1 }}
          filteredValue={
            getDefaultFilter("driveModelId", filters, "in") || null
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
                style={{ minWidth: 240 }}
                placeholder="Search Drive Model"
                mode="multiple"
                showSearch
                allowClear
                optionLabelProp="label"
                optionFilterProp="label"
                options={driveModelOptions}
                loading={driveModelLoading}
              />
            </FilterDropdown>
          )}
          render={(value) => (
            <LinkedLabel
              resource="drive-models"
              options={driveModelOptions}
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
          dataIndex="worldwideNameWwn"
          title={"WWN"}
          width={200}
          sorter={true}
          defaultSortOrder={getDefaultSortOrder("worldwideNameWwn", sorters)}
          render={(value) => value ?? "-"}
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input placeholder="Search by WWN" />
            </FilterDropdown>
          )}
        />
        <Table.Column
          dataIndex="purchaseDate"
          title={"Purchase Date"}
          width={140}
          sorter={true}
          defaultSortOrder={getDefaultSortOrder("purchaseDate", sorters)}
          render={(value) => value ?? "-"}
        />
        <Table.Column
          dataIndex="warrantyExpiryDate"
          title={"Warranty Expiry"}
          width={150}
          sorter={true}
          defaultSortOrder={getDefaultSortOrder("warrantyExpiryDate", sorters)}
          render={(value) => value ?? "-"}
        />
        <Table.Column
          dataIndex="currentLocation"
          title={"Location"}
          width={220}
          filteredValue={
            getDefaultFilter("currentLocation", filters, "in") || null
          }
          filterDropdown={(props) => (
            <FilterDropdown
              {...props}
              mapValue={(selectedKeys) => selectedKeys}
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
          render={(_, record: BaseRecord) => {
            const location = record.currentLocation as
              | { datacenterId?: string; code?: string; name?: string }
              | null
              | undefined;
            if (!location) return <Tag>Unassigned</Tag>;
            const locationLabel = [location.code, location.name]
              .filter(Boolean)
              .join(" - ");
            return (
              <LinkedLabel
                resource="datacenters"
                value={location.datacenterId}
                label={locationLabel}
                fallback="-"
              />
            );
          }}
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
