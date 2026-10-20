"use client";

import {
  DateField,
  DeleteButton,
  EditButton,
  FilterDropdown,
  List,
  ShowButton,
  getDefaultSortOrder,
  useTable,
} from "@refinedev/antd";
import type { BaseRecord } from "@refinedev/core";
import { Select, Space, Table, Typography } from "antd";
import { LinkedLabel } from "@components/linked-label";
import { LookupSelect } from "@components/lookup-select";
import {
  WARRANTY_CLAIM_STATUS_OPTIONS,
  WarrantyClaimStatusTag,
} from "@app/warranty-claims/_components/warranty-claim-status-tag";

const { Text } = Typography;

export default function WarrantyClaimList() {
  const { tableProps, sorters } = useTable({
    sorters: {
      initial: [{ field: "displayKey", order: "asc" }],
    },
    syncWithLocation: true,
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
        />
        <Table.Column
          dataIndex="physicalDriveId"
          title={"Drive"}
          filterDropdown={(props) => (
            <FilterDropdown
              {...props}
              mapValue={(selectedKeys) => selectedKeys?.[0]}
            >
              <LookupSelect
                resource="physical-drives"
                optionLabel="serialNumber"
                placeholder="Search drive"
              />
            </FilterDropdown>
          )}
          render={(_, record: BaseRecord) => {
            const drive = record.physicalDrive as
              { serialNumber?: string } | undefined;
            return (
              <LinkedLabel
                resource="physical-drives"
                value={record.physicalDriveId}
                label={drive?.serialNumber}
                fallback="-"
              />
            );
          }}
        />
        <Table.Column
          dataIndex="handledByVendorId"
          title={"Vendor"}
          filterDropdown={(props) => (
            <FilterDropdown
              {...props}
              mapValue={(selectedKeys) => selectedKeys?.[0]}
            >
              <LookupSelect resource="vendors" placeholder="Search vendor" />
            </FilterDropdown>
          )}
          render={(_, record: BaseRecord) => {
            const vendor = record.handledByVendor as
              { name?: string } | undefined;
            return (
              <LinkedLabel
                resource="vendors"
                value={record.handledByVendorId}
                label={vendor?.name}
                fallback="-"
              />
            );
          }}
        />
        <Table.Column
          dataIndex="rmaTrackingNumber"
          title={"RMA Tracking #"}
          render={(value: string | null) =>
            value ? <Text copyable>{value}</Text> : "-"
          }
        />
        <Table.Column
          dataIndex="currentStatus"
          title={"Status"}
          width={180}
          filterDropdown={(props) => (
            <FilterDropdown
              {...props}
              mapValue={(selectedKeys) => selectedKeys?.[0]}
            >
              <Select
                allowClear
                placeholder="Filter by status"
                options={[...WARRANTY_CLAIM_STATUS_OPTIONS]}
              />
            </FilterDropdown>
          )}
          render={(_, record: BaseRecord) => (
            <WarrantyClaimStatusTag status={record.currentStatus as string} />
          )}
        />
        <Table.Column
          dataIndex="openedAt"
          title={"Opened"}
          render={(value: string | null) =>
            value ? <DateField value={value} format="LLL" /> : "-"
          }
        />
        <Table.Column
          dataIndex="resolvedAt"
          title={"Resolved"}
          render={(value: string | null) =>
            value ? <DateField value={value} format="LLL" /> : "-"
          }
        />
        <Table.Column
          title={"Actions"}
          dataIndex="actions"
          width={160}
          render={(_, record: BaseRecord) => (
            <Space>
              <ShowButton hideText size="small" recordItemId={record.id} />
              <EditButton hideText size="small" recordItemId={record.id} />
              <DeleteButton hideText size="small" recordItemId={record.id} />
            </Space>
          )}
        />
      </Table>
    </List>
  );
}
