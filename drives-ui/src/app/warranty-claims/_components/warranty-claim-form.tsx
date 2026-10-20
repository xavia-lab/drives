"use client";

import { LookupSelect } from "@components/lookup-select";
import { Card, Col, Form, Input, Row, Space } from "antd";
import type { FormInstance, FormProps } from "antd";

interface WarrantyClaimFormProps {
  formProps: FormProps;
  form: FormInstance;
}

export const WarrantyClaimForm = ({
  formProps,
  form,
}: WarrantyClaimFormProps) => (
  <Space direction="vertical" size="middle" style={{ display: "flex" }}>
    <Card title={"Warranty Claim"}>
      <Form {...formProps} layout="vertical" form={form}>
        <Row gutter={[16, 24]}>
          <Col xs={24} md={12}>
            <Form.Item
              label={"Physical Drive"}
              name={["physicalDriveId"]}
              rules={[{ required: true, message: "Select the drive" }]}
            >
              <LookupSelect
                resource="physical-drives"
                optionLabel="serialNumber"
                placeholder="Select drive"
              />
            </Form.Item>
            <Form.Item
              label={"Handled By Vendor"}
              name={["handledByVendorId"]}
              rules={[{ required: true, message: "Select the vendor" }]}
            >
              <LookupSelect resource="vendors" placeholder="Select vendor" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label={"RMA Tracking Number"}
              name={["rmaTrackingNumber"]}
              rules={[
                {
                  max: 64,
                  message: "RMA tracking number cannot exceed 64 characters",
                },
              ]}
            >
              <Input maxLength={64} placeholder="e.g. RMA-990PRO-12345" />
            </Form.Item>
            <Form.Item label={"Notes"} name={["notes"]}>
              <Input.TextArea
                rows={5}
                placeholder="Troubleshooting details, vendor correspondence, ..."
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Card>
  </Space>
);
