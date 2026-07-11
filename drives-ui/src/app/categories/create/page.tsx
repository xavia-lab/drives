"use client";

import { Create, useForm, useSelect } from "@refinedev/antd";
import { Card, Form, Input, Select, Space } from "antd";

export default function CategoryCreate() {
  const { formProps, saveButtonProps, query } = useForm({});

  const categoryData = query?.data?.data;

  const { selectProps: categorySelectProps } = useSelect({
    resource: "categories",
    pagination: {
      mode: "off",
    },
  });

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Space direction="vertical" size="middle" style={{ display: "flex" }}>
        <Card title={"Category Information"}>
          <Form {...formProps} layout="vertical">
            <Form.Item
              label={"Code"}
              name={["code"]}
              rules={[
                {
                  required: true,
                },
              ]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label={"Name"}
              name={["name"]}
              rules={[
                {
                  required: true,
                },
              ]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label={"Parent"}
              name={["parent", "id"]}
              initialValue={formProps?.initialValues?.parentId}
              rules={[
                {
                  required: true,
                },
              ]}
            >
              <Select {...categorySelectProps} />
            </Form.Item>
          </Form>
        </Card>
      </Space>
    </Create>
  );
}
