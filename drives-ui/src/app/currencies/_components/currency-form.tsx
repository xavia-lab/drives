"use client";

import { Card, Form, Input, Space } from "antd";
import type { FormProps } from "antd";

const NAME_RULES = [
  { required: true, message: "Name is required" },
  { max: 32, message: "Name cannot exceed 32 characters" },
  {
    pattern: /^[A-Z][a-zA-Z\s]*$/,
    message: "Name must start with a capital letter",
  },
];

const CODE_RULES = [
  { required: true, message: "Code is required" },
  { len: 3, message: "Code must be exactly 3 characters (e.g., USD)" },
  { pattern: /^[A-Z]+$/, message: "Code must contain only capital letters" },
];

const SYMBOL_RULES = [
  { required: true, message: "Symbol is required" },
  { max: 4, message: "Symbol cannot exceed 4 characters" },
];

export const CurrencyForm = ({ formProps }: { formProps: FormProps }) => (
  <Space direction="vertical" size="middle" style={{ display: "flex" }}>
    <Card title={"Currency Information"}>
      <Form {...formProps} layout="vertical">
        <Form.Item label={"Name"} name={["name"]} rules={NAME_RULES}>
          <Input maxLength={32} style={{ textTransform: "capitalize" }} />
        </Form.Item>
        <Form.Item label={"Code"} name={["code"]} rules={CODE_RULES}>
          <Input maxLength={3} style={{ textTransform: "uppercase" }} />
        </Form.Item>
        <Form.Item label={"Symbol"} name={["symbol"]} rules={SYMBOL_RULES}>
          <Input maxLength={4} />
        </Form.Item>
      </Form>
    </Card>
  </Space>
);
