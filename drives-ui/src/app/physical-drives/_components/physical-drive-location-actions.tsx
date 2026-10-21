"use client";

import { useApiUrl, useCan, useCustomMutation } from "@refinedev/core";
import { LookupSelect } from "@components/lookup-select";
import { App, Button, DatePicker, Form, Input, Modal, Space, Tag } from "antd";
import { EnvironmentOutlined } from "@ant-design/icons";
import { useState } from "react";

type LocationFormValues = {
  datacenterId: string;
  notes?: string;
  locatedAt?: { toISOString: () => string } | null;
};

interface PhysicalDriveLocationActionsProps {
  driveId: string;
  /** The drive's current datacenter label, shown as context when moving. */
  currentLocationLabel?: string;
  /** Called after a successful location event so the caller can refetch. */
  onDone: () => void | Promise<void>;
}

/**
 * Records a location event for a physical drive. Recording a datacenter appends
 * a new row to the drive's location history (a move); re-recording the current
 * datacenter is rejected by the backend.
 */
export const PhysicalDriveLocationActions = ({
  driveId,
  currentLocationLabel,
  onDone,
}: PhysicalDriveLocationActionsProps) => {
  const apiUrl = useApiUrl();
  const { message } = App.useApp();
  const { mutateAsync } = useCustomMutation();
  const [form] = Form.useForm();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { data: canLocate } = useCan({
    resource: "physical-drives",
    action: "locate",
  });

  const handleSubmit = async () => {
    try {
      const values = (await form.validateFields()) as LocationFormValues;
      setSubmitting(true);
      await mutateAsync({
        url: `${apiUrl}/physical-drives/${driveId}/locations`,
        method: "post",
        values: {
          datacenterId: values.datacenterId,
          notes: values.notes,
          locatedAt: values.locatedAt?.toISOString(),
        },
      });
      message.success("Location recorded");
      setOpen(false);
      form.resetFields();
      await onDone();
    } catch (error) {
      const err = error as { message?: string };
      if (err?.message) {
        message.error(err.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!canLocate?.can) {
    return null;
  }

  return (
    <>
      <Button
        type="primary"
        icon={<EnvironmentOutlined />}
        onClick={() => setOpen(true)}
      >
        Record Location
      </Button>

      <Modal
        open={open}
        title="Record Drive Location"
        okText="Record"
        confirmLoading={submitting}
        onOk={handleSubmit}
        onCancel={() => {
          setOpen(false);
          form.resetFields();
        }}
        destroyOnHidden
      >
        <Space direction="vertical" size={4} style={{ marginBottom: 16 }}>
          <span>Current location:</span>
          {currentLocationLabel ? (
            <Tag color="blue">{currentLocationLabel}</Tag>
          ) : (
            <Tag>Unassigned</Tag>
          )}
        </Space>

        <Form form={form} layout="vertical">
          <Form.Item
            label="Datacenter"
            name="datacenterId"
            rules={[{ required: true, message: "Select a datacenter" }]}
          >
            <LookupSelect
              resource="datacenters"
              optionLabel="name"
              placeholder="Select datacenter"
            />
          </Form.Item>

          <Form.Item label="Arrived At" name="locatedAt">
            <DatePicker
              showTime
              style={{ width: "100%" }}
              placeholder="Defaults to now when omitted"
            />
          </Form.Item>

          <Form.Item label="Notes" name="notes">
            <Input.TextArea
              rows={2}
              placeholder="Optional operator note (ticket ref, transport details, ...)"
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};
