"use client";

import { Row, Col, Card, Statistic, Table, Typography, Space } from "antd";
import { ShoppingCartOutlined, InboxOutlined } from "@ant-design/icons";
import { WorkflowLauncher } from "@components/workflow";
import { WORKFLOWS } from "@workflows/registry";

const { Title } = Typography;

export default function DashboardMainPage() {
  return (
    <div style={{ padding: "24px" }}>
      <Space direction="vertical" size="large" style={{ display: "flex" }}>
        <WorkflowLauncher workflows={WORKFLOWS} />

        <div>
          <Title level={3} style={{ marginTop: 0 }}>
            Inventory & Sales Overview
          </Title>

          {/* Metric Widgets */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Card bordered={false} hoverable>
                <Statistic
                  title="Total Sales"
                  value={112893}
                  precision={2}
                  valueStyle={{ color: "#3f8600" }}
                  prefix={<ShoppingCartOutlined />}
                  suffix="$"
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card bordered={false} hoverable>
                <Statistic
                  title="Stock Levels"
                  value={425}
                  valueStyle={{ color: "#cf1322" }}
                  prefix={<InboxOutlined />}
                />
              </Card>
            </Col>
            {/* Add more metrics as needed */}
          </Row>

          {/* Tables and Charts Placeholders */}
          <Row gutter={[16, 16]} style={{ marginTop: "24px" }}>
            <Col xs={24} xl={16}>
              <Card title="Recent Transactions" bordered={false}>
                <Table
                  dataSource={placeholderData}
                  columns={columns}
                  pagination={false}
                  size="small"
                />
              </Card>
            </Col>
            <Col xs={24} xl={8}>
              <Card title="Inventory Alerts" bordered={false}>
                <p>Low stock items will appear here...</p>
              </Card>
            </Col>
          </Row>
        </div>
      </Space>
    </div>
  );
}

const placeholderData = [
  { key: "1", item: "Product A", qty: 5, price: "$50" },
  { key: "2", item: "Product B", qty: 2, price: "$20" },
];

const columns = [
  { title: "Item", dataIndex: "item", key: "item" },
  { title: "Qty", dataIndex: "qty", key: "qty" },
  { title: "Price", dataIndex: "price", key: "price" },
];
