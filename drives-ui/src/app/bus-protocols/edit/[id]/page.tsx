"use client";

import { Edit, useForm } from "@refinedev/antd";
import { Card, Form, Input, Space, Switch } from "antd";
import React from "react";

export default function BusProtocolEdit() {
  const { formProps, saveButtonProps } = useForm({});

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <Space direction="vertical" size="middle" style={{ display: "flex" }}>
        <Card title={"Bus Protocol Information"}>
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
              label={"Command Set"}
              name={["commandSet"]}
              rules={[
                {
                  required: true,
                  message: "Name is required",
                },
                {
                  max: 16,
                  message: "Name cannot exceed 16 characters",
                },
                {
                  pattern: /^[A-Z][a-zA-Z\s]*$/,
                  message: "Name must start with a capital letter",
                },
              ]}
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
    </Edit>
  );
}
