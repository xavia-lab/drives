"use client";

import { Card, Col, Form, Input, InputNumber, Row, Space } from "antd";
import type { FormProps } from "antd";
import { LookupSelect } from "@components/lookup-select";

const NAME_RULES = [
  { required: true, message: "Name is required" },
  { max: 32, message: "Name cannot exceed 32 characters" },
  {
    pattern: /^[A-Z][a-zA-Z\s]*$/,
    message: "Name must start with a capital letter",
  },
];

const BUS_PROTOCOL_RULES = [
  { required: true, message: "Bus protocol is required" },
];

const LINK_GENERATION_RULES = [
  { required: true, message: "Link Generation is required" },
  { type: "number" as const, message: "Please enter a valid number" },
];

const THROUGHPUT_RULES = [
  { required: true, message: "Throughput is required" },
  { type: "number" as const, message: "Please enter a valid number" },
];

export const InterfaceForm = ({ formProps }: { formProps: FormProps }) => {
  return (
    <Space direction="vertical" size="middle" style={{ display: "flex" }}>
      <Card title={"Interface Information"}>
        <Form {...formProps} layout="vertical">
          <Row gutter={[16, 24]}>
            <Col span={12}>
              <Form.Item label={"Name"} name={["name"]} rules={NAME_RULES}>
                <Input maxLength={32} style={{ textTransform: "capitalize" }} />
              </Form.Item>
              <Form.Item
                label="Bus Protocol"
                name="busProtocolId"
                rules={BUS_PROTOCOL_RULES}
              >
                <LookupSelect
                  resource="bus-protocols"
                  optionLabel="title"
                  optionValue="id"
                  placeholder="Select bus protocol"
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Link Generation"
                name="linkGeneration"
                rules={LINK_GENERATION_RULES}
              >
                <InputNumber
                  min={0}
                  max={10}
                  style={{ width: "100%" }}
                  placeholder="0"
                />
              </Form.Item>
              <Form.Item
                label="Throughput (Gbps)"
                name="throughput"
                rules={THROUGHPUT_RULES}
              >
                <InputNumber
                  min={0}
                  precision={2}
                  style={{ width: "100%" }}
                  placeholder="0.00"
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>
    </Space>
  );
};
