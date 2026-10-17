"use client";

import { LookupSelect } from "@components/lookup-select";
import { Card, Col, Form, Input, InputNumber, Row, Select, Space } from "antd";
import type { FormProps } from "antd";

const MEMORY_UNIT_OPTIONS = [
  { label: "MiB", value: "MiB" },
  { label: "GiB", value: "GiB" },
  { label: "TiB", value: "TiB" },
];

const HOSTNAME_RULES = [
  { required: true, message: "Hostname is required" },
  { max: 128, message: "Hostname cannot exceed 128 characters" },
];

const CPU_MODEL_RULES = [{ required: true, message: "CPU Model is required" }];

const CPU_COUNT_RULES = [
  { type: "number" as const, min: 1, message: "Must be at least 1" },
];

const MEMORY_VALUE_RULES = [
  { required: true, message: "Memory value is required" },
  {
    type: "number" as const,
    min: 0,
    message: "Memory value cannot be negative",
  },
  {
    type: "number" as const,
    max: 99999999.99,
    message: "Memory value cannot exceed 99999999.99",
  },
];

const MEMORY_UNIT_RULES = [
  { required: true, message: "Memory unit is required" },
];

const OPERATING_SYSTEM_RULES = [
  { required: true, message: "Operating System is required" },
];

const RACK_RULES = [{ required: true, message: "Rack is required" }];

const RACK_UNIT_POSITION_RULES = [
  { required: true, message: "Rack Unit Position is required" },
  { type: "number" as const, min: 1, message: "Must be at least 1" },
];

export const PhysicalServerForm = ({ formProps }: { formProps: FormProps }) => (
  <Space direction="vertical" size="middle" style={{ display: "flex" }}>
    <Card title={"Physical Server Information"}>
      <Form {...formProps} layout="vertical">
        <Row gutter={[16, 24]}>
          <Col span={12}>
            <Form.Item
              label={"Hostname"}
              name={["hostname"]}
              rules={HOSTNAME_RULES}
            >
              <Input
                maxLength={128}
                placeholder="e.g. us-east-compute-42.infra"
              />
            </Form.Item>
            <Form.Item
              label={"CPU Model"}
              name={["cpuModelId"]}
              rules={CPU_MODEL_RULES}
            >
              <LookupSelect
                resource="cpu-models"
                placeholder="Select CPU model"
              />
            </Form.Item>
            <Form.Item
              label={"CPU Count"}
              name={["cpuCount"]}
              rules={CPU_COUNT_RULES}
              initialValue={1}
            >
              <InputNumber
                min={1}
                precision={0}
                style={{ width: "100%" }}
                placeholder="e.g. 2"
              />
            </Form.Item>
            <Row gutter={8}>
              <Col span={14}>
                <Form.Item
                  label={"Memory"}
                  name={["memoryValue"]}
                  rules={MEMORY_VALUE_RULES}
                >
                  <InputNumber
                    min={0}
                    max={99999999.99}
                    precision={2}
                    style={{ width: "100%" }}
                    placeholder="e.g. 512"
                  />
                </Form.Item>
              </Col>
              <Col span={10}>
                <Form.Item
                  label={"Unit"}
                  name={["memoryUnit"]}
                  rules={MEMORY_UNIT_RULES}
                  initialValue={"GiB"}
                >
                  <Select placeholder="Unit" options={MEMORY_UNIT_OPTIONS} />
                </Form.Item>
              </Col>
            </Row>
          </Col>

          <Col span={12}>
            <Form.Item
              label={"Operating System"}
              name={["operatingSystemId"]}
              rules={OPERATING_SYSTEM_RULES}
            >
              <LookupSelect
                resource="operating-systems"
                placeholder="Select operating system"
              />
            </Form.Item>
            <Form.Item label={"Rack"} name={["rackId"]} rules={RACK_RULES}>
              <LookupSelect resource="racks" placeholder="Select rack" />
            </Form.Item>
            <Form.Item
              label={"Rack Unit Position"}
              name={["rackUnitPosition"]}
              rules={RACK_UNIT_POSITION_RULES}
            >
              <InputNumber
                min={1}
                precision={0}
                style={{ width: "100%" }}
                placeholder="e.g. 22"
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Card>
  </Space>
);
