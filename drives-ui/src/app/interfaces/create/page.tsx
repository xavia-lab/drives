"use client";

import { Create, useForm, useSelect } from "@refinedev/antd";
import { Card, Col, Form, Input, InputNumber, Row, Select, Space } from "antd";

export default function InterfaceCreate() {
  const { formProps, saveButtonProps } = useForm({});

  const { selectProps: busProtocolSelectProps } = useSelect({
    resource: "bus-protocols",
    optionLabel: "title",
    optionValue: "id",
  });

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Space direction="vertical" size="middle" style={{ display: "flex" }}>
        <Card title={"Interface Information"}>
          <Form {...formProps} layout="vertical">
            <Row gutter={[16, 24]}>
              <Col span={12}>
                <Form.Item
                  label={"Name"}
                  name={["name"]}
                  rules={[
                    {
                      required: true,
                      message: "Name is required",
                    },
                    {
                      max: 32,
                      message: "Name cannot exceed 32 characters",
                    },
                    {
                      pattern: /^[A-Z][a-zA-Z\s]*$/,
                      message: "Name must start with a capital letter",
                    },
                  ]}
                >
                  <Input
                    maxLength={32}
                    style={{ textTransform: "capitalize" }}
                  />
                </Form.Item>
                <Form.Item
                  label="Bus Protocol"
                  name="busProtocolId"
                  rules={[{ required: true }]}
                >
                  <Select
                    {...busProtocolSelectProps}
                    placeholder="Select bus protocol"
                  />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  label="Link Generation"
                  name="linkGeneration"
                  rules={[
                    {
                      required: true,
                      message: "Link Generation is required",
                    },
                    {
                      type: "number",
                      message: "Please enter a valid number",
                    },
                  ]}
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
                  rules={[
                    {
                      required: true,
                      message: "Throughput is required",
                    },
                    {
                      type: "number",
                      message: "Please enter a valid number",
                    },
                  ]}
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
    </Create>
  );
}
