"use client";

import { Create, useForm } from "@refinedev/antd";
import { Card, Form, Input, Space, Switch } from "antd";
import React from "react";

export default function StorageTypeCreate() {
  const { formProps, saveButtonProps } = useForm({});

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Space direction="vertical" size="middle" style={{ display: "flex" }}>
        <Card title={"Storage Type Information"}>
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
              label={"Wear Trackable"}
              name={"wearTrackable"}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Form>
        </Card>
      </Space>
    </Create>
  );
}
