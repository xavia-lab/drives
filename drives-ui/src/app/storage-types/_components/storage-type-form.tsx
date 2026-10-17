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

export const StorageTypeForm = ({ formProps }: { formProps: FormProps }) => (
  <Space direction="vertical" size="middle" style={{ display: "flex" }}>
    <Card title={"Storage Type Information"}>
      <Form {...formProps} layout="vertical">
        <Form.Item label={"Name"} name={["name"]} rules={NAME_RULES}>
          <Input maxLength={32} style={{ textTransform: "capitalize" }} />
        </Form.Item>
        <Form.Item
          label={"Wear Trackable"}
          name={"wearTrackable"}
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
      </Form>
    </Card>
  </Space>
);
