"use client";

import { Create, useForm } from "@refinedev/antd";
import { Card, Form, Input, InputNumber, Space } from "antd";
import React from "react";

export default function FormFactorCreate() {
  const { formProps, saveButtonProps } = useForm({});

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Space direction="vertical" size="middle" style={{ display: "flex" }}>
        <Card title={"Form Factor Information"}>
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
              <Input
                placeholder="M.2 2280"
                maxLength={32}
                style={{ textTransform: "capitalize" }}
              />
            </Form.Item>
            <Form.Item
              label="Slot Pitch (mm)"
              name="slotPitch"
              rules={[
                {
                  required: true,
                  message: "Slot pitch is required",
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
          </Form>
        </Card>
      </Space>
    </Create>
  );
}
