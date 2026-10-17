"use client";

import { Card, Form, Input, Space, Switch } from "antd";
import type { FormProps } from "antd";

const NAME_RULES = [
  { required: true, message: "Name is required" },
  { max: 32, message: "Name cannot exceed 32 characters" },
  {
    pattern: /^[A-Z][a-zA-Z\s]*$/,
    message: "Name must start with a capital letter",
  },
];

const COMMAND_SET_RULES = [
  { required: true, message: "Command set is required" },
  { max: 16, message: "Command set cannot exceed 16 characters" },
  {
    pattern: /^[A-Z][a-zA-Z\s]*$/,
    message: "Command set must start with a capital letter",
  },
];

export const BusProtocolForm = ({ formProps }: { formProps: FormProps }) => (
  <Space direction="vertical" size="middle" style={{ display: "flex" }}>
    <Card title={"Bus Protocol Information"}>
      <Form {...formProps} layout="vertical">
        <Form.Item label={"Name"} name={["name"]} rules={NAME_RULES}>
          <Input maxLength={32} style={{ textTransform: "capitalize" }} />
        </Form.Item>
        <Form.Item
          label={"Command Set"}
          name={["commandSet"]}
          rules={COMMAND_SET_RULES}
        >
          <Input maxLength={16} style={{ textTransform: "capitalize" }} />
        </Form.Item>
        <Form.Item
          label={"Supports Hotplug"}
          name={"supportsHotPlug"}
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
      </Form>
    </Card>
  </Space>
);
