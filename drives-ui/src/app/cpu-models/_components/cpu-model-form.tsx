"use client";

import { Card, Col, Form, Input, InputNumber, Row, Select, Space } from "antd";
import type { FormProps } from "antd";
import { LookupSelect } from "@components/lookup-select";

export const ARCHITECTURE_OPTIONS = [
  { label: "x86-64", value: "X86_64" },
  { label: "ARM64", value: "ARM64" },
];

export const ARCHITECTURE_COLORS = {
  X86_64: "geekblue",
  ARM64: "purple",
};

const VENDOR_RULES = [{ required: true, message: "Vendor is required" }];

const ARCHITECTURE_RULES = [
  { required: true, message: "Architecture is required" },
];

const NAME_RULES = [
  { required: true, message: "Name is required" },
  { max: 64, message: "Name cannot exceed 64 characters" },
];

const PHYSICAL_CORES_RULES = [
  { required: true, message: "Physical cores is required" },
  { type: "number" as const, min: 1, message: "Must be at least 1" },
];

const THREADS_RULES = [
  { required: true, message: "Threads is required" },
  { type: "number" as const, min: 1, message: "Must be at least 1" },
];

const TDP_RULES = [
  { type: "number" as const, min: 1, message: "Must be at least 1" },
];

export const CpuModelForm = ({ formProps }: { formProps: FormProps }) => {
  return (
    <Space direction="vertical" size="middle" style={{ display: "flex" }}>
      <Card title={"CPU Model Information"}>
        <Form {...formProps} layout="vertical">
          <Row gutter={[16, 24]}>
            <Col span={12}>
              <Form.Item
                label={"Vendor"}
                name={["vendorId"]}
                rules={VENDOR_RULES}
              >
                <LookupSelect
                  resource="vendors"
                  optionLabel="name"
                  optionValue="id"
                  placeholder="Select vendor"
                />
              </Form.Item>
              <Form.Item label={"Name"} name={["name"]} rules={NAME_RULES}>
                <Input maxLength={64} placeholder="e.g. EPYC 7763" />
              </Form.Item>
              <Form.Item
                label={"TDP (Watts)"}
                name={["tdpWatts"]}
                rules={TDP_RULES}
              >
                <InputNumber
                  min={1}
                  precision={0}
                  style={{ width: "100%" }}
                  placeholder="e.g. 280"
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label={"Architecture"}
                name={["architecture"]}
                rules={ARCHITECTURE_RULES}
              >
                <Select
                  placeholder="Select architecture"
                  options={ARCHITECTURE_OPTIONS}
                />
              </Form.Item>
              <Form.Item
                label={"Physical Cores"}
                name={["physicalCores"]}
                rules={PHYSICAL_CORES_RULES}
              >
                <InputNumber
                  min={1}
                  precision={0}
                  style={{ width: "100%" }}
                  placeholder="e.g. 64"
                />
              </Form.Item>
              <Form.Item
                label={"Threads"}
                name={["threads"]}
                rules={THREADS_RULES}
              >
                <InputNumber
                  min={1}
                  precision={0}
                  style={{ width: "100%" }}
                  placeholder="e.g. 128"
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>
    </Space>
  );
};
