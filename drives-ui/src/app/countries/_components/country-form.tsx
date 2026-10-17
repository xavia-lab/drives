"use client";

import { Card, Form, Input, Space } from "antd";
import type { FormProps } from "antd";

const NAME_RULES = [
  { required: true, message: "Name is required" },
  { max: 64, message: "Name cannot exceed 64 characters" },
  {
    pattern: /^[A-Z][a-zA-Z\s.-]*$/,
    message: "Name must start with a capital letter",
  },
];

const CODE_RULES = [
  { required: true, message: "Code is required" },
  { len: 2, message: "Code must be exactly 2 characters" },
  { pattern: /^[A-Z]+$/, message: "Code must contain only capital letters" },
];

export const CountryForm = ({ formProps }: { formProps: FormProps }) => (
  <Space direction="vertical" size="middle" style={{ display: "flex" }}>
    <Card title={"Country Information"}>
      <Form {...formProps} layout="vertical">
        <Form.Item label={"Name"} name={["name"]} rules={NAME_RULES}>
          <Input maxLength={64} style={{ textTransform: "capitalize" }} />
        </Form.Item>
        <Form.Item label={"Code"} name={["code"]} rules={CODE_RULES}>
          <Input maxLength={2} style={{ textTransform: "uppercase" }} />
        </Form.Item>
      </Form>
    </Card>
  </Space>
);
