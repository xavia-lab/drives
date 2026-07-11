"use client";

import { Create, useForm } from "@refinedev/antd";
import { Card, Col, Form, Input, Row, Space } from "antd";

export default function VendorCreate() {
  const { formProps, saveButtonProps } = useForm({});

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Space direction="vertical" size="middle" style={{ display: "flex" }}>
        <Card title={"Vendor Information"}>
          <Form {...formProps} layout="vertical">
            <Space direction="vertical" size="large" style={{ width: "100%" }}>
              {/* Main Entity Information */}
              <Card title="General Information" size="small">
                <Form.Item
                  label="Entity Name"
                  name="name"
                  rules={[{ required: true, message: "Please enter the name" }]}
                >
                  <Input placeholder="e.g. Rajni Jewelers, NJ" />
                </Form.Item>
              </Card>

              {/* Address Object Fields */}
              <Card title="Address Details" size="small">
                <Form.Item label="Firm Name" name={["address", "firmName"]}>
                  <Input placeholder="Sonia Jewelers & Boutique Inc" />
                </Form.Item>

                <Form.Item
                  label="Address Line 1"
                  name={["address", "addressLine1"]}
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  label="Address Line 2"
                  name={["address", "addressLine2"]}
                >
                  <Input />
                </Form.Item>

                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item label="City" name={["address", "city"]}>
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="State" name={["address", "state"]}>
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="Zip Code" name={["address", "zipCode"]}>
                      <Input />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>

              {/* Contact Object Fields */}
              <Card title="Contact Information" size="small">
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="First Name"
                      name={["contact", "firstName"]}
                    >
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="Last Name" name={["contact", "lastName"]}>
                      <Input />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item label="Phone Number" name={["contact", "phone"]}>
                  <Input placeholder="(xxx) xxx-xxxx" />
                </Form.Item>
              </Card>
            </Space>
          </Form>
        </Card>
      </Space>
    </Create>
  );
}
