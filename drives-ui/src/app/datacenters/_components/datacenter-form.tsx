"use client";

import { LookupSelect } from "@components/lookup-select";
import { Card, Col, Form, Input, Row, Space } from "antd";
import type { FormProps } from "antd";

const CODE_RULES = [
  { required: true, message: "Code is required" },
  { max: 16, message: "Code cannot exceed 16 characters" },
];

const NAME_RULES = [
  { required: true, message: "Name is required" },
  { max: 128, message: "Name cannot exceed 128 characters" },
];

const CITY_RULES = [
  { required: true, message: "City is required" },
  { max: 64, message: "City cannot exceed 64 characters" },
];

const COUNTRY_RULES = [{ required: true, message: "Country is required" }];

export const DatacenterForm = ({ formProps }: { formProps: FormProps }) => (
  <Space direction="vertical" size="middle" style={{ display: "flex" }}>
    <Card title={"Datacenter Information"}>
      <Form {...formProps} layout="vertical">
        <Row gutter={[16, 24]}>
          <Col span={12}>
            <Form.Item label={"Code"} name={["code"]} rules={CODE_RULES}>
              <Input maxLength={16} placeholder="e.g. VA-ASH-1" />
            </Form.Item>
            <Form.Item label={"Name"} name={["name"]} rules={NAME_RULES}>
              <Input
                maxLength={128}
                placeholder="e.g. Ashburn Corporate Center 1"
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item label={"City"} name={["city"]} rules={CITY_RULES}>
              <Input maxLength={64} placeholder="e.g. Ashburn" />
            </Form.Item>
            <Form.Item
              label={"Country"}
              name={["countryId"]}
              rules={COUNTRY_RULES}
            >
              <LookupSelect resource="countries" placeholder="Select country" />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Card>
  </Space>
);
