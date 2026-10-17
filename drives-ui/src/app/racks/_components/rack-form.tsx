"use client";

import { LookupSelect } from "@components/lookup-select";
import { Card, Col, Form, Input, InputNumber, Row, Space } from "antd";
import type { FormProps } from "antd";

const NAME_RULES = [
  { required: true, message: "Name is required" },
  { max: 32, message: "Name cannot exceed 32 characters" },
];

const DATACENTER_RULES = [
  { required: true, message: "Datacenter is required" },
];

const TOTAL_RACK_UNITS_RULES = [
  { type: "number" as const, min: 1, message: "Must be at least 1" },
];

export const RackForm = ({ formProps }: { formProps: FormProps }) => (
  <Space direction="vertical" size="middle" style={{ display: "flex" }}>
    <Card title={"Rack Information"}>
      <Form {...formProps} layout="vertical">
        <Row gutter={[16, 24]}>
          <Col span={12}>
            <Form.Item label={"Name"} name={["name"]} rules={NAME_RULES}>
              <Input maxLength={32} placeholder="e.g. RACK-B12" />
            </Form.Item>
            <Form.Item
              label={"Datacenter"}
              name={["datacenterId"]}
              rules={DATACENTER_RULES}
            >
              <LookupSelect
                resource="datacenters"
                placeholder="Select datacenter"
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label={"Total Rack Units"}
              name={["totalRackUnits"]}
              rules={TOTAL_RACK_UNITS_RULES}
              initialValue={42}
            >
              <InputNumber
                min={1}
                precision={0}
                style={{ width: "100%" }}
                placeholder="e.g. 42"
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Card>
  </Space>
);
