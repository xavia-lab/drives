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
import type { BaseRecord } from "@refinedev/core";
import { Input, InputNumber, Space, Table } from "antd";
import { ProviderTag } from "@components/provider-tag";

export default function FormFactorList() {
  const { tableProps, sorters, filters } = useTable({
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
          width={70} // Slightly wider to support numbers comfortably
          align={"right"}
          sorter={true}
          defaultSortOrder={getDefaultSortOrder("displayKey", sorters)}
          // 🌟 FIX: Force numeric mapping and clear out text operators
          filterDropdown={(props) => (
            <FilterDropdown
              {...props}
              mapValue={(value) => Number(value) || undefined} // Cast input to a strict number
            >
              <InputNumber
                placeholder="DisplayKey #"
                style={{ width: "100%" }}
                controls={false} // Hides the tiny up/down spinner arrows
              />
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
          dataIndex="slotPitch"
          title={"Slot Pitch (mm)"}
          align={"right"}
          sorter={true}
          defaultSortOrder={getDefaultSortOrder("slotPitch", sorters)}
          render={(value) =>
            value !== undefined ? `${Number(value).toFixed(2)}` : "-"
          }
          filterDropdown={(props) => (
            <FilterDropdown {...props}>
              <Input placeholder="Search by Slot Pitch" />
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
