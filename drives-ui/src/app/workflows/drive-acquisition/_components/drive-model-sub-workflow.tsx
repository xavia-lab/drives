"use client";

import { useEffect, useMemo, useState } from "react";
import { useCustomMutation } from "@refinedev/core";
import { LookupSelect } from "@components/lookup-select";
import { useLookupOptions } from "@hooks/use-lookup-options";
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
  Space,
  Steps,
} from "antd";
import { FileAddOutlined } from "@ant-design/icons";

export interface CreatedDriveModel {
  id: string;
  name?: string;
  modelNumber?: string;
  title?: string;
  manufacturerId?: string;
}

type NewDriveModelValues = {
  name?: string;
  modelNumber?: string;
  storageTypeId?: string;
  formFactorId?: string;
  interfaceId?: string;
  capacityId?: string;
  maxEnduranceTbw?: number | null;
};

interface DriveModelSubWorkflowProps {
  open: boolean;
  manufacturerId?: string;
  manufacturerName?: string;
  onCancel: () => void;
  onCreated: (model: CreatedDriveModel) => void | Promise<void>;
}

const MODEL_FIELDS = [
  "name",
  "modelNumber",
  "storageTypeId",
  "formFactorId",
  "interfaceId",
  "capacityId",
  "maxEnduranceTbw",
];

const NAME_RULES = [
  { required: true, message: "Name is required" },
  { max: 64, message: "Name cannot exceed 64 characters" },
];

const MODEL_NUMBER_RULES = [
  { required: true, message: "Model number is required" },
  { max: 64, message: "Model number cannot exceed 64 characters" },
];

const lookupLabel = (
  options: Array<{ label: string; value: unknown }>,
  value: unknown,
) =>
  options.find((option) => option.value === value)?.label ??
  (typeof value === "string" && value ? value : "-");

/**
 * Creates a drive model from inside the acquisition wizard. The parent
 * manufacturer is fixed; the created model is returned to the caller so it can
 * be selected immediately without waiting for the drive-models query to refresh.
 */
export const DriveModelSubWorkflow = ({
  open,
  manufacturerId,
  manufacturerName,
  onCancel,
  onCreated,
}: DriveModelSubWorkflowProps) => {
  const [form] = Form.useForm<NewDriveModelValues>();
  const { message } = App.useApp();
  const { mutateAsync: createModel } = useCustomMutation();
  const [current, setCurrent] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const { options: storageTypeOptions } = useLookupOptions({
    resource: "storage-types",
  });
  const { options: formFactorOptions } = useLookupOptions({
    resource: "form-factors",
  });
  const { options: interfaceOptions } = useLookupOptions({
    resource: "interfaces",
  });
  const { options: capacityOptions } = useLookupOptions({
    resource: "capacities",
  });

  const values = (Form.useWatch([], form) ?? {}) as NewDriveModelValues;

  useEffect(() => {
    if (!open) return;
    setCurrent(0);
    form.resetFields();
  }, [open, form]);

  const reviewRows = useMemo(
    () => [
      ["Manufacturer", manufacturerName || "-"],
      ["Name", values.name || "-"],
      ["Model number", values.modelNumber || "-"],
      ["Storage type", lookupLabel(storageTypeOptions, values.storageTypeId)],
      ["Form factor", lookupLabel(formFactorOptions, values.formFactorId)],
      ["Interface", lookupLabel(interfaceOptions, values.interfaceId)],
      ["Capacity", lookupLabel(capacityOptions, values.capacityId)],
      [
        "Max endurance",
        values.maxEnduranceTbw != null ? `${values.maxEnduranceTbw} TBW` : "-",
      ],
    ],
    [
      manufacturerName,
      values.name,
      values.modelNumber,
      values.storageTypeId,
      values.formFactorId,
      values.interfaceId,
      values.capacityId,
      values.maxEnduranceTbw,
      storageTypeOptions,
      formFactorOptions,
      interfaceOptions,
      capacityOptions,
    ],
  );

  const handleNext = async () => {
    try {
      await form.validateFields(MODEL_FIELDS);
    } catch {
      return;
    }
    setCurrent(1);
  };

  const handleCreate = async () => {
    if (!manufacturerId) {
      message.error("Select a manufacturer first");
      return;
    }

    try {
      const validated = await form.validateFields(MODEL_FIELDS);
      setSubmitting(true);

      const response = await createModel({
        url: "/api/proxy/drive-models/workflows",
        method: "post",
        values: {
          ...validated,
          manufacturerId,
          maxEnduranceTbw: validated.maxEnduranceTbw ?? null,
        },
      });

      const created = response.data as CreatedDriveModel | undefined;
      if (!created?.id) {
        throw new Error("The server did not return the created drive model");
      }

      message.success(
        created.title ??
          [created.name, created.modelNumber].filter(Boolean).join(" | ") ??
          "Drive model created",
      );
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
      title="Create a new drive model"
      width={760}
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
          description={`This model will be created for ${manufacturerName || "the selected manufacturer"} and selected automatically when you return to the acquisition form.`}
        />

        <div style={{ display: current === 0 ? "block" : "none" }}>
          <Form form={form} layout="vertical" preserve>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item label="Name" name="name" rules={NAME_RULES}>
                  <Input maxLength={64} placeholder="e.g. Exos X24" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Model number"
                  name="modelNumber"
                  rules={MODEL_NUMBER_RULES}
                >
                  <Input maxLength={64} placeholder="e.g. ST16000NM007H" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Storage type"
                  name="storageTypeId"
                  rules={[
                    { required: true, message: "Storage type is required" },
                  ]}
                >
                  <LookupSelect
                    resource="storage-types"
                    placeholder="Select storage type"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Form factor"
                  name="formFactorId"
                  rules={[
                    { required: true, message: "Form factor is required" },
                  ]}
                >
                  <LookupSelect
                    resource="form-factors"
                    placeholder="Select form factor"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Interface"
                  name="interfaceId"
                  rules={[{ required: true, message: "Interface is required" }]}
                >
                  <LookupSelect
                    resource="interfaces"
                    placeholder="Select interface"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Capacity"
                  name="capacityId"
                  rules={[{ required: true, message: "Capacity is required" }]}
                >
                  <LookupSelect
                    resource="capacities"
                    placeholder="Select capacity"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Max endurance (TBW)"
                  name="maxEnduranceTbw"
                  rules={[
                    {
                      type: "number",
                      min: 0,
                      message: "Must be a positive number",
                    },
                  ]}
                >
                  <InputNumber
                    min={0}
                    precision={0}
                    style={{ width: "100%" }}
                    placeholder="Optional, e.g. 14000"
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
