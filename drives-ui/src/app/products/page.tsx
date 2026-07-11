"use client";

import {
  DateField,
  DeleteButton,
  EditButton,
  FilterDropdown,
  getDefaultFilter,
  getDefaultSortOrder,
  List,
  ShowButton,
  useTable,
} from "@refinedev/antd";
import { type BaseRecord, useMany } from "@refinedev/core";
import { Button, DatePicker, Input, Select, Space, Table, Tooltip } from "antd";
import dayjs from "dayjs";
import { FilterOutlined, ReloadOutlined } from "@ant-design/icons";
import customParseFormat from "dayjs/plugin/customParseFormat";
import {
  PRODUCT_STATUS_OPTIONS,
  ProductStatus,
} from "@products/components/product-status";
dayjs.extend(customParseFormat);

const { RangePicker } = DatePicker;

export default function ProductList() {
  const { result, tableProps, sorters, filters, setFilters } = useTable({
    sorters: {
      initial: [{ field: "id", order: "asc" }],
    },
    syncWithLocation: true,
    filters: {
      initial: [
        {
          field: "createdAt", // Ensure this matches your API field name
          value: [
            dayjs().subtract(30, "days").startOf("day").toISOString(),
            dayjs().endOf("day").toISOString(),
          ],
          operator: "between",
        },
      ],
    },
  });

  // Function to wipe everything (Empty list/URL)
  const handleClearAll = () => {
    setFilters([], "replace");
  };

  // Function to go back to your 30-day window
  const handleResetToDefault = () => {
    setFilters(
      [
        {
          field: "createdAt",
          value: [
            dayjs().subtract(30, "days").startOf("day").toISOString(),
            dayjs().endOf("day").toISOString(),
          ],
          operator: "between",
        },
      ],
      "replace",
    );
  };

  const {
    result: { data: colors },
    query: { isLoading: colorIsLoading },
  } = useMany({
    resource: "colors",
    ids: result?.data?.map((item: any) => item?.colorId).filter(Boolean) ?? [],
    queryOptions: {
      enabled: !!result?.data,
    },
  });

  const {
    result: { data: categories },
    query: { isLoading: categoryIsLoading },
  } = useMany({
    resource: "categories",
    ids:
      result?.data?.map((item: any) => item?.categoryId).filter(Boolean) ?? [],
    queryOptions: {
      enabled: !!result?.data,
    },
  });

  const {
    result: { data: materials },
    query: { isLoading: materialIsLoading },
  } = useMany({
    resource: "materials",
    ids:
      result?.data?.map((item: any) => item?.materialId).filter(Boolean) ?? [],
    queryOptions: {
      enabled: !!result?.data,
    },
  });

  const {
    result: { data: weightUnits },
    query: { isLoading: weightIsLoading },
  } = useMany({
    resource: "quantity-units",
    ids:
      result?.data?.map((item: any) => item?.weightUnitId).filter(Boolean) ??
      [],
    queryOptions: {
      enabled: !!result?.data,
    },
  });

  const {
    result: { data: users },
    query: { isLoading: userIsLoading },
  } = useMany({
    resource: "users",
    ids:
      result?.data
        ?.map((item: any) => item?.events[0]?.userId)
        .filter(Boolean) ?? [],
    queryOptions: {
      enabled: !!result?.data,
    },
  });

  return (
    <List
      headerButtons={
        <Space size="middle">
          <span style={{ fontWeight: 500, marginRight: 8 }}>
            <strong>Filters</strong>
          </span>
          <Tooltip title="Resets the active filter to default (Last 30 days)">
            <Button icon={<ReloadOutlined />} onClick={handleResetToDefault}>
              Reset to Last 30 Days
            </Button>
          </Tooltip>
          <Tooltip title="Remove all active filters and search terms">
            <Button danger icon={<FilterOutlined />} onClick={handleClearAll}>
              Clear All
            </Button>
          </Tooltip>
        </Space>
      }
    >
      <Table {...tableProps} rowKey="id">
        <Table.Column
          dataIndex="id"
          title={"ID"}
          sorter={true}
          defaultSortOrder={getDefaultSortOrder("id", sorters)}
        />
        <Table.Column
          dataIndex="sku"
          title={"SKU Number"}
          sorter={true}
          defaultSortOrder={getDefaultSortOrder("sku", sorters)}
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input placeholder="Search by SKU Number" />
            </FilterDropdown>
          )}
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
          dataIndex="weight"
          title={"Weight"}
          align={"right"}
          sorter={true}
          defaultSortOrder={getDefaultSortOrder("weight", sorters)}
          render={(value) =>
            value !== undefined ? `${Number(value).toFixed(2)}` : "-"
          }
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input placeholder="Search by weight" />
            </FilterDropdown>
          )}
        />
        <Table.Column
          dataIndex={"weightUnitId"}
          title={"Weight Unit"}
          render={(value) =>
            weightIsLoading ? (
              <>Loading...</>
            ) : (
              weightUnits?.find((item) => item.id === value)?.title
            )
          }
        />
        <Table.Column
          dataIndex={"categoryId"}
          title={"Category"}
          render={(value) =>
            categoryIsLoading ? (
              <>Loading...</>
            ) : (
              categories?.find((item) => item.id === value)?.title
            )
          }
        />
        <Table.Column
          dataIndex={"colorId"}
          title={"Color"}
          render={(value) =>
            colorIsLoading ? (
              <>Loading...</>
            ) : (
              colors?.find((item) => item.id === value)?.title
            )
          }
        />
        <Table.Column
          dataIndex={"materialId"}
          title={"Material"}
          render={(value) =>
            materialIsLoading ? (
              <>Loading...</>
            ) : (
              materials?.find((item) => item.id === value)?.title
            )
          }
        />
        <Table.Column
          dataIndex="createdAt"
          title={"Creation Date"}
          render={(value: any) => <DateField value={value} />}
          sorter={true}
          filteredValue={
            getDefaultFilter("createdAt", filters, "between") || null
          }
          filterDropdown={(props) => {
            const { setSelectedKeys, selectedKeys, confirm, clearFilters } =
              props;

            // 1. Map Refine's string array back to Dayjs objects for the UI
            const safeValue: any =
              selectedKeys && selectedKeys.length === 2
                ? [
                    dayjs(selectedKeys[0] as string),
                    dayjs(selectedKeys[1] as string),
                  ]
                : null;

            return (
              <div style={{ padding: 8 }}>
                <RangePicker
                  value={safeValue}
                  onChange={(values) => {
                    // 2. Map Dayjs objects back to YYYY-MM-DD strings for the API
                    const stringValues = values
                      ? [
                          dayjs()
                            .subtract(30, "days")
                            .startOf("day")
                            .toISOString(),
                          dayjs().endOf("day").toISOString(),
                        ]
                      : [];
                    setSelectedKeys(stringValues);
                  }}
                  onOpenChange={(open) => {
                    if (!open) confirm(); // Save filter when closing
                  }}
                  // style={{ marginBottom: 8, display: "block" }}
                  presets={[
                    {
                      label: "Last Day",
                      value: [dayjs().subtract(1, "day"), dayjs()],
                    },
                    {
                      label: "Last 7 Days",
                      value: [dayjs().subtract(7, "days"), dayjs()],
                    },
                    {
                      label: "Last 2 Weeks",
                      value: [dayjs().subtract(2, "weeks"), dayjs()],
                    },
                    {
                      label: "Last 1 Month",
                      value: [dayjs().subtract(1, "month"), dayjs()],
                    },
                    {
                      label: "Last 3 Months",
                      value: [dayjs().subtract(3, "months"), dayjs()],
                    },
                    {
                      label: "Last 6 Months",
                      value: [dayjs().subtract(6, "months"), dayjs()],
                    },
                    {
                      label: "Last 1 Year",
                      value: [dayjs().subtract(1, "year"), dayjs()],
                    },
                  ]}
                />
                <Space>
                  <Button
                    type="primary"
                    size="small"
                    onClick={() => confirm()}
                    style={{ width: 90 }}
                  >
                    OK
                  </Button>
                  <Button
                    size="small"
                    onClick={() => {
                      if (clearFilters) clearFilters();
                      confirm();
                    }}
                    style={{ width: 90 }}
                  >
                    Reset
                  </Button>
                </Space>
              </div>
            );
          }}
          defaultFilteredValue={getDefaultFilter(
            "allocationDate",
            filters,
            "between",
          )}
        />
        <Table.Column
          title="Status"
          // Ensure this index matches what your API expects for filtering
          dataIndex={["events", "0", "eventType"]}
          key="status"
          render={(_, record) => {
            const currentState = record.events?.[0]?.eventType || "UNKNOWN";
            return <ProductStatus value={currentState} />;
          }}
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Select
                style={{ minWidth: 150 }}
                mode="multiple"
                placeholder="Select Status"
                options={PRODUCT_STATUS_OPTIONS}
              />
            </FilterDropdown>
          )}
        />
        <Table.Column
          dataIndex={["events", "0", "userId"]}
          title={"Actioned By"}
          sorter={true}
          render={(value) =>
            userIsLoading ? (
              <>Loading...</>
            ) : (
              users?.find((item) => item.id === value)?.title
            )
          }
        />
        <Table.Column
          title={"Actions"}
          dataIndex="actions"
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
