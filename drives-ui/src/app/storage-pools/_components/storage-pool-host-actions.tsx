"use client";

import { useApiUrl, useCustomMutation } from "@refinedev/core";
import { LookupSelect } from "@components/lookup-select";
import { App, Button, Form, Input, Modal, Radio, Space } from "antd";
import { ExportOutlined, ImportOutlined } from "@ant-design/icons";
import { useState } from "react";

type HostType = "physical" | "virtual";

interface StoragePoolHostActionsProps {
  poolId: string;
  isAttached: boolean;
  /** Called after a successful IMPORT/EXPORT so the caller can refetch. */
  onDone: () => void | Promise<void>;
}

/**
 * Import/Export controls for a storage pool. Import appends an IMPORT event
 * (only valid while detached); Export appends an EXPORT event (only valid while
 * attached). Both are recorded in the pool's host history.
 */
export const StoragePoolHostActions = ({
  poolId,
  isAttached,
  onDone,
}: StoragePoolHostActionsProps) => {
  const apiUrl = useApiUrl();
  const { message, modal } = App.useApp();
  const { mutateAsync } = useCustomMutation();
  const [form] = Form.useForm();
  const [open, setOpen] = useState(false);
  const [hostType, setHostType] = useState<HostType>("physical");
  const [submitting, setSubmitting] = useState(false);

  const handleImport = async () => {
    try {
      const values = (await form.validateFields()) as Record<string, unknown>;
      setSubmitting(true);
      await mutateAsync({
        url: `${apiUrl}/storage-pools/${poolId}/import`,
        method: "post",
        values,
      });
      message.success("Storage pool imported");
      setOpen(false);
      form.resetFields();
      setHostType("physical");
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

  const handleExport = () => {
    modal.confirm({
      title: "Detach storage pool?",
      content:
        "An EXPORT event will be recorded and the pool will become detached.",
      okText: "Export",
      okButtonProps: { danger: true },
      onOk: async () => {
        await mutateAsync({
          url: `${apiUrl}/storage-pools/${poolId}/export`,
          method: "post",
          values: {},
        });
        message.success("Storage pool exported");
        await onDone();
      },
    });
  };

  return (
    <>
      <Space>
        <Button
          type="primary"
          icon={<ImportOutlined />}
          disabled={isAttached}
          onClick={() => setOpen(true)}
        >
          Import
        </Button>
        <Button
          danger
          icon={<ExportOutlined />}
          disabled={!isAttached}
          onClick={handleExport}
        >
          Export
        </Button>
      </Space>

      <Modal
        open={open}
        title="Import Storage Pool"
        okText="Import"
        confirmLoading={submitting}
        onOk={handleImport}
        onCancel={() => {
          setOpen(false);
          form.resetFields();
          setHostType("physical");
        }}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ hostType: "physical" }}
        >
          <Form.Item label="Host Type" name="hostType">
            <Radio.Group
              onChange={(event) => {
                const next = event.target.value as HostType;
                setHostType(next);
                form.setFieldValue(
                  next === "physical" ? "virtualServerId" : "serverId",
                  null,
                );
              }}
            >
              <Radio.Button value="physical">Physical</Radio.Button>
              <Radio.Button value="virtual">Virtual</Radio.Button>
            </Radio.Group>
          </Form.Item>

          {hostType === "physical" ? (
            <Form.Item
              label="Physical Server"
              name="serverId"
              rules={[{ required: true, message: "Select a physical server" }]}
            >
              <LookupSelect
                resource="physical-servers"
                optionLabel="hostname"
                placeholder="Select physical server"
              />
            </Form.Item>
          ) : (
            <Form.Item
              label="Virtual Server"
              name="virtualServerId"
              rules={[{ required: true, message: "Select a virtual server" }]}
            >
              <LookupSelect
                resource="virtual-servers"
                optionLabel="hostname"
                placeholder="Select virtual server"
              />
            </Form.Item>
          )}

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
