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
  App,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Form,
  Input,
  Row,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
} from "antd";
import {
  ArrowRightOutlined,
  EnvironmentOutlined,
  FileProtectOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useLookupOptions } from "@hooks/use-lookup-options";
import {
  WorkflowWizard,
  type WorkflowStep,
  type WorkflowValues,
} from "@components/workflow";
import { WarrantyClaimStatusTag } from "@app/warranty-claims/_components/warranty-claim-status-tag";
import { WARRANTY_CLAIM_EVENT_LABELS } from "@app/warranty-claims/_components/warranty-claim-tracking-timeline";

const { Text } = Typography;

type DatacenterRecord = {
  id: string;
  code: string;
  name: string;
};

type WarrantyClaimRecord = {
  id: string;
  displayKey?: number;
  physicalDriveId: string;
  rmaTrackingNumber?: string | null;
  currentStatus?: string;
  handledByVendor?: { name?: string };
  physicalDrive?: { serialNumber?: string };
};

type PhysicalDriveRecord = {
  id: string;
  label?: string;
  serialNumber?: string;
};

type WarrantyClaimTrackingResponse = {
  warrantyClaimId: string;
  currentStatus: string;
  allowedEvents: string[];
  currentEvent?: {
    eventType?: string;
    eventTimestamp?: string;
  } | null;
};

type ProgressFormValues = {
  datacenterId?: string;
  claimId?: string;
  eventType?: string;
  eventTimestamp?: string;
  notes?: string;
  replacementPhysicalDriveId?: string;
};

const STATUS_BY_EVENT: Record<string, string> = {
  SHIPPED_TO_VENDOR: "SHIPPED_TO_VENDOR",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  REPLACEMENT_RECEIVED: "REPLACEMENT_RECEIVED",
  CLOSED: "CLOSED",
};

const eventDateProps = {
  getValueProps: (value?: string | null) => ({
    value: value ? dayjs(value) : undefined,
  }),
  normalize: (value: unknown) =>
    value ? dayjs(value as string).toISOString() : undefined,
};

export const ProgressWarrantyClaimWorkflow = () => {
  const [form] = Form.useForm<ProgressFormValues>();
  const apiUrl = useApiUrl();
  const router = useRouter();
  const { message } = App.useApp();
  const { open } = useNotification();
  const { mutateAsync: progressClaim } = useCustomMutation();

  const datacenterId = Form.useWatch("datacenterId", form);
  const claimId = Form.useWatch("claimId", form);
  const eventType = Form.useWatch("eventType", form);
  const eventTimestamp = Form.useWatch("eventTimestamp", form);
  const notes = Form.useWatch("notes", form);
  const replacementDriveId = Form.useWatch("replacementPhysicalDriveId", form);

  const { query: datacentersQuery } = useList<DatacenterRecord>({
    resource: "datacenters",
    pagination: { mode: "server", currentPage: 1, pageSize: 100 },
  });
  const datacenters = useMemo(
    () => datacentersQuery.data?.data ?? [],
    [datacentersQuery.data?.data],
  );

  const { query: claimsQuery } = useList<WarrantyClaimRecord>({
    resource: "warranty-claims",
    pagination: { mode: "server", currentPage: 1, pageSize: 250 },
  });
  const claims = useMemo(
    () => claimsQuery.data?.data ?? [],
    [claimsQuery.data?.data],
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
  const driveById = useMemo(
    () => new Map(drives.map((drive) => [drive.id, drive])),
    [drives],
  );

  const {
    options: replacementDriveOptions,
    isLoading: replacementDrivesLoading,
  } = useLookupOptions({
    resource: "physical-drives",
    optionLabel: "serialNumber",
  });

  const datacenterOptions = useMemo(
    () =>
      datacenters.map((datacenter) => ({
        label: `${datacenter.code} — ${datacenter.name}`,
        value: datacenter.id,
      })),
    [datacenters],
  );

  const openClaims = useMemo(() => {
    const driveIds = new Set(drives.map((drive) => drive.id));
    return claims.filter(
      (claim) =>
        claim.currentStatus !== "CLOSED" && driveIds.has(claim.physicalDriveId),
    );
  }, [claims, drives]);

  const claimOptions = useMemo(
    () =>
      openClaims.map((claim) => {
        const drive = driveById.get(claim.physicalDriveId);
        const serial =
          drive?.serialNumber ?? claim.physicalDrive?.serialNumber ?? claim.id;
        return {
          label: [serial, claim.rmaTrackingNumber, claim.currentStatus]
            .filter(Boolean)
            .join(" · "),
          value: claim.id,
        };
      }),
    [openClaims, driveById],
  );

  const selectedClaim = useMemo(
    () => openClaims.find((claim) => claim.id === claimId),
    [openClaims, claimId],
  );
  const selectedDrive = selectedClaim
    ? driveById.get(selectedClaim.physicalDriveId)
    : undefined;

  const { query: trackingQuery, result: trackingResult } = useCustom({
    url: `${apiUrl}/warranty-claims/${claimId}/tracking`,
    method: "get",
    queryOptions: { enabled: Boolean(claimId) },
  });
  const tracking = trackingResult?.data as
    WarrantyClaimTrackingResponse | undefined;

  const currentStatus = tracking?.currentStatus ?? selectedClaim?.currentStatus;
  const allowedEvents = tracking?.allowedEvents ?? [];
  const replaceDrive = eventType === "REPLACEMENT_RECEIVED";
  const nextStatus =
    eventType && eventType !== "NOTE"
      ? (STATUS_BY_EVENT[eventType] ?? currentStatus)
      : currentStatus;

  const replacementOptions = useMemo(
    () =>
      replacementDriveOptions.filter(
        (option) => option.value !== selectedClaim?.physicalDriveId,
      ),
    [replacementDriveOptions, selectedClaim?.physicalDriveId],
  );
  const replacementLabel = replacementOptions.find(
    (option) => option.value === replacementDriveId,
  )?.label;

  const handleDatacenterChange = () => {
    form.resetFields([
      "claimId",
      "eventType",
      "eventTimestamp",
      "notes",
      "replacementPhysicalDriveId",
    ]);
  };

  const handleClaimChange = () => {
    form.resetFields([
      "eventType",
      "eventTimestamp",
      "notes",
      "replacementPhysicalDriveId",
    ]);
  };

  const steps: WorkflowStep[] = [
    {
      key: "datacenter",
      title: "Datacenter",
      description: "Where the claimed drive is",
      icon: <EnvironmentOutlined />,
      fields: [["datacenterId"]],
      content: () => (
        <Space direction="vertical" size="middle" style={{ display: "flex" }}>
          <Alert
            type="info"
            showIcon
            message="Select the datacenter"
            description="Only in-progress claims for drives currently located in this datacenter are shown."
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
      key: "claim",
      title: "Claim",
      description: "Pick an in-progress claim",
      icon: <FileProtectOutlined />,
      fields: [["claimId"]],
      validate: () => {
        if (claimsQuery.isLoading || drivesQuery.isLoading) {
          message.warning("Loading in-progress claims...");
          return false;
        }
        if (claimId && trackingQuery.isLoading) {
          message.warning("Loading the claim's available transitions...");
          return false;
        }
        if (
          claimId &&
          Array.isArray(tracking?.allowedEvents) &&
          tracking.allowedEvents.length === 0
        ) {
          message.warning("This claim has no available transitions.");
          return false;
        }
        return true;
      },
      content: () => (
        <Space direction="vertical" size="middle" style={{ display: "flex" }}>
          <Alert
            type="info"
            showIcon
            message="Select a claim"
            description="Only claims that are not CLOSED and whose drive is currently in the selected datacenter are shown."
          />
          <Row gutter={16}>
            <Col xs={24} md={16}>
              <Form.Item
                label="Warranty claim"
                name="claimId"
                rules={[{ required: true, message: "Select a claim" }]}
              >
                <Select
                  showSearch
                  optionFilterProp="label"
                  placeholder={
                    datacenterId
                      ? openClaims.length > 0
                        ? "Select claim"
                        : "No in-progress claims in this datacenter"
                      : "Select a datacenter first"
                  }
                  disabled={!datacenterId}
                  loading={claimsQuery.isLoading || drivesQuery.isLoading}
                  options={claimOptions}
                  onChange={handleClaimChange}
                />
              </Form.Item>
            </Col>
          </Row>

          {datacenterId &&
          !claimsQuery.isLoading &&
          !drivesQuery.isLoading &&
          openClaims.length === 0 ? (
            <Alert
              type="warning"
              showIcon
              message="No in-progress claims"
              description="Every claim for a drive in this datacenter is CLOSED, or the drives have moved to another datacenter."
            />
          ) : null}

          {selectedClaim ? (
            <Card size="small" title="Claim state">
              {trackingQuery.isLoading ? (
                <Spin />
              ) : (
                <Space direction="vertical" size={6}>
                  <Space size={8} wrap>
                    <WarrantyClaimStatusTag status={currentStatus} />
                    {tracking?.currentEvent?.eventType ? (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Latest:{" "}
                        {WARRANTY_CLAIM_EVENT_LABELS[
                          tracking.currentEvent.eventType
                        ] ?? tracking.currentEvent.eventType}
                        {tracking.currentEvent.eventTimestamp
                          ? ` · ${new Date(
                              tracking.currentEvent.eventTimestamp,
                            ).toLocaleString()}`
                          : ""}
                      </Text>
                    ) : null}
                  </Space>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Drive {selectedDrive?.serialNumber ?? "-"} · Vendor{" "}
                    {selectedClaim.handledByVendor?.name ?? "-"}
                    {selectedClaim.rmaTrackingNumber
                      ? ` · ${selectedClaim.rmaTrackingNumber}`
                      : ""}
                  </Text>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Available transitions:
                    </Text>{" "}
                    {allowedEvents.length > 0 ? (
                      allowedEvents.map((event) => (
                        <Tag color="geekblue" key={event}>
                          {WARRANTY_CLAIM_EVENT_LABELS[event] ?? event}
                        </Tag>
                      ))
                    ) : (
                      <Text type="secondary">None</Text>
                    )}
                  </div>
                </Space>
              )}
            </Card>
          ) : null}
        </Space>
      ),
    },
    {
      key: "update",
      title: "Update",
      description: "Record the next tracking event",
      icon: <SyncOutlined />,
      fields: [
        ["eventType"],
        ["eventTimestamp"],
        ["notes"],
        ["replacementPhysicalDriveId"],
      ],
      content: () => (
        <Space direction="vertical" size="middle" style={{ display: "flex" }}>
          <Alert
            type="info"
            showIcon
            message="Tracking update"
            description="Only transitions allowed from the claim's current status are offered."
          />
          <Space size={8} wrap>
            <WarrantyClaimStatusTag status={currentStatus} />
            <ArrowRightOutlined />
            <WarrantyClaimStatusTag status={nextStatus} />
          </Space>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Next event"
                name="eventType"
                rules={[{ required: true, message: "Select the next event" }]}
              >
                <Select
                  placeholder="Select event"
                  options={allowedEvents.map((event) => ({
                    value: event,
                    label: WARRANTY_CLAIM_EVENT_LABELS[event] ?? event,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Event timestamp"
                name="eventTimestamp"
                {...eventDateProps}
              >
                <DatePicker
                  showTime
                  style={{ width: "100%" }}
                  placeholder="Defaults to now when omitted"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Replacement drive"
                name="replacementPhysicalDriveId"
                hidden={!replaceDrive}
                rules={[
                  {
                    required: replaceDrive,
                    message: "Select the replacement drive received",
                  },
                ]}
              >
                <Select
                  showSearch
                  optionFilterProp="label"
                  placeholder="Select the received drive"
                  loading={replacementDrivesLoading}
                  options={[...replacementOptions]}
                />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="Notes" name="notes">
                <Input.TextArea
                  rows={4}
                  placeholder="Vendor reference, rejection reason, tracking details, ..."
                />
              </Form.Item>
            </Col>
          </Row>
          <Text type="secondary" style={{ fontSize: 12 }}>
            The claim status is derived from the latest state-changing event.
          </Text>
        </Space>
      ),
    },
    {
      key: "review",
      title: "Review",
      description: "Confirm the status update",
      icon: <FileProtectOutlined />,
      fields: [],
      content: () => (
        <Space direction="vertical" size="middle" style={{ display: "flex" }}>
          <Alert
            type="info"
            showIcon
            message="Review & confirm"
            description="The tracking event is appended in a single transaction and the claim status is derived from it."
          />
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="Datacenter">
              {datacenterOptions.find((option) => option.value === datacenterId)
                ?.label ?? "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Claim">
              {selectedClaim
                ? `#${selectedClaim.displayKey ?? selectedClaim.id}${
                    selectedClaim.rmaTrackingNumber
                      ? ` · ${selectedClaim.rmaTrackingNumber}`
                      : ""
                  }`
                : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Drive">
              {selectedDrive?.serialNumber ??
                selectedClaim?.physicalDrive?.serialNumber ??
                "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Vendor">
              {selectedClaim?.handledByVendor?.name ?? "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Current status">
              <WarrantyClaimStatusTag status={currentStatus} />
            </Descriptions.Item>
            <Descriptions.Item label="Resulting status">
              <WarrantyClaimStatusTag status={nextStatus} />
            </Descriptions.Item>
            <Descriptions.Item label="Event">
              {eventType
                ? (WARRANTY_CLAIM_EVENT_LABELS[eventType] ?? eventType)
                : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Event timestamp">
              {eventTimestamp
                ? new Date(eventTimestamp).toLocaleString()
                : "Now"}
            </Descriptions.Item>
            {replaceDrive ? (
              <Descriptions.Item label="Replacement drive" span={2}>
                {(replacementLabel as string | undefined) ?? "-"}
              </Descriptions.Item>
            ) : null}
            <Descriptions.Item label="Notes" span={2}>
              {notes || "-"}
            </Descriptions.Item>
          </Descriptions>
          <Text type="secondary">
            This action is atomic: if the transition is invalid, nothing is
            written.
          </Text>
        </Space>
      ),
    },
  ];

  const handleFinish = async (raw: WorkflowValues) => {
    const values = raw as ProgressFormValues;
    if (!values.claimId || !values.eventType) {
      return;
    }

    const response = await progressClaim({
      url: `${apiUrl}/warranty-claims/${values.claimId}/tracking`,
      method: "post",
      values: {
        eventType: values.eventType,
        eventTimestamp: values.eventTimestamp || undefined,
        notes: values.notes?.trim() || undefined,
        replacementPhysicalDriveId:
          values.eventType === "REPLACEMENT_RECEIVED"
            ? values.replacementPhysicalDriveId
            : undefined,
      },
    });

    const timeline = response.data as { currentStatus?: string } | undefined;

    open?.({
      type: "success",
      message: "Warranty claim updated",
      description: timeline?.currentStatus
        ? `The claim is now ${timeline.currentStatus}.`
        : "The tracking event was recorded.",
      key: "progress-warranty-claim",
    });

    router.push(`/warranty-claims/show/${values.claimId}`);
  };

  return (
    <WorkflowWizard
      title="Progress Warranty Claim"
      subtitle="Record the next tracking event for an in-progress RMA claim."
      icon={<SyncOutlined />}
      form={form}
      steps={steps}
      submitLabel="Apply update"
      submittingLabel="Updating..."
      onCancel={() => router.push("/dashboard")}
      onFinish={handleFinish}
    />
  );
};
