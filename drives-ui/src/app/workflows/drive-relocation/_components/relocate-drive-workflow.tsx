"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  useApiUrl,
  useCustom,
  useCustomMutation,
  useList,
  useNotification,
} from "@refinedev/core";
import {
  Alert,
  Col,
  DatePicker,
  Descriptions,
  Form,
  Input,
  Row,
  Select,
  Space,
  Tag,
  Typography,
} from "antd";
import {
  EnvironmentOutlined,
  FileSearchOutlined,
  SwapOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  WorkflowWizard,
  type WorkflowStep,
  type WorkflowValues,
} from "@components/workflow";

const { Text } = Typography;

const UNASSIGNED_SOURCE = "__unassigned__";
const PAGE_SIZE = 250;

// Date fields store plain `YYYY-MM-DD` strings; these props belong on the
// `Form.Item` (not the `DatePicker`) so antd converts to/from Dayjs correctly.
const dateFieldProps = {
  getValueProps: (value?: string | null) => ({
    value: value ? dayjs(value) : undefined,
  }),
  normalize: (value: unknown) =>
    value ? dayjs(value as string).format("YYYY-MM-DD") : undefined,
};

interface DatacenterRecord {
  id: string;
  code: string;
  name: string;
}

interface DriveRecord {
  id: string;
  label?: string;
  serialNumber?: string;
  driveModelId?: string;
  currentLocation?: {
    datacenterId: string;
    code: string;
    name: string;
  } | null;
  currentAssignment?: {
    serverId: string;
    serverHostname: string;
    slotLabel: string;
  } | null;
}

// A type alias (not an interface) so it is assignable to the wizard's
// `Record<string, unknown>` value bag.
type RelocateFormValues = {
  sourceDatacenterId?: string;
  physicalDriveId?: string;
  datacenterId?: string;
  locatedAt?: string;
  notes?: string;
};

export const RelocateDriveWorkflow = () => {
  const [form] = Form.useForm<RelocateFormValues>();
  const apiUrl = useApiUrl();
  const router = useRouter();
  const { open } = useNotification();
  const { mutateAsync: relocateDrive } = useCustomMutation();

  const { query: datacentersQuery } = useList<DatacenterRecord>({
    resource: "datacenters",
    pagination: { mode: "server", currentPage: 1, pageSize: 100 },
  });
  const datacenters = useMemo(
    () => datacentersQuery.data?.data ?? [],
    [datacentersQuery.data?.data],
  );

  const sourceDatacenterId = Form.useWatch("sourceDatacenterId", form);
  const isUnassignedSource = sourceDatacenterId === UNASSIGNED_SOURCE;
  const physicalDriveId = Form.useWatch("physicalDriveId", form);
  const targetDatacenterId = Form.useWatch("datacenterId", form);

  const drivesQuery = useCustom({
    url: `${apiUrl}/physical-drives`,
    method: "get",
    config: {
      query: isUnassignedSource
        ? { unassigned: true, pageSize: PAGE_SIZE }
        : {
            filterField: "currentLocation",
            filterOperator: "in",
            filterValue: sourceDatacenterId,
            pageSize: PAGE_SIZE,
          },
    },
    queryOptions: { enabled: Boolean(sourceDatacenterId) },
  });

  const sourceDrives = useMemo(() => {
    const payload = drivesQuery.result?.data as
      { data?: DriveRecord[] } | undefined;
    return payload?.data ?? [];
  }, [drivesQuery.result?.data]);

  // Only drives that are not seated in a server slot can be relocated here.
  const eligibleDrives = useMemo(
    () => sourceDrives.filter((drive) => !drive.currentAssignment),
    [sourceDrives],
  );
  const hiddenMountedCount = sourceDrives.length - eligibleDrives.length;

  const datacenterNames = useMemo(
    () =>
      new Map(
        datacenters.map((datacenter) => [
          datacenter.id,
          `${datacenter.code} — ${datacenter.name}`,
        ]),
      ),
    [datacenters],
  );

  const sourceOptions = useMemo(
    () => [
      ...datacenters.map((datacenter) => ({
        label: `${datacenter.code} — ${datacenter.name}`,
        value: datacenter.id,
      })),
      { label: "Unassigned (no location)", value: UNASSIGNED_SOURCE },
    ],
    [datacenters],
  );

  const targetOptions = useMemo(
    () =>
      datacenters
        .filter(
          (datacenter) =>
            isUnassignedSource || datacenter.id !== sourceDatacenterId,
        )
        .map((datacenter) => ({
          label: `${datacenter.code} — ${datacenter.name}`,
          value: datacenter.id,
        })),
    [datacenters, isUnassignedSource, sourceDatacenterId],
  );

  const driveOptions = useMemo(
    () =>
      eligibleDrives.map((drive) => ({
        label: [drive.label, drive.serialNumber].filter(Boolean).join(" — "),
        value: drive.id,
      })),
    [eligibleDrives],
  );

  const selectedDrive = useMemo(
    () => sourceDrives.find((drive) => drive.id === physicalDriveId),
    [sourceDrives, physicalDriveId],
  );

  const sourceLabel = isUnassignedSource
    ? "Unassigned"
    : ((sourceDatacenterId && datacenterNames.get(sourceDatacenterId)) ?? "-");
  const targetLabel =
    (targetDatacenterId && datacenterNames.get(targetDatacenterId)) ?? "-";

  const initialValues = useMemo<RelocateFormValues>(
    () => ({ locatedAt: dayjs().format("YYYY-MM-DD") }),
    [],
  );

  const steps: WorkflowStep[] = [
    {
      key: "source",
      title: "Find drive",
      description: "Source datacenter & drive",
      icon: <FileSearchOutlined />,
      fields: [["sourceDatacenterId"], ["physicalDriveId"]],
      content: () => (
        <Space direction="vertical" size="middle" style={{ display: "flex" }}>
          <Alert
            type="info"
            showIcon
            message="Find an unseated drive"
            description="Relocation applies to drives that are not currently seated in a server slot. To move a mounted drive, unmount it from the server's Assign Drives page first."
          />
          <Row gutter={16}>
            <Col xs={24} md={10}>
              <Form.Item
                label="Source datacenter"
                name="sourceDatacenterId"
                rules={[
                  { required: true, message: "Select the source datacenter" },
                ]}
              >
                <Select
                  showSearch
                  optionFilterProp="label"
                  placeholder="Select source datacenter"
                  loading={datacentersQuery.isLoading}
                  options={sourceOptions}
                  onChange={() => {
                    form.setFieldValue("physicalDriveId", undefined);
                    form.setFieldValue("datacenterId", undefined);
                  }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={14}>
              <Form.Item
                label="Drive"
                name="physicalDriveId"
                rules={[{ required: true, message: "Select the drive" }]}
              >
                <Select
                  showSearch
                  optionFilterProp="label"
                  placeholder={
                    sourceDatacenterId
                      ? eligibleDrives.length > 0
                        ? "Select drive"
                        : "No eligible drives in this source"
                      : "Select a source datacenter first"
                  }
                  disabled={!sourceDatacenterId}
                  loading={drivesQuery.query.isLoading}
                  options={driveOptions}
                />
              </Form.Item>
            </Col>
          </Row>
          {!isUnassignedSource && hiddenMountedCount > 0 ? (
            <Text type="secondary" style={{ fontSize: 13 }}>
              {hiddenMountedCount} mounted drive
              {hiddenMountedCount === 1 ? " is" : "s are"} hidden because
              {hiddenMountedCount === 1 ? " it is" : " they are"} seated in a
              server. Unmount from the Assign Drives page to relocate.
            </Text>
          ) : null}
        </Space>
      ),
    },
    {
      key: "destination",
      title: "Destination",
      description: "New location & arrival",
      icon: <EnvironmentOutlined />,
      fields: [["datacenterId"], ["locatedAt"], ["notes"]],
      content: () => (
        <Space direction="vertical" size="middle" style={{ display: "flex" }}>
          <Alert
            type="info"
            showIcon
            message="New location"
            description="Choose the datacenter the drive is moving to and when it arrives."
          />
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Target datacenter"
                name="datacenterId"
                rules={[
                  { required: true, message: "Select the target datacenter" },
                ]}
              >
                <Select
                  showSearch
                  optionFilterProp="label"
                  placeholder="Select target datacenter"
                  loading={datacentersQuery.isLoading}
                  options={targetOptions}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Arrival date"
                name="locatedAt"
                {...dateFieldProps}
              >
                <DatePicker
                  style={{ width: "100%" }}
                  placeholder="Defaults to today"
                />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="Relocation notes" name="notes">
                <Input.TextArea
                  rows={3}
                  placeholder="Optional: ticket reference, transport details, rack location..."
                />
              </Form.Item>
            </Col>
          </Row>
        </Space>
      ),
    },
    {
      key: "review",
      title: "Review",
      description: "Confirm & relocate",
      icon: <SwapOutlined />,
      fields: [],
      content: ({ values }) => {
        const data = values as RelocateFormValues;

        return (
          <Space direction="vertical" size="middle" style={{ display: "flex" }}>
            <Alert
              type="info"
              showIcon
              message="Review & confirm"
              description="Completing this workflow appends a new location event. The drive's full location history is preserved."
            />
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Drive">
                {selectedDrive
                  ? [selectedDrive.label, selectedDrive.serialNumber]
                      .filter(Boolean)
                      .join(" — ")
                  : "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Serial number">
                {selectedDrive?.serialNumber ?? "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Current location">
                {sourceLabel}
              </Descriptions.Item>
              <Descriptions.Item label="New location">
                {targetLabel}
              </Descriptions.Item>
              <Descriptions.Item label="Server seating" span={2}>
                <Tag color="default">Not seated</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Arrival date">
                {data.locatedAt ?? "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Notes">
                {data.notes || "-"}
              </Descriptions.Item>
            </Descriptions>
            <Text type="secondary">
              This action is atomic: either the drive is relocated or nothing
              changes.
            </Text>
          </Space>
        );
      },
    },
  ];

  const handleFinish = async (raw: WorkflowValues) => {
    const values = raw as RelocateFormValues;
    const driveId = values.physicalDriveId;

    if (!driveId) {
      return;
    }

    await relocateDrive({
      url: `${apiUrl}/physical-drives/${driveId}/relocations`,
      method: "post",
      values: {
        datacenterId: values.datacenterId,
        locatedAt: values.locatedAt || undefined,
        notes: values.notes || undefined,
      },
    });

    open?.({
      type: "success",
      message: "Drive relocated",
      description: selectedDrive?.label
        ? `Drive ${selectedDrive.label} is now located in ${targetLabel}.`
        : `The drive is now located in ${targetLabel}.`,
      key: "drive-relocation",
    });

    router.push(`/physical-drives/show/${driveId}`);
  };

  return (
    <WorkflowWizard
      title="Relocate Drive"
      subtitle="Move an unseated drive to another datacenter, preserving its location history."
      icon={<SwapOutlined />}
      form={form}
      steps={steps}
      initialValues={initialValues}
      submitLabel="Relocate drive"
      submittingLabel="Relocating..."
      onCancel={() => router.push("/dashboard")}
      onFinish={handleFinish}
    />
  );
};
