"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  useApiUrl,
  useCustomMutation,
  useList,
  useNotification,
} from "@refinedev/core";
import {
  Alert,
  App,
  Card,
  Col,
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
  FileProtectOutlined,
  HddOutlined,
  ShopOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useLookupOptions } from "@hooks/use-lookup-options";
import {
  WorkflowWizard,
  type WorkflowStep,
  type WorkflowValues,
} from "@components/workflow";

const { Text } = Typography;

type DatacenterRecord = {
  id: string;
  code: string;
  name: string;
};

type PhysicalDriveRecord = {
  id: string;
  label?: string;
  serialNumber?: string;
  warrantyExpiryDate?: string | null;
  currentAssignment?: {
    serverId?: string;
    serverHostname?: string;
    slotLabel?: string;
  } | null;
  currentLifecycle?: {
    state?: string;
    allowedEvents?: string[];
  } | null;
};

type WarrantyClaimRecord = {
  id: string;
  physicalDriveId: string;
  currentStatus?: string;
};

type ClaimFormValues = {
  datacenterId?: string;
  physicalDriveId?: string;
  handledByVendorId?: string;
  rmaTrackingNumber?: string;
  notes?: string;
};

// Lifecycle events the backend will append when the claim is opened.
const plannedEvents = (drive?: PhysicalDriveRecord): string[] => {
  if (!drive) {
    return [];
  }
  const state = drive.currentLifecycle?.state;
  const allowed = drive.currentLifecycle?.allowedEvents ?? [];

  if (state === "IN_SERVICE") {
    return allowed.includes("DEPROVISION")
      ? ["DEPROVISION", "RMA_INITIATE"]
      : [];
  }
  return allowed.includes("RMA_INITIATE") ? ["RMA_INITIATE"] : [];
};

// A drive is still covered through its expiry date (inclusive).
const isWarrantyActive = (drive: PhysicalDriveRecord): boolean =>
  !drive.warrantyExpiryDate ||
  !dayjs(drive.warrantyExpiryDate).isBefore(dayjs(), "day");

const isEligible = (drive: PhysicalDriveRecord): boolean =>
  !drive.currentAssignment &&
  plannedEvents(drive).length > 0 &&
  isWarrantyActive(drive);

export const CreateWarrantyClaimWorkflow = () => {
  const [form] = Form.useForm<ClaimFormValues>();
  const apiUrl = useApiUrl();
  const router = useRouter();
  const { message } = App.useApp();
  const { open } = useNotification();
  const { mutateAsync: initiateClaim } = useCustomMutation();

  const datacenterId = Form.useWatch("datacenterId", form);
  const physicalDriveId = Form.useWatch("physicalDriveId", form);
  const handledByVendorId = Form.useWatch("handledByVendorId", form);
  const rmaTrackingNumber = Form.useWatch("rmaTrackingNumber", form);
  const notes = Form.useWatch("notes", form);

  const { query: datacentersQuery } = useList<DatacenterRecord>({
    resource: "datacenters",
    pagination: { mode: "server", currentPage: 1, pageSize: 100 },
  });
  const datacenters = useMemo(
    () => datacentersQuery.data?.data ?? [],
    [datacentersQuery.data?.data],
  );

  const { query: drivesQuery } = useList<PhysicalDriveRecord>({
    resource: "physical-drives",
    filters: datacenterId
      ? [
          {
            field: "currentLocation",
            operator: "in" as const,
            value: [datacenterId],
          },
        ]
      : [],
    pagination: { mode: "server", currentPage: 1, pageSize: 250 },
    queryOptions: { enabled: Boolean(datacenterId) },
  });
  const drives = useMemo(
    () => drivesQuery.data?.data ?? [],
    [drivesQuery.data?.data],
  );

  // Claims are independent from the drive lifecycle when created through the
  // generic CRUD UI, so exclude drives with an in-progress claim explicitly.
  const { query: claimsQuery } = useList<WarrantyClaimRecord>({
    resource: "warranty-claims",
    pagination: { mode: "server", currentPage: 1, pageSize: 250 },
  });
  const { options: vendorOptions, isLoading: vendorsLoading } =
    useLookupOptions({
      resource: "vendors",
      optionLabel: "name",
    });

  const datacenterOptions = useMemo(
    () =>
      datacenters.map((datacenter) => ({
        label: `${datacenter.code} — ${datacenter.name}`,
        value: datacenter.id,
      })),
    [datacenters],
  );

  const eligibleDrives = useMemo(() => drives.filter(isEligible), [drives]);
  const hiddenDriveCount = drives.length - eligibleDrives.length;

  const driveOptions = useMemo(
    () =>
      eligibleDrives.map((drive) => ({
        label: [drive.label, drive.serialNumber].filter(Boolean).join(" — "),
        value: drive.id,
      })),
    [eligibleDrives],
  );

  const selectedDrive = useMemo(
    () => eligibleDrives.find((drive) => drive.id === physicalDriveId),
    [eligibleDrives, physicalDriveId],
  );
  const selectedDatacenter = useMemo(
    () => datacenters.find((datacenter) => datacenter.id === datacenterId),
    [datacenters, datacenterId],
  );
  const vendorName = useMemo(
    () =>
      (vendorOptions.find((option) => option.value === handledByVendorId)
        ?.label as string | undefined) ?? undefined,
    [vendorOptions, handledByVendorId],
  );
  const planned = plannedEvents(selectedDrive);

  const handleDatacenterChange = () => {
    form.resetFields(["physicalDriveId"]);
  };

  const steps: WorkflowStep[] = [
    {
      key: "datacenter",
      title: "Datacenter",
      description: "Where the drive is located",
      icon: <EnvironmentOutlined />,
      fields: [["datacenterId"]],
      content: () => (
        <Space direction="vertical" size="middle" style={{ display: "flex" }}>
          <Alert
            type="info"
            showIcon
            message="Select the datacenter"
            description="Only unseated drives currently located in this datacenter can be claimed."
          />
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Datacenter"
                name="datacenterId"
                rules={[{ required: true, message: "Select a datacenter" }]}
              >
                <Select
                  showSearch
                  optionFilterProp="label"
                  placeholder="Select datacenter"
                  loading={datacentersQuery.isLoading}
                  options={datacenterOptions}
                  onChange={handleDatacenterChange}
                />
              </Form.Item>
            </Col>
          </Row>
        </Space>
      ),
    },
    {
      key: "drive",
      title: "Drive",
      description: "Pick an unseated drive",
      icon: <HddOutlined />,
      fields: [["physicalDriveId"]],
      validate: () => {
        if (claimsQuery.isLoading) {
          message.warning("Checking existing warranty claims...");
          return false;
        }
        if (
          datacenterId &&
          !drivesQuery.isLoading &&
          eligibleDrives.length === 0
        ) {
          return false;
        }
        return true;
      },
      content: () => (
        <Space direction="vertical" size="middle" style={{ display: "flex" }}>
          <Alert
            type="info"
            showIcon
            message="Select a drive"
            description="Only drives that are not seated in a server slot and whose lifecycle can enter RMA are shown."
          />
          <Row gutter={16}>
            <Col xs={24} md={14}>
              <Form.Item
                label="Physical Drive"
                name="physicalDriveId"
                rules={[{ required: true, message: "Select the drive" }]}
              >
                <Select
                  showSearch
                  optionFilterProp="label"
                  placeholder={
                    datacenterId
                      ? eligibleDrives.length > 0
                        ? "Select drive"
                        : "No eligible drives in this datacenter"
                      : "Select a datacenter first"
                  }
                  disabled={!datacenterId}
                  loading={drivesQuery.isLoading}
                  options={driveOptions}
                />
              </Form.Item>
            </Col>
          </Row>

          {datacenterId &&
          !drivesQuery.isLoading &&
          eligibleDrives.length === 0 ? (
            <Alert
              type="warning"
              showIcon
              message="No eligible drives"
              description="Every drive in this datacenter is seated, in RMA, already has an in-progress warranty claim, its lifecycle cannot transition to RMA, or its warranty has expired. Unmount or resolve the drive's existing claim/lifecycle first."
            />
          ) : null}

          {selectedDrive ? (
            <Card size="small">
              <Space direction="vertical" size={4}>
                <Text strong>
                  {[selectedDrive.label, selectedDrive.serialNumber]
                    .filter(Boolean)
                    .join(" — ")}
                </Text>
                <Space size={8} wrap>
                  <Tag color="default">
                    {selectedDrive.currentLifecycle?.state ?? "UNKNOWN"}
                  </Tag>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Lifecycle on create: {planned.join(" → ")}
                  </Text>
                </Space>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Warranty expires {selectedDrive.warrantyExpiryDate ?? "-"}
                </Text>
                {planned.includes("DEPROVISION") ? (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    The drive is currently IN_SERVICE and will be deprovisioned
                    before entering RMA.
                  </Text>
                ) : null}
              </Space>
            </Card>
          ) : null}

          {hiddenDriveCount > 0 ? (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {hiddenDriveCount} drive
              {hiddenDriveCount === 1 ? " is" : "s are"} hidden because
              {hiddenDriveCount === 1 ? " it is" : " they are"} seated, have an
              in-progress claim, their lifecycle cannot enter RMA, or their
              warranty has expired.
            </Text>
          ) : null}
        </Space>
      ),
    },
    {
      key: "claim",
      title: "Claim details",
      description: "Vendor & RMA information",
      icon: <ShopOutlined />,
      fields: [["handledByVendorId"], ["rmaTrackingNumber"], ["notes"]],
      content: () => (
        <Space direction="vertical" size="middle" style={{ display: "flex" }}>
          <Alert
            type="info"
            showIcon
            message="Warranty claim details"
            description="The claim starts as SUBMITTED. Tracking events are recorded from the claim's show page."
          />
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Handled By Vendor"
                name="handledByVendorId"
                rules={[{ required: true, message: "Select the vendor" }]}
              >
                <Select
                  showSearch
                  optionFilterProp="label"
                  placeholder="Select vendor"
                  loading={vendorsLoading}
                  options={[...vendorOptions]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="RMA Tracking Number"
                name="rmaTrackingNumber"
                rules={[
                  {
                    max: 64,
                    message: "RMA tracking number cannot exceed 64 characters",
                  },
                ]}
              >
                <Input maxLength={64} placeholder="e.g. RMA-990PRO-12345" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="Notes" name="notes">
                <Input.TextArea
                  rows={4}
                  placeholder="Troubleshooting details, vendor correspondence, ..."
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
      description: "Confirm & create",
      icon: <FileProtectOutlined />,
      fields: [],
      content: () => (
        <Space direction="vertical" size="middle" style={{ display: "flex" }}>
          <Alert
            type="info"
            showIcon
            message="Review & confirm"
            description="Creating the claim, moving the drive to RMA and writing the initial tracking note happen in a single transaction."
          />
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="Datacenter">
              {selectedDatacenter
                ? `${selectedDatacenter.code} — ${selectedDatacenter.name}`
                : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Drive">
              {selectedDrive
                ? [selectedDrive.label, selectedDrive.serialNumber]
                    .filter(Boolean)
                    .join(" — ")
                : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Current lifecycle state">
              <Tag>{selectedDrive?.currentLifecycle?.state ?? "-"}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Lifecycle events">
              {planned.map((event) => (
                <Tag color="geekblue" key={event}>
                  {event}
                </Tag>
              ))}
            </Descriptions.Item>
            <Descriptions.Item label="Warranty expiry">
              {selectedDrive?.warrantyExpiryDate ?? "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Handled by">
              {vendorName ?? "-"}
            </Descriptions.Item>
            <Descriptions.Item label="RMA tracking #">
              {rmaTrackingNumber || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Notes" span={2}>
              {notes || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Claim tracking" span={2}>
              <Tag color="blue">SUBMITTED</Tag>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Initial NOTE “Warranty claim opened” is appended.
              </Text>
            </Descriptions.Item>
          </Descriptions>
          <Text type="secondary">
            This action is atomic: if any record fails, nothing is created.
          </Text>
        </Space>
      ),
    },
  ];

  const handleFinish = async (raw: WorkflowValues) => {
    const values = raw as ClaimFormValues;
    if (
      !values.datacenterId ||
      !values.physicalDriveId ||
      !values.handledByVendorId
    ) {
      return;
    }

    const response = await initiateClaim({
      url: `${apiUrl}/warranty-claims/initiate`,
      method: "post",
      values: {
        datacenterId: values.datacenterId,
        physicalDriveId: values.physicalDriveId,
        handledByVendorId: values.handledByVendorId,
        rmaTrackingNumber: values.rmaTrackingNumber?.trim() || undefined,
        notes: values.notes?.trim() || undefined,
      },
    });

    const claim = response.data as
      { id?: string; displayKey?: number } | undefined;

    open?.({
      type: "success",
      message: "Warranty claim opened",
      description: claim?.id
        ? `Warranty claim ${claim.displayKey ?? claim.id} was created.`
        : "The warranty claim was created.",
      key: "create-warranty-claim",
    });

    router.push(
      claim?.id ? `/warranty-claims/show/${claim.id}` : "/warranty-claims",
    );
  };

  return (
    <WorkflowWizard
      title="Create Warranty Claim"
      subtitle="Open an RMA claim for an unseated drive and move it into the RMA lifecycle state."
      icon={<FileProtectOutlined />}
      form={form}
      steps={steps}
      submitLabel="Create claim"
      submittingLabel="Creating..."
      onCancel={() => router.push("/dashboard")}
      onFinish={handleFinish}
    />
  );
};
