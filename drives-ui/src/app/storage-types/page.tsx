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
import { Space, Table, Input } from "antd";
import { ProviderTag } from "@components/provider-tag";
import { CheckCircleFilled, CloseCircleFilled } from "@ant-design/icons";

export default function StorageTypeList() {
  const { tableProps, sorters, filters } = useTable({
    sorters: {
      initial: [{ field: "id", order: "asc" }],
    },
    syncWithLocation: true, // Persists state in the URL
  });

  return (
    <List>
      <Table {...tableProps} rowKey="id">
        <Table.Column
          dataIndex="itemNumber"
          title={"#"}
          width={70}
          align={"right"}
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
          dataIndex="wearTrackable"
          title={"Wear Trackable"}
          width={150}
          render={(value) =>
            value ? (
              <CheckCircleFilled style={{ color: "#52c41a" }} />
            ) : (
              <CloseCircleFilled style={{ color: "#ff4d4f" }} />
            )
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
