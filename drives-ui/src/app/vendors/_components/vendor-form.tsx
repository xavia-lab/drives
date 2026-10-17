"use client";

import { Card, Col, Form, Input, Row, Space, Switch } from "antd";
import type { FormProps } from "antd";
import { LookupSelect } from "@components/lookup-select";

const NAME_RULES = [
  { required: true, message: "Name is required" },
  { max: 64, message: "Name cannot exceed 64 characters" },
];

const COUNTRY_RULES = [{ required: true, message: "Country is required" }];

const SUPPORT_EMAIL_RULES = [
  { type: "email" as const, message: "Please enter a valid email address" },
  { max: 128, message: "Support email cannot exceed 128 characters" },
];

const PORTAL_URL_RULES = [
  { type: "url" as const, message: "Please enter a valid URL" },
  { max: 255, message: "Portal URL cannot exceed 255 characters" },
];

export const VendorForm = ({ formProps }: { formProps: FormProps }) => {
  return (
    <Space direction="vertical" size="middle" style={{ display: "flex" }}>
      <Card title={"Vendor Information"}>
        <Form {...formProps} layout="vertical">
          <Row gutter={[16, 24]}>
            <Col span={12}>
              <Form.Item label={"Name"} name={["name"]} rules={NAME_RULES}>
                <Input maxLength={64} placeholder="e.g. Solidigm" />
              </Form.Item>
              <Form.Item label="Country" name="countryId" rules={COUNTRY_RULES}>
                <LookupSelect
                  resource="countries"
                  optionLabel="name"
                  optionValue="id"
                  placeholder="Select country"
                />
              </Form.Item>
              <Form.Item
                label="Support Contact Email"
                name="supportContactEmail"
                rules={SUPPORT_EMAIL_RULES}
              >
                <Input
                  maxLength={128}
                  placeholder="enterprise.support@vendor.com"
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Manufacturer"
                name="isManufacturer"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
              <Form.Item
                label="Retailer"
                name="isRetailer"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
              <Form.Item
                label="Portal URL"
                name="portalUrl"
                rules={PORTAL_URL_RULES}
              >
                <Input maxLength={255} placeholder="https://vendor.com" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>
    </Space>
  );
};
