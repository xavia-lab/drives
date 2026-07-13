"use client";

import { Create, useForm } from "@refinedev/antd";
import { Card, Form, Input, InputNumber, Select, Space } from "antd";

export default function CapacityCreate() {
  const { formProps, saveButtonProps } = useForm({});

  // Allowed values matching your PostgreSQL ENUM migration
  const unitOptions = [
    { label: "B", value: "B" },
    { label: "KB", value: "KB" },
    { label: "MB", value: "MB" },
    { label: "GB", value: "GB" },
    { label: "TB", value: "TB" },
    { label: "PB", value: "PB" },
  ];

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Space direction="vertical" size="middle" style={{ display: "flex" }}>
        <Card title={"Capacity Information"}>
          <Form {...formProps} layout="vertical">
            {/* Name Input - Safe for STRING(32) */}
            <Form.Item
              label={"Name"}
              name={["name"]}
              rules={[
                { required: true, message: "Please enter a name" },
                { max: 32, message: "Name cannot exceed 32 characters" },
                { whitespace: true, message: "Name cannot be empty spaces" },
              ]}
            >
              <Input placeholder="e.g., 32TB" maxLength={32} />
            </Form.Item>

            {/* Value Input - Safe for DECIMAL(6,2) (Max 9999.99) */}
            <Form.Item
              label={"Value"}
              name={["value"]}
              rules={[
                { required: true, message: "Please enter a capacity value" },
                {
                  validator: (_, value) => {
                    if (value === undefined || value === null)
                      return Promise.resolve();
                    if (value > 9999.99 || value < 0) {
                      return Promise.reject(
                        new Error("Value must be between 0 and 9999.99"),
                      );
                    }
                    // Prevent entering more than 2 decimal points manually
                    if (!/^\d+(\.\d{1,2})?$/.test(value.toString())) {
                      return Promise.reject(
                        new Error("Maximum 2 decimal places allowed"),
                      );
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <InputNumber
                style={{ width: "100%" }}
                placeholder="e.g., 500.00"
                min={0}
                max={9999.99}
                precision={2}
                step={0.01}
              />
            </Form.Item>

            {/* Unit Select - Enforces strict PostgreSQL ENUM values */}
            <Form.Item
              label={"Unit"}
              name={["unit"]}
              rules={[
                { required: true, message: "Please select a capacity unit" },
                {
                  type: "enum",
                  enum: unitOptions.map((o) => o.value),
                  message: "Invalid unit selected",
                },
              ]}
            >
              <Select placeholder="Select a unit" options={unitOptions} />
            </Form.Item>
          </Form>
        </Card>
      </Space>
    </Create>
  );
}
