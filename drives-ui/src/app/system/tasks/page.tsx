"use client";

import { useMemo, useState } from "react";
import { useApiUrl, useCustom, useCustomMutation } from "@refinedev/core";
import { Alert, App, Button, Card, Space, Table, Tag, Typography } from "antd";
import type { TableProps } from "antd";
import {
  PlayCircleOutlined,
  ReloadOutlined,
  ScheduleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const { Text } = Typography;

type BackgroundTaskRunStatus = "RUNNING" | "SUCCEEDED" | "FAILED" | "SKIPPED";

type BackgroundTask = {
  key: string;
  name: string;
  description: string;
  schedule: string;
  enabled: boolean;
  lastRunAt: string | null;
  lastStatus: BackgroundTaskRunStatus | null;
  lastDurationMs: number | null;
  lastError: string | null;
  running: boolean;
  nextRunAt: string | null;
};

const RUN_STATUS_META: Record<
  BackgroundTaskRunStatus,
  { color: string; label: string }
> = {
  RUNNING: { color: "processing", label: "Running" },
  SUCCEEDED: { color: "green", label: "Succeeded" },
  FAILED: { color: "red", label: "Failed" },
  SKIPPED: { color: "default", label: "Skipped" },
};

const formatRunTime = (value: string | null, fallback: string) => {
  if (!value) return fallback;
  return `${dayjs(value).format("YYYY-MM-DD HH:mm:ss")} (${dayjs(value).fromNow()})`;
};

export default function TasksPage() {
  const apiUrl = useApiUrl();
  const { message } = App.useApp();
  const [runningKey, setRunningKey] = useState<string | null>(null);

  const { query, result } = useCustom({
    url: `${apiUrl}/tasks`,
    method: "get",
  });
  const tasks = useMemo<BackgroundTask[]>(
    () =>
      Array.isArray(result?.data) ? (result.data as BackgroundTask[]) : [],
    [result],
  );

  const { mutateAsync: runTask } = useCustomMutation();

  const handleRun = async (task: BackgroundTask) => {
    setRunningKey(task.key);
    try {
      await runTask({
        url: `${apiUrl}/tasks/${task.key}/run`,
        method: "post",
        values: {},
      });
      message.success(`${task.name} completed`);
      await query.refetch();
    } catch (error) {
      const detail = (error as { message?: string | string[] })?.message;
      message.error(
        Array.isArray(detail)
          ? detail.join(", ")
          : (detail ?? `Could not run ${task.name}`),
      );
    } finally {
      setRunningKey(null);
    }
  };

  const columns: TableProps<BackgroundTask>["columns"] = [
    {
      title: "Task",
      dataIndex: "name",
      key: "name",
      render: (_value, task) => (
        <Space direction="vertical" size={0}>
          <Text strong>{task.name}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {task.description}
          </Text>
        </Space>
      ),
    },
    {
      title: "Schedule",
      dataIndex: "schedule",
      key: "schedule",
      width: 180,
    },
    {
      title: "Last run",
      dataIndex: "lastRunAt",
      key: "lastRunAt",
      width: 260,
      render: (value: string | null, task) => (
        <Space direction="vertical" size={0}>
          <span>{formatRunTime(value, "Never")}</span>
          {task.lastDurationMs !== null ? (
            <Text type="secondary" style={{ fontSize: 11 }}>
              {task.lastDurationMs} ms
            </Text>
          ) : null}
        </Space>
      ),
    },
    {
      title: "Next run",
      dataIndex: "nextRunAt",
      key: "nextRunAt",
      width: 260,
      render: (value: string | null) => formatRunTime(value, "Not scheduled"),
    },
    {
      title: "Status",
      dataIndex: "enabled",
      key: "enabled",
      width: 100,
      render: (enabled: boolean, task) => {
        const meta = task.lastStatus ? RUN_STATUS_META[task.lastStatus] : null;
        return (
          <Space size={4} wrap>
            <Tag color={enabled ? "green" : "default"}>
              {enabled ? "Enabled" : "Disabled"}
            </Tag>
            {meta ? (
              <Tag color={meta.color} title={task.lastError ?? undefined}>
                {meta.label}
              </Tag>
            ) : (
              <Tag>Never run</Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 130,
      render: (_value, task) => (
        <Button
          size="small"
          icon={<PlayCircleOutlined />}
          loading={runningKey === task.key || task.running}
          disabled={!task.enabled || runningKey !== null || task.running}
          onClick={() => handleRun(task)}
        >
          Run now
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={
          <Space>
            <ScheduleOutlined />
            <span>Background Tasks</span>
          </Space>
        }
        extra={
          <Button
            size="small"
            icon={<ReloadOutlined />}
            onClick={() => query.refetch()}
            loading={query.isFetching}
          >
            Refresh
          </Button>
        }
      >
        {query.isLoading ? (
          <Table loading columns={columns} dataSource={[]} rowKey="key" />
        ) : query.isError ? (
          <Alert
            type="error"
            showIcon
            message="Could not load background tasks"
            description="Check that the API is running and try again."
            action={
              <Button
                size="small"
                icon={<ReloadOutlined />}
                onClick={() => query.refetch()}
              >
                Retry
              </Button>
            }
          />
        ) : (
          <Table
            columns={columns}
            dataSource={tasks}
            rowKey="key"
            pagination={false}
            size="middle"
          />
        )}
      </Card>
    </div>
  );
}
