"use client";

import { Row, Col, Card, Statistic, Table, Typography } from "antd";
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  ShoppingCartOutlined,
  InboxOutlined,
  UserOutlined,
} from "@ant-design/icons";

const { Title } = Typography;

export default function DashboardMainPage() {
  return (
    <div style={{ padding: "24px" }}>
      <Title level={3}>Inventory & Sales Overview</Title>

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
        <Col span={16}>
          <Card title="Recent Transactions" bordered={false}>
            <Table
              dataSource={placeholderData}
              columns={columns}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="Inventory Alerts" bordered={false}>
            <p>Low stock items will appear here...</p>
          </Card>
        </Col>
      </Row>
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
