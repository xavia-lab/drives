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
import {
  PURCHASE_ORDER_TYPE_OPTIONS,
  PurchaseOrderType,
} from "@purchase-orders/components/purchase-order-type";
import { FilterOutlined, ReloadOutlined } from "@ant-design/icons";

import customParseFormat from "dayjs/plugin/customParseFormat";
import {
  APPROVAL_STATUS_OPTIONS,
  ApprovalStatus,
} from "@components/approval-status";
dayjs.extend(customParseFormat);

const { RangePicker } = DatePicker;

export default function PurchaseOrderList() {
  const { result, tableProps, sorters, filters, setFilters } = useTable({
    sorters: {
      initial: [{ field: "id", order: "asc" }],
    },
    syncWithLocation: true,
    filters: {
      initial: [
        {
          field: "purchaseDate", // Ensure this matches your API field name
          value: [
            dayjs().subtract(30, "days").format("YYYY-MM-DD"),
            dayjs().add(1, "days").format("YYYY-MM-DD"),
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
          field: "purchaseDate",
          value: [
            dayjs().subtract(30, "days").format("YYYY-MM-DD"),
            dayjs().add(1, "days").format("YYYY-MM-DD"),
          ],
          operator: "between",
        },
      ],
      "replace",
    );
  };

  const {
    result: { data: currencies },
    query: { isLoading: currencyIsLoading },
  } = useMany({
    resource: "currencies",
    ids:
      result?.data
        ?.map((item: any) => item?.pricingCurrencyId)
        .filter(Boolean) ?? [],
    queryOptions: {
      enabled: !!result?.data,
    },
  });

  const {
    result: { data: quantityUnits },
    query: { isLoading: quantityUnitIsLoading },
  } = useMany({
    resource: "quantity-units",
    ids:
      result?.data
        ?.map((item: any) => item?.metalPriceUnitId)
        .filter(Boolean) ?? [],
    queryOptions: {
      enabled: !!result?.data,
    },
  });

  const {
    result: { data: metals },
    query: { isLoading: metalIsLoading },
  } = useMany({
    resource: "metals",
    ids: result?.data?.map((item: any) => item?.metalId).filter(Boolean) ?? [],
    queryOptions: {
      enabled: !!result?.data,
    },
  });

  const {
    result: { data: vendors },
    query: { isLoading: vendorIsLoading },
  } = useMany({
    resource: "vendors",
    ids: result?.data?.map((item: any) => item?.vendorId).filter(Boolean) ?? [],
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
        ?.map((item: any) => item?.latestApproval?.[0]?.approval?.userId)
        .filter(Boolean) ?? [],
    queryOptions: {
      enabled: !!result?.data,
    },
  });

  return (
    <List
      headerButtons={({ defaultButtons }) => (
        <>
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
          {/* This renders the default "Create" button automatically */}
          {defaultButtons}
        </>
      )}
    >
      <Table {...tableProps} rowKey="id">
        <Table.Column
          dataIndex="id"
          title={"ID"}
          sorter={true}
          defaultSortOrder={getDefaultSortOrder("id", sorters)}
        />
        <Table.Column
          dataIndex="poNumber"
          title={"PO Number"}
          sorter={true}
          defaultSortOrder={getDefaultSortOrder("poNumber", sorters)}
          // Custom Filter Dropdown
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input placeholder="Search by Purchase Order Number" />
            </FilterDropdown>
          )}
        />
        <Table.Column
          dataIndex="purchaseDate"
          title={"Purchase Date"}
          render={(value: any) => <DateField value={value} />}
          sorter={true}
          filteredValue={
            getDefaultFilter("purchaseDate", filters, "between") || null
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
                          values[0]!.format("YYYY-MM-DD"),
                          values[1]!.format("YYYY-MM-DD"),
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
            "purchaseDate",
            filters,
            "between",
          )}
        />
        <Table.Column
          dataIndex="purchaseType"
          key="purchaseType"
          title={"Purchase Type"}
          sorter={true}
          defaultSortOrder={getDefaultSortOrder("purchaseType", sorters)}
          render={(value) => <PurchaseOrderType value={value} />}
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Select
                style={{ minWidth: 150 }}
                mode="multiple"
                placeholder="Select Purchase Type"
                options={PURCHASE_ORDER_TYPE_OPTIONS}
              />
            </FilterDropdown>
          )}
        />
        <Table.Column
          dataIndex={"metalId"}
          title={"Metal"}
          sorter={true}
          render={(value) =>
            metalIsLoading ? (
              <>Loading...</>
            ) : (
              metals?.find((item) => item.id === value)?.title
            )
          }
        />
        <Table.Column
          dataIndex="metalPriceValue"
          title={"Metal Price"}
          align={"right"}
          sorter={true}
          defaultSortOrder={getDefaultSortOrder("metalPriceValue", sorters)}
          render={(value) =>
            value !== undefined ? `${Number(value).toFixed(2)}` : "-"
          }
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input placeholder="Search by Metal Price" />
            </FilterDropdown>
          )}
        />
        <Table.Column
          dataIndex={"pricingCurrencyId"}
          title={"Pricing Currency"}
          render={(value) =>
            currencyIsLoading ? (
              <>Loading...</>
            ) : (
              currencies?.find((item) => item.id === value)?.title
            )
          }
        />
        <Table.Column
          dataIndex={"metalPriceUnitId"}
          title={"Pricing Unit"}
          render={(value) =>
            quantityUnitIsLoading ? (
              <>Loading...</>
            ) : (
              quantityUnits?.find((item) => item.id === value)?.title
            )
          }
        />
        <Table.Column
          dataIndex={"vendorId"}
          title={"Vendor"}
          sorter={true}
          render={(value) =>
            vendorIsLoading ? (
              <>Loading...</>
            ) : (
              vendors?.find((item) => item.id === value)?.title
            )
          }
        />
        <Table.Column
          dataIndex={["latestApproval", "0", "approval", "userId"]}
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
          title="Status"
          // Ensure this index matches what your API expects for filtering
          dataIndex={["latestApproval", "0", "approval", "status"]}
          key="status"
          render={(_, record) => {
            const currentState =
              record.latestApproval?.[0]?.approval?.status || "UNKNOWN";
            return <ApprovalStatus value={currentState} />;
          }}
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Select
                style={{ minWidth: 150 }}
                mode="multiple"
                placeholder="Select Status"
                options={APPROVAL_STATUS_OPTIONS}
              />
            </FilterDropdown>
          )}
        />
        <Table.Column
          title={"Actions"}
          dataIndex="actions"
          render={(_, record) => {
            // Logic: Only DRAFT can be edited
            const isDraft =
              record.latestApproval?.[0]?.approval?.status === "DRAFT";

            return (
              <Space>
                <EditButton
                  hideText
                  size="small"
                  recordItemId={record.id}
                  disabled={!isDraft}
                />
                <ShowButton hideText size="small" recordItemId={record.id} />
                <DeleteButton
                  hideText
                  size="small"
                  recordItemId={record.id}
                  disabled={!isDraft}
                />
              </Space>
            );
          }}
        />
      </Table>
    </List>
  );
}
