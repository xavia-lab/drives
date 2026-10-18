"use client";

import { Card, Form, Input, Space } from "antd";
import type { FormProps } from "antd";

export const PoolTypeForm = ({ formProps }: { formProps: FormProps }) => (
  <Space direction="vertical" size="middle" style={{ display: "flex" }}>
    <Card title={"Pool Type Information"}>
      <Form {...formProps} layout="vertical">
        <Form.Item
          label={"Name"}
          name={["name"]}
          rules={[
            { required: true, message: "Name is required" },
            { max: 32, message: "Name cannot exceed 32 characters" },
            {
              pattern: /^[A-Za-z][A-Za-z0-9_ ]*$/,
              message:
                "Name must start with a letter and contain only letters, digits, spaces or underscores",
            },
          ]}
        >
          <Input placeholder="e.g., ZFS" maxLength={32} />
        </Form.Item>
      </Form>
    </Card>
  </Space>
);
