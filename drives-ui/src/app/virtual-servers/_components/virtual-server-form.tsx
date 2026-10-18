"use client";

import { LookupSelect } from "@components/lookup-select";
import { useLookupOptions } from "@hooks/use-lookup-options";
import { uuidv7 } from "@utils/uuidv7";
import { EditableProTable } from "@ant-design/pro-components";
import type { ProColumns } from "@ant-design/pro-components";
import { useList } from "@refinedev/core";
import type { BaseRecord } from "@refinedev/core";
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
  Switch,
  Typography,
} from "antd";
import type { FormInstance, FormProps } from "antd";
import type { Key } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

const { Text } = Typography;

type PassthroughSlotRecord = {
  id: string;
  serverSlotId?: string;
};

type HostSlotRecord = {
  id: string;
  slotLabel: string;
  supportedInterfaceId: string;
  pcieBusAddress?: string | null;
};

const MEMORY_UNIT_OPTIONS = [
  { label: "MiB", value: "MiB" },
  { label: "GiB", value: "GiB" },
  { label: "TiB", value: "TiB" },
];

const TYPE_OPTIONS = [
  { label: "VM", value: "VM" },
  { label: "Container", value: "CONTAINER" },
];

const HOSTNAME_RULES = [
  { required: true, message: "Hostname is required" },
  { max: 128, message: "Hostname cannot exceed 128 characters" },
];

const HOST_SERVER_RULES = [
  { required: true, message: "Host server is required" },
];

const OPERATING_SYSTEM_RULES = [
  { required: true, message: "Operating System is required" },
];

const ALLOCATED_VCPUS_RULES = [
  { required: true, message: "Allocated vCPUs is required" },
  { type: "number" as const, min: 1, message: "Must be at least 1" },
];

const ALLOCATED_MEMORY_VALUE_RULES = [
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

const ALLOCATED_MEMORY_UNIT_RULES = [
  { required: true, message: "Memory unit is required" },
];

const validatePassthroughSlots = async (
  _rule: unknown,
  value: PassthroughSlotRecord[] | undefined,
) => {
  if (!value || value.length === 0) {
    return;
  }

  const seen = new Set<string>();
  for (const row of value) {
    if (!row.serverSlotId) {
      throw new Error("Each passthrough slot requires a server slot");
    }
    if (seen.has(row.serverSlotId)) {
      throw new Error("Each server slot can only be passed through once");
    }
    seen.add(row.serverSlotId);
  }
};

export const VirtualServerForm = ({
  formProps,
  form,
}: {
  formProps: FormProps;
  form: FormInstance;
}) => {
  const [slotEditableKeys, setSlotEditableKeys] = useState<Key[]>([]);

  const { options: interfaceOptions } = useLookupOptions({
    resource: "interfaces",
  });

  // Host physical servers are fetched whole (slots included) so the passthrough
  // dropdown can be scoped to the currently selected host.
  const { query: physicalServersQuery } = useList({
    resource: "physical-servers",
    pagination: { mode: "server", currentPage: 1, pageSize: 200 },
  });

  const physicalServers = useMemo(
    () => physicalServersQuery.data?.data ?? [],
    [physicalServersQuery.data?.data],
  );

  // CPU models provide the per-socket thread count; combined with a host's
  // socket count this yields the host's total hardware threads.
  const { query: cpuModelsQuery } = useList({
    resource: "cpu-models",
    pagination: { mode: "server", currentPage: 1, pageSize: 200 },
  });

  const threadsByCpuModelId = useMemo(() => {
    const map = new Map<string, number>();
    for (const model of cpuModelsQuery.data?.data ?? []) {
      if (typeof model.id === "string" && typeof model.threads === "number") {
        map.set(model.id, model.threads);
      }
    }
    return map;
  }, [cpuModelsQuery.data?.data]);

  const hostServerId = Form.useWatch("hostServerId", form) as
    string | undefined;
  const serverType = Form.useWatch("type", form) as string | undefined;
  const isContainer = serverType === "CONTAINER";

  // Clear existing passthrough rows when the user switches the host server
  // (the previously selected slots no longer belong to the host).
  const previousHostRef = useRef<string | undefined>(hostServerId);
  useEffect(() => {
    if (
      previousHostRef.current !== undefined &&
      previousHostRef.current !== hostServerId
    ) {
      form.setFieldValue("passthroughSlots", []);
    }
    previousHostRef.current = hostServerId;
  }, [hostServerId, form]);

  // Containers cannot have passthrough slots; drop any rows when the type is
  // switched to CONTAINER.
  useEffect(() => {
    if (isContainer) {
      form.setFieldValue("passthroughSlots", []);
    }
  }, [isContainer, form]);

  const hostSlots = useMemo<HostSlotRecord[]>(() => {
    const host = physicalServers.find(
      (server: BaseRecord) => server.id === hostServerId,
    );
    return (host?.slots as HostSlotRecord[] | undefined) ?? [];
  }, [physicalServers, hostServerId]);

  const slotOptions = useMemo(
    () =>
      hostSlots.map((slot) => {
        const interfaceName =
          interfaceOptions.find(
            (option) => option.value === slot.supportedInterfaceId,
          )?.label ?? slot.supportedInterfaceId;
        const suffix = slot.pcieBusAddress ? ` [${slot.pcieBusAddress}]` : "";
        return {
          label: `${slot.slotLabel} — ${interfaceName}${suffix}`,
          value: slot.id,
        };
      }),
    [hostSlots, interfaceOptions],
  );

  const hostServer = physicalServers.find(
    (server: BaseRecord) => server.id === hostServerId,
  );

  // vCPU ceiling: sockets × threads-per-socket for the selected host.
  const hostThreads = hostServer
    ? threadsByCpuModelId.get(hostServer.cpuModelId as string)
    : undefined;
  const maxVcpus =
    hostServer && hostThreads && Number(hostServer.cpuCount)
      ? Number(hostServer.cpuCount) * hostThreads
      : undefined;

  const slotColumns: ProColumns<PassthroughSlotRecord>[] = [
    {
      title: "Server Slot",
      dataIndex: "serverSlotId",
      width: "80%",
      render: (_, record) =>
        slotOptions.find((option) => option.value === record.serverSlotId)
          ?.label ??
        record.serverSlotId ??
        "-",
      renderFormItem: () => (
        <Select
          showSearch
          optionFilterProp="label"
          options={slotOptions}
          loading={physicalServersQuery.isLoading}
          placeholder="Select host slot"
          disabled={!hostServerId}
        />
      ),
      formItemProps: {
        rules: [{ required: true, message: "Server slot is required" }],
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
    <Form {...formProps} form={form} layout="vertical">
      <Space direction="vertical" size="middle" style={{ display: "flex" }}>
        <Card title={"Virtual Server Information"}>
          <Row gutter={[16, 24]}>
            <Col span={12}>
              <Form.Item
                label={"Host Server"}
                name={["hostServerId"]}
                rules={HOST_SERVER_RULES}
                extra={
                  hostServer
                    ? `Capacity: ${Number(hostServer.memoryValue)} ${hostServer.memoryUnit}`
                    : undefined
                }
              >
                <LookupSelect
                  resource="physical-servers"
                  optionLabel="hostname"
                  placeholder="Select host server"
                />
              </Form.Item>
              <Form.Item
                label={"Hostname"}
                name={["hostname"]}
                rules={HOSTNAME_RULES}
              >
                <Input maxLength={128} placeholder="e.g. truenas-core.local" />
              </Form.Item>
              <Form.Item label={"VMID"} name={["vmid"]}>
                <InputNumber
                  min={1}
                  precision={0}
                  style={{ width: "100%" }}
                  placeholder="e.g. 101"
                />
              </Form.Item>
              <Form.Item label={"Type"} name={["type"]} initialValue={"VM"}>
                <Select options={TYPE_OPTIONS} />
              </Form.Item>
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
              <Form.Item
                label={"Allocated vCPUs"}
                name={["allocatedVcpus"]}
                rules={[
                  ...ALLOCATED_VCPUS_RULES,
                  ...(maxVcpus
                    ? [
                        {
                          type: "number" as const,
                          max: maxVcpus,
                          message: `Cannot exceed the host's ${maxVcpus} hardware threads`,
                        },
                      ]
                    : []),
                ]}
                extra={
                  maxVcpus
                    ? `Host capacity: ${maxVcpus} hardware threads`
                    : undefined
                }
              >
                <InputNumber
                  min={1}
                  max={maxVcpus}
                  precision={0}
                  style={{ width: "100%" }}
                  placeholder="e.g. 4"
                />
              </Form.Item>
              <Row gutter={8}>
                <Col span={14}>
                  <Form.Item
                    label={"Allocated Memory"}
                    name={["allocatedMemoryValue"]}
                    rules={ALLOCATED_MEMORY_VALUE_RULES}
                  >
                    <InputNumber
                      min={0}
                      max={99999999.99}
                      precision={2}
                      style={{ width: "100%" }}
                      placeholder="e.g. 8"
                    />
                  </Form.Item>
                </Col>
                <Col span={10}>
                  <Form.Item
                    label={"Unit"}
                    name={["allocatedMemoryUnit"]}
                    rules={ALLOCATED_MEMORY_UNIT_RULES}
                    initialValue={"GiB"}
                  >
                    <Select placeholder="Unit" options={MEMORY_UNIT_OPTIONS} />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item
                label={"Active"}
                name={["isActive"]}
                valuePropName="checked"
                initialValue={true}
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label={"Notes"} name={["notes"]}>
            <Input.TextArea
              rows={3}
              placeholder="Technician notes..."
              maxLength={2000}
            />
          </Form.Item>
        </Card>

        <Card title={"Passthrough Slots"}>
          {isContainer ? (
            <Text type="secondary">
              Containers cannot have passthrough slots.
            </Text>
          ) : hostServerId ? (
            <Form.Item
              name={"passthroughSlots"}
              style={{ marginBottom: 0 }}
              rules={[{ validator: validatePassthroughSlots }]}
            >
              <EditableProTable<PassthroughSlotRecord>
                rowKey="id"
                columns={slotColumns}
                search={false}
                options={false}
                pagination={false}
                recordCreatorProps={{
                  newRecordType: "dataSource",
                  creatorButtonText: "Add Passthrough Slot",
                  record: () => ({ id: uuidv7() }),
                }}
                editable={{
                  type: "multiple",
                  editableKeys: slotEditableKeys,
                  onChange: setSlotEditableKeys,
                }}
              />
            </Form.Item>
          ) : (
            <Text type="secondary">
              Select a host server to add passthrough slots.
            </Text>
          )}
        </Card>
      </Space>
    </Form>
  );
};
