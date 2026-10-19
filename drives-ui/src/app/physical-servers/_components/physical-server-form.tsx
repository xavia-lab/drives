"use client";

import { LookupSelect } from "@components/lookup-select";
import { useLookupOptions } from "@hooks/use-lookup-options";
import { uuidv7 } from "@utils/uuidv7";
import { EditableProTable } from "@ant-design/pro-components";
import type { ProColumns } from "@ant-design/pro-components";
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
} from "antd";
import type { FormProps } from "antd";
import type { Key } from "react";
import { useState } from "react";

type ServerSlotRecord = {
  id: string;
  slotLabel?: string;
  supportedInterfaceId?: string;
  pcieBusAddress?: string | null;
};

const MEMORY_UNIT_OPTIONS = [
  { label: "MiB", value: "MiB" },
  { label: "GiB", value: "GiB" },
  { label: "TiB", value: "TiB" },
];

const HOSTNAME_RULES = [
  { required: true, message: "Hostname is required" },
  { max: 128, message: "Hostname cannot exceed 128 characters" },
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

const validateSlots = async (
  _rule: unknown,
  value: ServerSlotRecord[] | undefined,
) => {
  if (!value || value.length === 0) {
    return;
  }

  const seenLabels = new Set<string>();
  for (const slot of value) {
    if (!slot.slotLabel) {
      throw new Error("Each slot requires a label");
    }
    if (!slot.supportedInterfaceId) {
      throw new Error("Each slot requires a supported interface");
    }
    const normalized = slot.slotLabel.trim().toLowerCase();
    if (seenLabels.has(normalized)) {
      throw new Error(`Duplicate slot label "${slot.slotLabel}"`);
    }
    seenLabels.add(normalized);
  }
};

export const PhysicalServerForm = ({ formProps }: { formProps: FormProps }) => {
  const [slotEditableKeys, setSlotEditableKeys] = useState<Key[]>([]);
  const { options: interfaceOptions, isLoading: interfaceLoading } =
    useLookupOptions({ resource: "interfaces" });
  const { options: cpuOptions, isLoading: cpuLoading } = useLookupOptions({
    resource: "physical-cpus",
    optionLabel: "label",
  });

  const slotColumns: ProColumns<ServerSlotRecord>[] = [
    {
      title: "Slot Label",
      dataIndex: "slotLabel",
      width: "34%",
      formItemProps: {
        rules: [
          { required: true, message: "Slot label is required" },
          { max: 32, message: "Cannot exceed 32 characters" },
        ],
      },
    },
    {
      title: "Supported Interface",
      dataIndex: "supportedInterfaceId",
      width: "40%",
      render: (_, record) =>
        interfaceOptions.find(
          (option) => option.value === record.supportedInterfaceId,
        )?.label ??
        record.supportedInterfaceId ??
        "-",
      renderFormItem: () => (
        <Select
          showSearch
          optionFilterProp="label"
          options={interfaceOptions}
          loading={interfaceLoading}
          placeholder="Select interface"
        />
      ),
      formItemProps: {
        rules: [{ required: true, message: "Supported interface is required" }],
      },
    },
    {
      title: "PCIe Bus Address",
      dataIndex: "pcieBusAddress",
      width: "26%",
      formItemProps: {
        rules: [{ max: 32, message: "Cannot exceed 32 characters" }],
      },
    },
    {
      // EditableProTable does not auto-generate an action column. This "option"
      // column is what puts an existing row into edit mode; while a row is being
      // edited it is replaced by the built-in Save/Delete/Cancel actions.
      title: "Actions",
      valueType: "option",
      width: 100,
      render: (_, record, __, action) => [
        <Button
          key="edit"
          type="link"
          size="small"
          style={{ padding: 0 }}
          onClick={() => action?.startEditable?.(record.id)}
        >
          Edit
        </Button>,
      ],
    },
  ];

  return (
    <Form {...formProps} layout="vertical">
      <Space direction="vertical" size="middle" style={{ display: "flex" }}>
        <Card title={"Physical Server Information"}>
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
                label={"Physical CPUs"}
                name={["cpuIds"]}
                extra="Installed CPU chips. Each chip can only belong to one server."
              >
                <Select
                  mode="multiple"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  options={cpuOptions}
                  loading={cpuLoading}
                  placeholder="Select physical CPUs"
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
        </Card>

        <Card title={"Server Slots"}>
          <Form.Item
            name={"slots"}
            style={{ marginBottom: 0 }}
            rules={[{ validator: validateSlots }]}
          >
            <EditableProTable<ServerSlotRecord>
              rowKey="id"
              columns={slotColumns}
              search={false}
              options={false}
              pagination={false}
              recordCreatorProps={{
                newRecordType: "dataSource",
                creatorButtonText: "Add Slot",
                record: () => ({ id: uuidv7() }),
              }}
              editable={{
                type: "multiple",
                editableKeys: slotEditableKeys,
                onChange: setSlotEditableKeys,
              }}
            />
          </Form.Item>
        </Card>
      </Space>
    </Form>
  );
};
