"use client";

import {
  DeleteButton,
  EditButton,
  List,
  ShowButton,
  useTable,
  getDefaultSortOrder,
  getDefaultFilter,
  FilterDropdown,
} from "@refinedev/antd";
import type { BaseRecord } from "@refinedev/core";
import { Input, InputNumber, Select, Space, Table, Tag } from "antd";
import { LinkedLabel } from "@components/linked-label";
import { useLookupOptions } from "@hooks/use-lookup-options";
import { CheckCircleFilled, CloseCircleFilled } from "@ant-design/icons";

export default function StoragePoolList() {
  const { tableProps, sorters, filters } = useTable({
    sorters: {
      initial: [{ field: "displayKey", order: "asc" }],
    },
    syncWithLocation: true,
  });

  const { options: poolTypeOptions, isLoading: poolTypeLoading } =
    useLookupOptions({ resource: "pool-types" });

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
          dataIndex="poolName"
          title={"Pool Name"}
          sorter={true}
          defaultSortOrder={getDefaultSortOrder("poolName", sorters)}
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input placeholder="Search by Pool Name" />
            </FilterDropdown>
          )}
        />
        <Table.Column
          dataIndex="poolTypeId"
          title={"Pool Type"}
          width={180}
          filteredValue={getDefaultFilter("poolTypeId", filters, "in") || null}
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Select
                style={{ minWidth: 180 }}
                placeholder="Search Pool Type"
                mode="multiple"
                showSearch
                allowClear
                optionLabelProp="label"
                optionFilterProp="label"
                options={poolTypeOptions}
                loading={poolTypeLoading}
              />
            </FilterDropdown>
          )}
          render={(value) => (
            <LinkedLabel
              resource="pool-types"
              options={poolTypeOptions}
              value={value}
            />
          )}
        />
        <Table.Column
          key="target"
          title={"Target"}
          width={240}
          render={(_, record: BaseRecord) => {
            if (record.serverId) {
              const server = record.server as BaseRecord | undefined;
              return (
                <Space size={4}>
                  <Tag color="geekblue">Physical</Tag>
                  <LinkedLabel
                    resource="physical-servers"
                    value={record.serverId}
                    label={server?.hostname as string | undefined}
                  />
                </Space>
              );
            }
            const virtualServer = record.virtualServer as
              BaseRecord | undefined;
            return (
              <Space size={4}>
                <Tag color="purple">Virtual</Tag>
                <LinkedLabel
                  resource="virtual-servers"
                  value={record.virtualServerId}
                  label={virtualServer?.hostname as string | undefined}
                  fallback="-"
                />
              </Space>
            );
          }}
        />
        <Table.Column
          dataIndex="encryptionEnabled"
          title={"Encryption"}
          width={110}
          align={"center"}
          render={(value) =>
            value ? (
              <CheckCircleFilled style={{ color: "#52c41a" }} />
            ) : (
              <CloseCircleFilled style={{ color: "#ff4d4f" }} />
            )
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
