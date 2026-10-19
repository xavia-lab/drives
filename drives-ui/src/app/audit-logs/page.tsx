"use client";

import { useMemo, useState } from "react";
import { useLogList, useMenu, type TreeMenuItem } from "@refinedev/core";
import { List } from "@refinedev/antd";
import {
  Button,
  Descriptions,
  Empty,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import type { RefineAuditLog } from "@providers/audit-log-provider";

const ACTION_COLORS: Record<string, string> = {
  create: "green",
  update: "blue",
  delete: "red",
};

const formatTimestamp = (value?: string) =>
  value ? new Date(value).toLocaleString() : "-";

const renderJson = (value: unknown) =>
  value === null || value === undefined ? (
    <Typography.Text type="secondary">-</Typography.Text>
  ) : (
    <pre style={{ margin: 0, maxHeight: 240, overflow: "auto", fontSize: 12 }}>
      {JSON.stringify(value, null, 2)}
    </pre>
  );

export default function AuditLogList() {
  const [resource, setResource] = useState<string>();
  const [action, setAction] = useState<string>();

  const { menuItems } = useMenu();

  const resourceOptions = useMemo(() => {
    const names: string[] = [];
    const walk = (items: TreeMenuItem[]) => {
      items.forEach((item) => {
        if (item.list) names.push(item.name);
        if (item.children?.length) walk(item.children);
      });
    };
    walk(menuItems);

    return Array.from(new Set(names))
      .sort()
      .map((name) => ({ label: name, value: name }));
  }, [menuItems]);

  const { data, isLoading, refetch } = useLogList<RefineAuditLog[]>({
    resource: resource ?? "",
    action,
    meta: { pageSize: 100, sortField: "timestamp", sortOrder: "desc" },
    queryOptions: { refetchOnWindowFocus: false },
  });

  const logs = data ?? [];

  return (
    <List
      title="Audit Logs"
      headerButtons={
        <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
          Refresh
        </Button>
      }
    >
      <Space wrap style={{ marginBottom: 16 }}>
        <Select
          allowClear
          showSearch
          placeholder="Filter by resource"
          style={{ minWidth: 220 }}
          options={resourceOptions}
          value={resource}
          onChange={(value) => setResource(value)}
        />
        <Select
          allowClear
          placeholder="Filter by action"
          style={{ minWidth: 160 }}
          value={action}
          onChange={(value) => setAction(value)}
          options={[
            { label: "Create", value: "create" },
            { label: "Update", value: "update" },
            { label: "Delete", value: "delete" },
          ]}
        />
      </Space>

      <Table
        rowKey="id"
        dataSource={logs}
        loading={isLoading}
        pagination={{ pageSize: 20, showSizeChanger: true }}
        locale={{ emptyText: <Empty description="No audit entries" /> }}
        scroll={{ x: "max-content" }}
        expandable={{
          expandedRowRender: (record: RefineAuditLog) => (
            <Descriptions
              bordered
              size="small"
              column={1}
              items={[
                {
                  key: "previous",
                  label: "Previous",
                  children: renderJson(record.previousData),
                },
                {
                  key: "current",
                  label: "Current",
                  children: renderJson(record.data),
                },
              ]}
            />
          ),
        }}
      >
        <Table.Column
          dataIndex="createdAt"
          title="Timestamp"
          width={200}
          render={(value) => formatTimestamp(value)}
        />
        <Table.Column
          dataIndex="action"
          title="Action"
          width={120}
          render={(value: string) => (
            <Tag color={ACTION_COLORS[value] ?? "default"}>
              {value?.toUpperCase()}
            </Tag>
          )}
        />
        <Table.Column dataIndex="resource" title="Resource" width={200} />
        <Table.Column
          dataIndex="resourceId"
          title="Record"
          width={320}
          render={(value: string) => (
            <Typography.Text code copyable={{ text: value }} ellipsis>
              {value}
            </Typography.Text>
          )}
        />
        <Table.Column
          dataIndex="author"
          title="User"
          width={320}
          render={(author?: RefineAuditLog["author"]) =>
            author ? (
              <Typography.Text
                copyable={{ text: author.id }}
                ellipsis
                style={{ maxWidth: 300 }}
              >
                {author.name ?? author.id}
              </Typography.Text>
            ) : (
              <Typography.Text type="secondary">system</Typography.Text>
            )
          }
        />
      </Table>
    </List>
  );
}
