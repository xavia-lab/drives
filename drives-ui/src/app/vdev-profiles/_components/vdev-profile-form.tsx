"use client";

import { Card, Col, Form, Input, InputNumber, Row, Select, Space } from "antd";
import type { FormInstance, FormProps } from "antd";

const TECHNOLOGY_OPTIONS = ["ZFS", "MDRAID", "BTRFS", "CEPH", "GENERIC"].map(
  (value) => ({ value, label: value }),
);

const CAPACITY_MODE_OPTIONS = [
  { value: "SUM", label: "SUM — sum of members" },
  { value: "MIN", label: "MIN — smallest member" },
  { value: "PARITY", label: "PARITY — subtract parity members" },
  { value: "MIRROR_GROUPS", label: "MIRROR_GROUPS — RAID10 style" },
];

interface VdevProfileFormProps {
  form: FormInstance;
  formProps: FormProps;
}

export const VdevProfileForm = ({ form, formProps }: VdevProfileFormProps) => (
  <Form {...formProps} form={form} layout="vertical">
    <Space direction="vertical" size="middle" style={{ display: "flex" }}>
      <Card title="Vdev Profile Information">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Form.Item
              label="Code"
              name="code"
              rules={[
                { required: true, message: "Code is required" },
                { max: 32, message: "Code cannot exceed 32 characters" },
                {
                  pattern: /^[A-Z][A-Z0-9_]*$/,
                  message:
                    "Use uppercase letters, digits and underscores, starting with a letter",
                },
              ]}
            >
              <Input
                maxLength={32}
                placeholder="e.g. RAIDZ2"
                style={{ textTransform: "uppercase" }}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              label="Display name"
              name="displayName"
              rules={[
                { required: true, message: "Display name is required" },
                {
                  max: 64,
                  message: "Display name cannot exceed 64 characters",
                },
              ]}
            >
              <Input maxLength={64} placeholder="e.g. RAIDZ2" />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item label="Technology" name="technology">
              <Select options={TECHNOLOGY_OPTIONS} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Form.Item label="Capacity mode" name="capacityMode">
              <Select options={CAPACITY_MODE_OPTIONS} />
            </Form.Item>
          </Col>
          <Col xs={12} md={4}>
            <Form.Item
              label="Min members"
              name="minMembers"
              rules={[{ type: "number", min: 1 }]}
            >
              <InputNumber min={1} precision={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col xs={12} md={4}>
            <Form.Item label="Max members" name="maxMembers">
              <InputNumber
                min={1}
                precision={0}
                style={{ width: "100%" }}
                placeholder="Unlimited"
              />
            </Form.Item>
          </Col>
          <Col xs={12} md={4}>
            <Form.Item label="Parity members" name="parityMembers">
              <InputNumber min={0} precision={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col xs={12} md={4}>
            <Form.Item label="Mirror copies" name="mirrorCopies">
              <InputNumber min={1} precision={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={12} md={6}>
            <Form.Item label="Stripe width" name="stripeWidth">
              <InputNumber
                min={1}
                precision={0}
                style={{ width: "100%" }}
                placeholder="Optional"
              />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}>
            <Form.Item label="Sort order" name="sortOrder">
              <InputNumber min={0} precision={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              label="Metadata (JSON)"
              name="metadata"
              getValueProps={(value) => ({
                value:
                  typeof value === "string"
                    ? value
                    : value
                      ? JSON.stringify(value, null, 2)
                      : "",
              })}
              normalize={(value: string) => {
                if (!value || !value.trim()) return null;
                try {
                  return JSON.parse(value);
                } catch {
                  return value;
                }
              }}
              rules={[
                {
                  validator: (_, value) =>
                    typeof value === "string"
                      ? Promise.reject(new Error("Metadata must be valid JSON"))
                      : Promise.resolve(),
                },
              ]}
            >
              <Input.TextArea
                rows={5}
                placeholder='Optional JSON, e.g. {"k":2,"m":1}'
                style={{ fontFamily: "monospace" }}
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>
    </Space>
  </Form>
);
