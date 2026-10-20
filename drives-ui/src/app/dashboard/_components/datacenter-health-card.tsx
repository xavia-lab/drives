"use client";

import Link from "next/link";
import { Space, Table, Tag, Typography, theme } from "antd";
import type { TableProps } from "antd";
import { ClusterOutlined } from "@ant-design/icons";
import { InsightCard } from "./insight-card";
import type { DatacenterHealth, DatacenterHealthSummary } from "./types";

const { Text } = Typography;

const Count = ({ value, color }: { value: number; color?: string }) => (
  <span style={{ color: value > 0 ? color : undefined, fontWeight: 600 }}>
    {value}
  </span>
);

export const DatacenterHealthCard = ({
  health,
}: {
  health: DatacenterHealthSummary;
}) => {
  const { token } = theme.useToken();

  const columns: TableProps<DatacenterHealth>["columns"] = [
    {
      title: "Datacenter",
      dataIndex: "code",
      key: "code",
      fixed: "left",
      width: 220,
      render: (_value, record) => (
        <Link href={`/datacenters/show/${record.datacenterId}`}>
          <Text strong>{record.code}</Text>
          <Text
            type="secondary"
            ellipsis
            style={{ display: "block", fontSize: 11 }}
          >
            {record.name}
          </Text>
        </Link>
      ),
    },
    {
      title: "Drives",
      dataIndex: "drives",
      key: "drives",
      align: "right",
      width: 80,
      render: (value: number) => <Text strong>{value}</Text>,
    },
    {
      title: "In service",
      dataIndex: "inService",
      key: "inService",
      align: "right",
      width: 96,
      render: (value: number) => (
        <Count value={value} color={token.colorSuccess} />
      ),
    },
    {
      title: "Degraded",
      dataIndex: "degraded",
      key: "degraded",
      align: "right",
      width: 96,
      render: (value: number) => (
        <Count value={value} color={token.colorWarning} />
      ),
    },
    {
      title: "Failed",
      dataIndex: "failed",
      key: "failed",
      align: "right",
      width: 84,
      render: (value: number) => (
        <Count value={value} color={token.colorError} />
      ),
    },
    {
      title: "In RMA",
      dataIndex: "inRma",
      key: "inRma",
      align: "right",
      width: 84,
      render: (value: number) => <Count value={value} color="#722ed1" />,
    },
    {
      title: "Unseated",
      dataIndex: "unseated",
      key: "unseated",
      align: "right",
      width: 96,
      render: (value: number) => (
        <Count value={value} color={token.colorWarning} />
      ),
    },
    {
      title: "Slots used",
      key: "slots",
      align: "right",
      width: 110,
      render: (_value, record) => (
        <Space size={4}>
          <Text strong>{record.occupiedSlots}</Text>
          <Text type="secondary">/ {record.totalSlots}</Text>
        </Space>
      ),
    },
  ];

  return (
    <InsightCard
      title="Datacenter Health Matrix"
      subtitle="Drive state and bay usage by facility"
      icon={<ClusterOutlined />}
      extra={
        <Tag
          color={health.unassignedDrives > 0 ? "warning" : "default"}
          style={{ marginInlineEnd: 0 }}
        >
          {health.unassignedDrives} unassigned
        </Tag>
      }
    >
      <Table<DatacenterHealth>
        dataSource={health.datacenters}
        columns={columns}
        rowKey="datacenterId"
        size="small"
        pagination={false}
        scroll={{ x: 760 }}
      />
    </InsightCard>
  );
};
