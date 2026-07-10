"use client";

import { Create, useForm } from "@refinedev/antd";
import { Card, Form, Input, Space } from "antd";

export default function CurrencyCreate() {
  const { formProps, saveButtonProps } = useForm({});

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Space direction="vertical" size="middle" style={{ display: "flex" }}>
        <Card title={"Currency Information"}>
          <Form {...formProps} layout="vertical">
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
              <Input maxLength={32} style={{ textTransform: "capitalize" }} />
            </Form.Item>
            <Form.Item
              label={"Code"}
              name={["code"]}
              rules={[
                {
                  required: true,
                  message: "Code is required",
                },
                {
                  len: 3,
                  message: "Code must be exactly 3 characters (e.g., USD)",
                },
                {
                  pattern: /^[A-Z]+$/,
                  message: "Code must contain only capital letters",
                },
              ]}
            >
              <Input maxLength={3} style={{ textTransform: "uppercase" }} />
            </Form.Item>
            <Form.Item
              label={"Symbol"}
              name={["symbol"]}
              rules={[
                {
                  required: true,
                  message: "Symbol is required",
                },
                {
                  max: 4,
                  message: "Symbol cannot exceed 4 characters",
                },
              ]}
            >
              <Input maxLength={4} />
            </Form.Item>
          </Form>
        </Card>
      </Space>
    </Create>
  );
}
