"use client";

import { Card, Form, Input, InputNumber, Select, Space } from "antd";
import type { FormRule, FormProps } from "antd";

const UNIT_OPTIONS = [
  { label: "B", value: "B" },
  { label: "KB", value: "KB" },
  { label: "MB", value: "MB" },
  { label: "GB", value: "GB" },
  { label: "TB", value: "TB" },
  { label: "PB", value: "PB" },
];

const NAME_RULES: FormRule[] = [
  { required: true, message: "Please enter a name" },
  { max: 32, message: "Name cannot exceed 32 characters" },
  { whitespace: true, message: "Name cannot be empty spaces" },
];

const VALUE_RULES: FormRule[] = [
  { required: true, message: "Please enter a capacity value" },
  {
    validator: (_, value) => {
      if (value === undefined || value === null) return Promise.resolve();
      if (value > 9999.99 || value < 0) {
        return Promise.reject(new Error("Value must be between 0 and 9999.99"));
      }
      if (!/^\d+(\.\d{1,2})?$/.test(value.toString())) {
        return Promise.reject(new Error("Maximum 2 decimal places allowed"));
      }
      return Promise.resolve();
    },
  },
];

const UNIT_RULES: FormRule[] = [
  { required: true, message: "Please select a capacity unit" },
  {
    type: "enum",
    enum: UNIT_OPTIONS.map((option) => option.value),
    message: "Invalid unit selected",
  },
];

export const CapacityForm = ({ formProps }: { formProps: FormProps }) => (
  <Space direction="vertical" size="middle" style={{ display: "flex" }}>
    <Card title={"Capacity Information"}>
      <Form {...formProps} layout="vertical">
        <Form.Item label={"Name"} name={["name"]} rules={NAME_RULES}>
          <Input placeholder="e.g., 32TB" maxLength={32} />
        </Form.Item>
        <Form.Item label={"Value"} name={["value"]} rules={VALUE_RULES}>
          <InputNumber
            style={{ width: "100%" }}
            placeholder="e.g., 500.00"
            min={0}
            max={9999.99}
            precision={2}
            step={0.01}
          />
        </Form.Item>
        <Form.Item label={"Unit"} name={["unit"]} rules={UNIT_RULES}>
          <Select placeholder="Select a unit" options={UNIT_OPTIONS} />
        </Form.Item>
      </Form>
    </Card>
  </Space>
);
