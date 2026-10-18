"use client";

import { LookupSelect } from "@components/lookup-select";
import { Card, Col, Form, Input, InputNumber, Row, Space } from "antd";
import type { FormProps } from "antd";

const MANUFACTURER_RULES = [
  { required: true, message: "Manufacturer is required" },
];

const NAME_RULES = [
  { required: true, message: "Name is required" },
  { max: 64, message: "Name cannot exceed 64 characters" },
];

const MODEL_NUMBER_RULES = [
  { required: true, message: "Model number is required" },
  { max: 64, message: "Model number cannot exceed 64 characters" },
];

const STORAGE_TYPE_RULES = [
  { required: true, message: "Storage type is required" },
];

const FORM_FACTOR_RULES = [
  { required: true, message: "Form factor is required" },
];

const INTERFACE_RULES = [{ required: true, message: "Interface is required" }];

const CAPACITY_RULES = [{ required: true, message: "Capacity is required" }];

const MAX_ENDURANCE_RULES = [
  { type: "number" as const, min: 0, message: "Must be a positive number" },
];

export const DriveModelForm = ({ formProps }: { formProps: FormProps }) => (
  <Space direction="vertical" size="middle" style={{ display: "flex" }}>
    <Card title={"Drive Model Information"}>
      <Form {...formProps} layout="vertical">
        <Row gutter={[16, 24]}>
          <Col span={12}>
            <Form.Item
              label={"Manufacturer"}
              name={["manufacturerId"]}
              rules={MANUFACTURER_RULES}
            >
              <LookupSelect
                resource="vendors"
                placeholder="Select manufacturer"
              />
            </Form.Item>
            <Form.Item label={"Name"} name={["name"]} rules={NAME_RULES}>
              <Input maxLength={64} placeholder="e.g. Exos X24" />
            </Form.Item>
            <Form.Item
              label={"Model Number"}
              name={["modelNumber"]}
              rules={MODEL_NUMBER_RULES}
            >
              <Input maxLength={64} placeholder="e.g. ST16000NM007H" />
            </Form.Item>
            <Form.Item
              label={"Storage Type"}
              name={["storageTypeId"]}
              rules={STORAGE_TYPE_RULES}
            >
              <LookupSelect
                resource="storage-types"
                placeholder="Select storage type"
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label={"Form Factor"}
              name={["formFactorId"]}
              rules={FORM_FACTOR_RULES}
            >
              <LookupSelect
                resource="form-factors"
                placeholder="Select form factor"
              />
            </Form.Item>
            <Form.Item
              label={"Interface"}
              name={["interfaceId"]}
              rules={INTERFACE_RULES}
            >
              <LookupSelect
                resource="interfaces"
                placeholder="Select interface"
              />
            </Form.Item>
            <Form.Item
              label={"Capacity"}
              name={["capacityId"]}
              rules={CAPACITY_RULES}
            >
              <LookupSelect
                resource="capacities"
                placeholder="Select capacity"
              />
            </Form.Item>
            <Form.Item
              label={"Max Endurance (TBW)"}
              name={["maxEnduranceTbw"]}
              rules={MAX_ENDURANCE_RULES}
            >
              <InputNumber
                min={0}
                precision={0}
                style={{ width: "100%" }}
                placeholder="e.g. 14000"
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Card>
  </Space>
);
