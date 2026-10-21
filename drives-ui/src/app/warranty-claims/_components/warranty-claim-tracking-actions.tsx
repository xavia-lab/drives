"use client";

import { useState } from "react";
import { useApiUrl, useCan, useCustomMutation } from "@refinedev/core";
import { LookupSelect } from "@components/lookup-select";
import {
  App,
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Typography,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { WARRANTY_CLAIM_EVENT_LABELS } from "./warranty-claim-tracking-timeline";

const { Text } = Typography;

type TrackingFormValues = {
  eventType: string;
  eventTimestamp?: { toISOString: () => string } | null;
  notes?: string;
  replacementPhysicalDriveId?: string;
};

interface WarrantyClaimTrackingActionsProps {
  claimId: string;
  allowedEvents: string[];
  onDone: () => void | Promise<void>;
}

/**
 * Appends a tracking event to a warranty claim. Only the events allowed from
 * the derived current status are offered (NOTE is always available).
 */
export const WarrantyClaimTrackingActions = ({
  claimId,
  allowedEvents,
  onDone,
}: WarrantyClaimTrackingActionsProps) => {
  const apiUrl = useApiUrl();
  const { message } = App.useApp();
  const { mutateAsync } = useCustomMutation();
  const [form] = Form.useForm<TrackingFormValues>();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { data: canManageClaims } = useCan({
    resource: "warranty-claims",
    action: "edit",
  });

  const eventType = Form.useWatch("eventType", form);
  const replaceDrive = eventType === "REPLACEMENT_RECEIVED";

  const eventOptions = allowedEvents.map((value) => ({
    value,
    label: WARRANTY_CLAIM_EVENT_LABELS[value] ?? value,
  }));

  const handleSubmit = async () => {
    try {
      const values = (await form.validateFields()) as TrackingFormValues;
      setSubmitting(true);
      await mutateAsync({
        url: `${apiUrl}/warranty-claims/${claimId}/tracking`,
        method: "post",
        values: {
          eventType: values.eventType,
          eventTimestamp: values.eventTimestamp?.toISOString(),
          notes: values.notes,
          replacementPhysicalDriveId:
            values.eventType === "REPLACEMENT_RECEIVED"
              ? values.replacementPhysicalDriveId
              : undefined,
        },
      });
      message.success("Tracking event recorded");
      setOpen(false);
      form.resetFields();
      await onDone();
    } catch (error) {
      const detail = (error as { message?: string | string[] })?.message;
      if (detail) {
        message.error(Array.isArray(detail) ? detail.join(", ") : detail);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!canManageClaims?.can) {
    return null;
  }

  return (
    <>
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={() => setOpen(true)}
        disabled={allowedEvents.length === 0}
      >
        Record Event
      </Button>

      <Modal
        open={open}
        title="Record Tracking Event"
        okText="Record"
        confirmLoading={submitting}
        onOk={handleSubmit}
        onCancel={() => {
          setOpen(false);
          form.resetFields();
        }}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Event"
            name="eventType"
            rules={[{ required: true, message: "Select an event" }]}
          >
            <Select
              options={eventOptions}
              placeholder="Select a tracking event"
            />
          </Form.Item>

          <Form.Item label="Event Timestamp" name="eventTimestamp">
            <DatePicker
              showTime
              style={{ width: "100%" }}
              placeholder="Defaults to now when omitted"
            />
          </Form.Item>

          {replaceDrive ? (
            <Form.Item
              label="Replacement Drive"
              name="replacementPhysicalDriveId"
              rules={[
                {
                  required: true,
                  message: "Select the replacement drive received",
                },
              ]}
            >
              <LookupSelect
                resource="physical-drives"
                optionLabel="serialNumber"
                placeholder="Select the received drive"
              />
            </Form.Item>
          ) : null}

          <Form.Item label="Notes" name="notes">
            <Input.TextArea
              rows={3}
              placeholder="Vendor reference, rejection reason, tracking details, ..."
            />
          </Form.Item>

          <Space direction="vertical" size={2}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              The claim status is derived from the latest state-changing event.
            </Text>
          </Space>
        </Form>
      </Modal>
    </>
  );
};
