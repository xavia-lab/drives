"use client";

import {
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Row,
  Space,
} from "antd";
import type { FormProps } from "antd";
import dayjs from "dayjs";

const NAME_RULES = [
  { required: true, message: "Name is required" },
  { max: 64, message: "Name cannot exceed 64 characters" },
];

const CODE_NAME_RULES = [
  { max: 64, message: "Code Name cannot exceed 64 characters" },
];

const FAMILY_RULES = [
  { max: 64, message: "Family cannot exceed 64 characters" },
];

const VENDOR_RULES = [
  { max: 64, message: "Vendor cannot exceed 64 characters" },
];

const MAJOR_VERSION_RULES = [
  { type: "number" as const, min: 0, message: "Must be a positive number" },
];

const MINOR_VERSION_RULES = [
  { type: "number" as const, min: 0, message: "Must be a positive number" },
];

export const OperatingSystemForm = ({
  formProps,
}: {
  formProps: FormProps;
}) => (
  <Space direction="vertical" size="middle" style={{ display: "flex" }}>
    <Card title={"Operating System Information"}>
      <Form {...formProps} layout="vertical">
        <Row gutter={[16, 24]}>
          <Col span={12}>
            <Form.Item label={"Name"} name={["name"]} rules={NAME_RULES}>
              <Input placeholder="e.g. Proxmox VE 8.x" maxLength={64} />
            </Form.Item>
            <Form.Item
              label="Code Name"
              name="codeName"
              rules={CODE_NAME_RULES}
            >
              <Input placeholder="e.g. Bookworm" maxLength={64} />
            </Form.Item>
            <Form.Item label="Family" name="family" rules={FAMILY_RULES}>
              <Input placeholder="e.g. Debian" maxLength={64} />
            </Form.Item>
            <Form.Item label="Vendor" name="vendor" rules={VENDOR_RULES}>
              <Input placeholder="e.g. Proxmox" maxLength={64} />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Major Version"
              name="majorVersion"
              rules={MAJOR_VERSION_RULES}
            >
              <InputNumber
                min={0}
                precision={0}
                style={{ width: "100%" }}
                placeholder="e.g. 24"
              />
            </Form.Item>
            <Form.Item
              label="Minor Version"
              name="minorVersion"
              rules={MINOR_VERSION_RULES}
            >
              <InputNumber
                min={0}
                precision={0}
                style={{ width: "100%" }}
                placeholder="e.g. 4"
              />
            </Form.Item>
            <Form.Item
              label="EOL Date"
              name="eolDate"
              getValueProps={(value) => ({
                value: value ? dayjs(value) : undefined,
              })}
              normalize={(value) =>
                value ? dayjs(value).format("YYYY-MM-DD") : null
              }
            >
              <DatePicker
                style={{ width: "100%" }}
                placeholder="Select end-of-life date"
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Card>
  </Space>
);
