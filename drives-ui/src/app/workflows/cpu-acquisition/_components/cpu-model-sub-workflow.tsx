"use client";

import { useEffect, useMemo, useState } from "react";
import { useCustomMutation } from "@refinedev/core";
import {
  Alert,
  App,
  Button,
  Col,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Steps,
} from "antd";
import { FileAddOutlined } from "@ant-design/icons";

export interface CreatedCpuModel {
  id: string;
  vendorId?: string;
  architecture?: string;
  name?: string;
  physicalCores?: number;
  threads?: number;
  tdpWatts?: number | null;
}

type NewCpuModelValues = {
  name?: string;
  architecture?: string;
  physicalCores?: number;
  threads?: number;
  tdpWatts?: number | null;
};

interface CpuModelSubWorkflowProps {
  open: boolean;
  vendorId?: string;
  vendorName?: string;
  onCancel: () => void;
  onCreated: (model: CreatedCpuModel) => void | Promise<void>;
}

const CPU_MODEL_FIELDS = [
  "name",
  "architecture",
  "physicalCores",
  "threads",
  "tdpWatts",
];

const CPU_ARCHITECTURE_OPTIONS = [
  { label: "x86-64", value: "X86_64" },
  { label: "ARM64", value: "ARM64" },
];

const NAME_RULES = [
  { required: true, message: "Name is required" },
  { max: 64, message: "Name cannot exceed 64 characters" },
];

const CORES_RULES = [
  { required: true, message: "Physical cores are required" },
  { type: "number" as const, min: 1, message: "Must be at least 1" },
];

const THREADS_RULES = [
  { required: true, message: "Threads are required" },
  { type: "number" as const, min: 1, message: "Must be at least 1" },
];

/**
 * Creates a CPU model from inside the CPU acquisition wizard. The vendor is
 * fixed from the parent step; the created model is returned to the caller so it
 * can be selected immediately.
 */
export const CpuModelSubWorkflow = ({
  open,
  vendorId,
  vendorName,
  onCancel,
  onCreated,
}: CpuModelSubWorkflowProps) => {
  const [form] = Form.useForm<NewCpuModelValues>();
  const { message } = App.useApp();
  const { mutateAsync: createModel } = useCustomMutation();
  const [current, setCurrent] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const values = (Form.useWatch([], form) ?? {}) as NewCpuModelValues;

  useEffect(() => {
    if (!open) return;
    setCurrent(0);
    form.resetFields();
  }, [open, form]);

  const reviewRows = useMemo(
    () => [
      ["Manufacturer", vendorName || "-"],
      ["Name", values.name || "-"],
      [
        "Architecture",
        CPU_ARCHITECTURE_OPTIONS.find(
          (option) => option.value === values.architecture,
        )?.label ?? "-",
      ],
      ["Physical cores", values.physicalCores ?? "-"],
      ["Threads", values.threads ?? "-"],
      ["TDP", values.tdpWatts != null ? `${values.tdpWatts} W` : "-"],
    ],
    [
      vendorName,
      values.name,
      values.architecture,
      values.physicalCores,
      values.threads,
      values.tdpWatts,
    ],
  );

  const handleNext = async () => {
    try {
      await form.validateFields(CPU_MODEL_FIELDS);
    } catch {
      return;
    }
    setCurrent(1);
  };

  const handleCreate = async () => {
    if (!vendorId) {
      message.error("Select a manufacturer first");
      return;
    }

    try {
      const validated = await form.validateFields(CPU_MODEL_FIELDS);
      setSubmitting(true);

      const response = await createModel({
        url: "/api/proxy/cpu-models/workflows",
        method: "post",
        values: {
          ...validated,
          vendorId,
          tdpWatts: validated.tdpWatts ?? null,
        },
      });

      const created = response.data as CreatedCpuModel | undefined;
      if (!created?.id) {
        throw new Error("The server did not return the created CPU model");
      }

      message.success(`CPU model ${created.name ?? ""} created`);
      await onCreated(created);
      form.resetFields();
      setCurrent(0);
    } catch (error) {
      const detail = (error as { message?: string | string[] })?.message;
      if (detail) {
        message.error(Array.isArray(detail) ? detail.join(", ") : detail);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Create a new CPU model"
      width={640}
      destroyOnHidden
      maskClosable={!submitting}
      closable={!submitting}
      onCancel={onCancel}
      footer={
        <Space>
          <Button onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
          {current > 0 ? (
            <Button onClick={() => setCurrent(0)} disabled={submitting}>
              Back
            </Button>
          ) : null}
          {current === 0 ? (
            <Button type="primary" onClick={handleNext}>
              Review
            </Button>
          ) : (
            <Button
              type="primary"
              icon={<FileAddOutlined />}
              loading={submitting}
              onClick={handleCreate}
            >
              Create model
            </Button>
          )}
        </Space>
      }
    >
      <Space direction="vertical" size="middle" style={{ display: "flex" }}>
        <Steps
          current={current}
          size="small"
          items={[{ title: "Model details" }, { title: "Review & create" }]}
        />

        <Alert
          type="info"
          showIcon
          message="Manufacturer is fixed"
          description={`This CPU model will be created for ${vendorName || "the selected manufacturer"} and selected automatically when you return to the acquisition form.`}
        />

        <div style={{ display: current === 0 ? "block" : "none" }}>
          <Form form={form} layout="vertical" preserve>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item label="Name" name="name" rules={NAME_RULES}>
                  <Input maxLength={64} placeholder="e.g. EPYC 7763" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Architecture"
                  name="architecture"
                  rules={[
                    { required: true, message: "Architecture is required" },
                  ]}
                >
                  <Select
                    placeholder="Select architecture"
                    options={CPU_ARCHITECTURE_OPTIONS}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item
                  label="Physical cores"
                  name="physicalCores"
                  rules={CORES_RULES}
                >
                  <InputNumber
                    min={1}
                    precision={0}
                    style={{ width: "100%" }}
                    placeholder="e.g. 64"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item label="Threads" name="threads" rules={THREADS_RULES}>
                  <InputNumber
                    min={1}
                    precision={0}
                    style={{ width: "100%" }}
                    placeholder="e.g. 128"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item
                  label="TDP (watts)"
                  name="tdpWatts"
                  rules={[
                    {
                      type: "number",
                      min: 1,
                      message: "Must be at least 1",
                    },
                  ]}
                >
                  <InputNumber
                    min={1}
                    precision={0}
                    style={{ width: "100%" }}
                    placeholder="Optional, e.g. 280"
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </div>

        {current === 1 ? (
          <Descriptions bordered column={2} size="small">
            {reviewRows.map(([label, value]) => (
              <Descriptions.Item key={label} label={label}>
                {value}
              </Descriptions.Item>
            ))}
          </Descriptions>
        ) : null}
      </Space>
    </Modal>
  );
};
