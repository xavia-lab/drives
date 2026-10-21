"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useApiUrl,
  useCustom,
  useList,
  useNotification,
} from "@refinedev/core";
import {
  Alert,
  App,
  Button,
  Card,
  Checkbox,
  Col,
  Descriptions,
  Divider,
  Empty,
  Form,
  Input,
  Row,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
  Upload,
  theme,
} from "antd";
import type { UploadProps } from "antd";
import {
  DeleteOutlined,
  EnvironmentOutlined,
  FileSearchOutlined,
  HddOutlined,
  InboxOutlined,
  PaperClipOutlined,
  ReloadOutlined,
  StarFilled,
} from "@ant-design/icons";
import {
  WorkflowWizard,
  type WorkflowStep,
  type WorkflowValues,
} from "@components/workflow";
import { MediaDisplay } from "@components/media-display";
import { BinaryService } from "@providers/binary-data-provider";

const { Text } = Typography;

const MAX_NEW_FILES = 20;
const MAX_FILE_SIZE = 25 * 1024 * 1024;

type DatacenterRecord = {
  id: string;
  code: string;
  name: string;
};

type DriveRecord = {
  id: string;
  serialNumber: string;
  label?: string | null;
  currentLocation?: { code?: string; name?: string } | null;
};

type MediaAttachmentType =
  "PICTURE" | "INVOICE" | "DOCUMENT" | "CERTIFICATE" | "OTHER";

type MediaRecord = {
  id: string;
  fileId: string;
  fileName: string | null;
  mimeType: string | null;
  fileSize: number | null;
  mediaType: string;
} | null;

type ExistingAttachment = {
  id: string;
  attachmentType: MediaAttachmentType;
  isPrimary: boolean;
  sortOrder: number;
  notes: string | null;
  media?: MediaRecord;
};

type ExistingDraft = ExistingAttachment & {
  notes: string;
  original: {
    attachmentType: MediaAttachmentType;
    isPrimary: boolean;
    notes: string;
    sortOrder: number;
  };
  removed: boolean;
};

type NewDraft = {
  uid: string;
  file: File;
  attachmentType: MediaAttachmentType;
  notes: string;
  isPrimary: boolean;
};

type MediaFormValues = {
  datacenterId?: string;
  driveId?: string;
};

const ATTACHMENT_TYPE_OPTIONS: Array<{
  label: string;
  value: MediaAttachmentType;
}> = [
  { label: "Picture", value: "PICTURE" },
  { label: "Invoice", value: "INVOICE" },
  { label: "Document", value: "DOCUMENT" },
  { label: "Certificate", value: "CERTIFICATE" },
  { label: "Other", value: "OTHER" },
];

const ATTACHMENT_COLORS: Record<string, string> = {
  PICTURE: "blue",
  INVOICE: "gold",
  DOCUMENT: "geekblue",
  CERTIFICATE: "purple",
  OTHER: "default",
};

const inferAttachmentType = (mimeType: string): MediaAttachmentType =>
  mimeType.startsWith("image/") ? "PICTURE" : "DOCUMENT";

const formatFileSize = (bytes?: number | null): string => {
  if (!bytes) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const isExistingDirty = (draft: ExistingDraft): boolean =>
  !draft.removed &&
  (draft.notes !== draft.original.notes ||
    draft.attachmentType !== draft.original.attachmentType ||
    draft.isPrimary !== draft.original.isPrimary ||
    draft.sortOrder !== draft.original.sortOrder);

export const DriveMediaManagementWorkflow = () => {
  const [form] = Form.useForm<MediaFormValues>();
  const router = useRouter();
  const apiUrl = useApiUrl();
  const { token } = theme.useToken();
  const { message } = App.useApp();
  const { open } = useNotification();

  const [existingDrafts, setExistingDrafts] = useState<ExistingDraft[]>([]);
  const [newDrafts, setNewDrafts] = useState<NewDraft[]>([]);
  const lastLoadedDrive = useRef<string | null>(null);

  const datacenterId = Form.useWatch("datacenterId", form);
  const driveId = Form.useWatch("driveId", form);

  const { query: datacentersQuery } = useList<DatacenterRecord>({
    resource: "datacenters",
    pagination: { mode: "server", currentPage: 1, pageSize: 250 },
  });
  const datacenters = useMemo(
    () => datacentersQuery.data?.data ?? [],
    [datacentersQuery.data?.data],
  );
  const datacenterOptions = useMemo(
    () =>
      datacenters.map((datacenter) => ({
        label: `${datacenter.code} — ${datacenter.name}`,
        value: datacenter.id,
      })),
    [datacenters],
  );

  const { query: drivesQuery } = useList<DriveRecord>({
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
  const driveOptions = useMemo(
    () =>
      drives.map((drive) => ({
        label: [drive.serialNumber, drive.label].filter(Boolean).join(" — "),
        value: drive.id,
      })),
    [drives],
  );
  const selectedDrive = drives.find((drive) => drive.id === driveId);

  const { query: mediaQuery, result: mediaResult } = useCustom({
    url: `${apiUrl}/physical-drives/${driveId}/media`,
    method: "get",
    queryOptions: {
      enabled: Boolean(driveId),
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  });

  // Refine returns a frozen EMPTY_OBJECT while loading; only treat a real
  // array as the current attachment set.
  const attachments = useMemo<ExistingAttachment[]>(
    () =>
      Array.isArray(mediaResult?.data)
        ? (mediaResult.data as ExistingAttachment[])
        : [],
    [mediaResult?.data],
  );

  useEffect(() => {
    if (!driveId) {
      lastLoadedDrive.current = null;
      setExistingDrafts([]);
      setNewDrafts([]);
      return;
    }

    if (mediaQuery.isLoading || mediaQuery.isError) return;
    if (!Array.isArray(mediaResult?.data)) return;
    if (lastLoadedDrive.current === driveId) return;

    lastLoadedDrive.current = driveId;
    setExistingDrafts(
      attachments.map((attachment) => ({
        ...attachment,
        notes: attachment.notes ?? "",
        original: {
          attachmentType: attachment.attachmentType,
          isPrimary: attachment.isPrimary,
          notes: attachment.notes ?? "",
          sortOrder: attachment.sortOrder,
        },
        removed: false,
      })),
    );
    setNewDrafts([]);
  }, [
    driveId,
    attachments,
    mediaResult?.data,
    mediaQuery.isLoading,
    mediaQuery.isError,
  ]);

  const resetMediaState = () => {
    lastLoadedDrive.current = null;
    setExistingDrafts([]);
    setNewDrafts([]);
  };

  const handleDatacenterChange = () => {
    form.resetFields(["driveId"]);
    resetMediaState();
  };

  const handleDriveChange = () => {
    resetMediaState();
  };

  const updateExisting = (id: string, patch: Partial<ExistingDraft>) => {
    setExistingDrafts((current) =>
      current.map((draft) =>
        draft.id === id ? { ...draft, ...patch } : draft,
      ),
    );
  };

  const toggleRemoved = (id: string) => {
    setExistingDrafts((current) =>
      current.map((draft) =>
        draft.id === id
          ? {
              ...draft,
              removed: !draft.removed,
              isPrimary: draft.removed ? draft.isPrimary : false,
            }
          : draft,
      ),
    );
  };

  const makePrimary = (kind: "existing" | "new", id: string) => {
    setExistingDrafts((current) =>
      current.map((draft) => ({
        ...draft,
        isPrimary: kind === "existing" && draft.id === id,
        removed: kind === "existing" && draft.id === id ? false : draft.removed,
      })),
    );
    setNewDrafts((current) =>
      current.map((draft) => ({
        ...draft,
        isPrimary: kind === "new" && draft.uid === id,
      })),
    );
  };

  const addNewFiles = (files: File[]) => {
    setNewDrafts((current) => {
      const next = [...current];

      for (const file of files) {
        if (next.length >= MAX_NEW_FILES) {
          message.warning(`You can add up to ${MAX_NEW_FILES} files at once`);
          break;
        }
        if (file.size > MAX_FILE_SIZE) {
          message.warning(`${file.name} is larger than 25 MB`);
          continue;
        }
        if (
          next.some(
            (draft) =>
              draft.file.name === file.name &&
              draft.file.size === file.size &&
              draft.file.lastModified === file.lastModified,
          )
        ) {
          continue;
        }

        next.push({
          uid: `${file.name}-${file.size}-${file.lastModified}-${Math.random()
            .toString(16)
            .slice(2)}`,
          file,
          attachmentType: inferAttachmentType(file.type),
          notes: "",
          isPrimary: false,
        });
      }

      return next;
    });
  };

  const updateNew = (uid: string, patch: Partial<NewDraft>) => {
    setNewDrafts((current) =>
      current.map((draft) =>
        draft.uid === uid ? { ...draft, ...patch } : draft,
      ),
    );
  };

  const removeNew = (uid: string) => {
    setNewDrafts((current) => current.filter((draft) => draft.uid !== uid));
  };

  const beforeUpload: UploadProps["beforeUpload"] = (file) => {
    addNewFiles([file]);
    return false;
  };

  const changedExisting = existingDrafts.filter(isExistingDirty);
  const removedExisting = existingDrafts.filter((draft) => draft.removed);
  const hasChanges =
    removedExisting.length > 0 ||
    changedExisting.length > 0 ||
    newDrafts.length > 0;

  const renderExistingCard = (draft: ExistingDraft) => (
    <Card
      key={draft.id}
      size="small"
      style={{
        height: "100%",
        opacity: draft.removed ? 0.55 : 1,
        borderColor: draft.isPrimary
          ? token.colorWarningBorder
          : token.colorBorderSecondary,
      }}
      cover={
        draft.media?.fileId ? (
          <div
            style={{
              height: 150,
              overflow: "hidden",
              background: token.colorFillQuaternary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MediaDisplay
              fileId={draft.media.fileId}
              width="100%"
              height={150}
            />
          </div>
        ) : (
          <div
            style={{
              height: 150,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: token.colorFillQuaternary,
            }}
          >
            <Text type="secondary">Media unavailable</Text>
          </div>
        )
      }
      title={
        <Space size={6} wrap>
          <Text strong ellipsis>
            {draft.media?.fileName ?? draft.media?.fileId ?? "Unknown file"}
          </Text>
          {draft.isPrimary ? (
            <Tag color="gold" icon={<StarFilled />}>
              Primary
            </Tag>
          ) : null}
          {draft.removed ? <Tag color="red">Will remove</Tag> : null}
        </Space>
      }
      extra={
        <Button
          danger={!draft.removed}
          size="small"
          type="text"
          icon={draft.removed ? <ReloadOutlined /> : <DeleteOutlined />}
          onClick={() => toggleRemoved(draft.id)}
        >
          {draft.removed ? "Restore" : "Remove"}
        </Button>
      }
    >
      <Space direction="vertical" size={8} style={{ display: "flex" }}>
        <Space size={6} wrap>
          <Tag color={ATTACHMENT_COLORS[draft.attachmentType] ?? "default"}>
            {draft.attachmentType}
          </Tag>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {draft.media?.mimeType ?? "Unknown type"} ·{" "}
            {formatFileSize(draft.media?.fileSize)}
          </Text>
        </Space>
        <Form.Item label="Attachment type" style={{ marginBottom: 0 }}>
          <Select
            value={draft.attachmentType}
            options={ATTACHMENT_TYPE_OPTIONS}
            disabled={draft.removed}
            onChange={(attachmentType) =>
              updateExisting(draft.id, { attachmentType })
            }
          />
        </Form.Item>
        <Form.Item label="Notes" style={{ marginBottom: 0 }}>
          <Input.TextArea
            rows={2}
            value={draft.notes}
            disabled={draft.removed}
            placeholder="Optional notes for this file"
            onChange={(event) =>
              updateExisting(draft.id, { notes: event.target.value })
            }
          />
        </Form.Item>
        <Checkbox
          checked={draft.isPrimary}
          disabled={draft.removed}
          onChange={(event) => {
            if (event.target.checked) {
              makePrimary("existing", draft.id);
            } else {
              updateExisting(draft.id, { isPrimary: false });
            }
          }}
        >
          Primary attachment
        </Checkbox>
      </Space>
    </Card>
  );

  const renderNewCard = (draft: NewDraft) => (
    <Card
      key={draft.uid}
      size="small"
      style={{ height: "100%" }}
      title={
        <Space size={6} wrap>
          <Text strong ellipsis>
            {draft.file.name}
          </Text>
          {draft.isPrimary ? (
            <Tag color="gold" icon={<StarFilled />}>
              Primary
            </Tag>
          ) : null}
        </Space>
      }
      extra={
        <Button
          danger
          size="small"
          type="text"
          icon={<DeleteOutlined />}
          onClick={() => removeNew(draft.uid)}
        >
          Remove
        </Button>
      }
    >
      <Space direction="vertical" size={8} style={{ display: "flex" }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {formatFileSize(draft.file.size)} · New file
        </Text>
        <Form.Item label="Attachment type" style={{ marginBottom: 0 }}>
          <Select
            value={draft.attachmentType}
            options={ATTACHMENT_TYPE_OPTIONS}
            onChange={(attachmentType) =>
              updateNew(draft.uid, { attachmentType })
            }
          />
        </Form.Item>
        <Form.Item label="Notes" style={{ marginBottom: 0 }}>
          <Input.TextArea
            rows={2}
            value={draft.notes}
            placeholder="Optional notes for this file"
            onChange={(event) =>
              updateNew(draft.uid, { notes: event.target.value })
            }
          />
        </Form.Item>
        <Checkbox
          checked={draft.isPrimary}
          onChange={(event) => {
            if (event.target.checked) {
              makePrimary("new", draft.uid);
            } else {
              updateNew(draft.uid, { isPrimary: false });
            }
          }}
        >
          Primary attachment
        </Checkbox>
      </Space>
    </Card>
  );

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
            message="Select a datacenter"
            description="Only drives currently located in this datacenter are listed in the next step."
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
      description: "Find the drive to manage",
      icon: <HddOutlined />,
      fields: [["driveId"]],
      validate: () => {
        if (drivesQuery.isLoading) {
          message.warning("Loading drives...");
          return false;
        }
        return true;
      },
      content: () => (
        <Space direction="vertical" size="middle" style={{ display: "flex" }}>
          <Alert
            type="info"
            showIcon
            message="Search for a drive"
            description="Search by serial number or label. Only drives located in the selected datacenter are available."
          />
          <Row gutter={16}>
            <Col xs={24} md={16}>
              <Form.Item
                label="Physical drive"
                name="driveId"
                rules={[{ required: true, message: "Select a drive" }]}
              >
                <Select
                  showSearch
                  optionFilterProp="label"
                  placeholder={
                    datacenterId
                      ? drives.length > 0
                        ? "Search by serial number or label"
                        : "No drives in this datacenter"
                      : "Select a datacenter first"
                  }
                  disabled={!datacenterId}
                  loading={drivesQuery.isLoading}
                  options={driveOptions}
                  onChange={handleDriveChange}
                />
              </Form.Item>
            </Col>
          </Row>
          {selectedDrive ? (
            <Card size="small">
              <Descriptions size="small" column={2}>
                <Descriptions.Item label="Serial number" span={2}>
                  {selectedDrive.serialNumber}
                </Descriptions.Item>
                <Descriptions.Item label="Label">
                  {selectedDrive.label ?? "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Location">
                  {selectedDrive.currentLocation?.code ?? "-"}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          ) : null}
          {datacenterId && !drivesQuery.isLoading && drives.length === 0 ? (
            <Alert
              type="warning"
              showIcon
              message="No drives in this datacenter"
              description="Move a drive to this datacenter first, or choose another datacenter."
            />
          ) : null}
        </Space>
      ),
    },
    {
      key: "media",
      title: "Media",
      description: "Add or remove files",
      icon: <PaperClipOutlined />,
      fields: [],
      content: () => (
        <Space direction="vertical" size="middle" style={{ display: "flex" }}>
          {!driveId ? (
            <Alert
              type="warning"
              showIcon
              message="Select a drive first"
              description="Choose a drive in the previous step to load its media."
            />
          ) : mediaQuery.isError ? (
            <Alert
              type="error"
              showIcon
              message="Could not load current media"
              description="Check the API and try again."
              action={
                <Button
                  size="small"
                  icon={<ReloadOutlined />}
                  onClick={() => mediaQuery.refetch()}
                >
                  Retry
                </Button>
              }
            />
          ) : mediaQuery.isLoading ? (
            <Spin />
          ) : (
            <>
              <Alert
                type="info"
                showIcon
                message="Manage attached files"
                description="Remove existing files, edit their notes or primary flag, or add new files. Nothing is applied until you finish the workflow."
              />

              <Upload.Dragger
                multiple
                showUploadList={false}
                beforeUpload={beforeUpload}
                disabled={newDrafts.length >= MAX_NEW_FILES}
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
              >
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">
                  Drop new files here or click to browse
                </p>
                <p className="ant-upload-hint">
                  Up to {MAX_NEW_FILES} new files, 25 MB each.
                </p>
              </Upload.Dragger>

              {existingDrafts.length === 0 && newDrafts.length === 0 ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="This drive has no attached media yet"
                />
              ) : (
                <Space
                  direction="vertical"
                  size="middle"
                  style={{ display: "flex" }}
                >
                  {existingDrafts.length > 0 ? (
                    <div>
                      <Text strong>Current files</Text>
                      <Row gutter={[12, 12]} style={{ marginTop: 8 }}>
                        {existingDrafts.map((draft) => (
                          <Col xs={24} md={12} xl={8} key={draft.id}>
                            {renderExistingCard(draft)}
                          </Col>
                        ))}
                      </Row>
                    </div>
                  ) : null}

                  {newDrafts.length > 0 ? (
                    <div>
                      <Text strong>New files</Text>
                      <Row gutter={[12, 12]} style={{ marginTop: 8 }}>
                        {newDrafts.map((draft) => (
                          <Col xs={24} md={12} xl={8} key={draft.uid}>
                            {renderNewCard(draft)}
                          </Col>
                        ))}
                      </Row>
                    </div>
                  ) : null}
                </Space>
              )}
            </>
          )}
        </Space>
      ),
    },
    {
      key: "review",
      title: "Review",
      description: "Confirm media changes",
      icon: <FileSearchOutlined />,
      fields: [],
      content: () => (
        <Space direction="vertical" size="middle" style={{ display: "flex" }}>
          <Alert
            type="info"
            showIcon
            message="Review & confirm"
            description="Finishing this workflow applies all media changes to the drive."
          />
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="Drive" span={2}>
              {selectedDrive
                ? `${selectedDrive.serialNumber}${
                    selectedDrive.label ? ` — ${selectedDrive.label}` : ""
                  }`
                : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Datacenter" span={2}>
              {datacenterOptions.find((option) => option.value === datacenterId)
                ?.label ?? "-"}
            </Descriptions.Item>
          </Descriptions>

          {!hasChanges ? (
            <Alert
              type="warning"
              showIcon
              message="No media changes"
              description="Finishing will leave the drive's media unchanged."
            />
          ) : (
            <Space direction="vertical" size={8} style={{ display: "flex" }}>
              {removedExisting.length > 0 ? (
                <div>
                  <Text strong>Files to remove</Text>
                  <Space
                    direction="vertical"
                    size={4}
                    style={{ display: "flex", marginTop: 4 }}
                  >
                    {removedExisting.map((draft) => (
                      <Text key={draft.id}>
                        {draft.media?.fileName ?? draft.id}
                      </Text>
                    ))}
                  </Space>
                </div>
              ) : null}

              {changedExisting.length > 0 ? (
                <div>
                  <Text strong>Files to update</Text>
                  <Space
                    direction="vertical"
                    size={4}
                    style={{ display: "flex", marginTop: 4 }}
                  >
                    {changedExisting.map((draft) => (
                      <Space key={draft.id} size={6} wrap>
                        <Text>{draft.media?.fileName ?? draft.id}</Text>
                        {draft.notes !== draft.original.notes ? (
                          <Tag color="blue">Notes changed</Tag>
                        ) : null}
                        {draft.attachmentType !==
                        draft.original.attachmentType ? (
                          <Tag color="geekblue">Type changed</Tag>
                        ) : null}
                        {draft.isPrimary !== draft.original.isPrimary ? (
                          <Tag color="gold">
                            {draft.isPrimary
                              ? "Set as primary"
                              : "Primary removed"}
                          </Tag>
                        ) : null}
                      </Space>
                    ))}
                  </Space>
                </div>
              ) : null}

              {newDrafts.length > 0 ? (
                <div>
                  <Text strong>New files</Text>
                  <Space
                    direction="vertical"
                    size={4}
                    style={{ display: "flex", marginTop: 4 }}
                  >
                    {newDrafts.map((draft) => (
                      <Space key={draft.uid} size={6} wrap>
                        <Tag>{draft.attachmentType}</Tag>
                        <Text>{draft.file.name}</Text>
                        {draft.isPrimary ? (
                          <Tag color="gold">Primary</Tag>
                        ) : null}
                        {draft.notes ? (
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {draft.notes}
                          </Text>
                        ) : null}
                      </Space>
                    ))}
                  </Space>
                </div>
              ) : null}
            </Space>
          )}
          <Divider style={{ margin: 0 }} />
          <Text type="secondary">
            Removals are applied first, then new uploads and attachment updates.
          </Text>
        </Space>
      ),
    },
  ];

  const handleFinish = async (raw: WorkflowValues) => {
    const values = raw as MediaFormValues;
    if (!values.driveId) return;

    if (!hasChanges) {
      open?.({
        type: "success",
        message: "No media changes",
        description: "The drive's media was left unchanged.",
        key: "drive-media-management",
      });
      router.push(`/physical-drives/show/${values.driveId}`);
      return;
    }

    try {
      await BinaryService.put(
        `${apiUrl}/physical-drives/${values.driveId}/media`,
        newDrafts.map((draft) => draft.file),
        {
          add: JSON.stringify(
            newDrafts.map((draft) => ({
              attachmentType: draft.attachmentType,
              notes: draft.notes.trim() || undefined,
              isPrimary: draft.isPrimary,
            })),
          ),
          update: JSON.stringify(
            changedExisting.map((draft) => ({
              attachmentId: draft.id,
              attachmentType: draft.attachmentType,
              notes: draft.notes.trim() || null,
              isPrimary: draft.isPrimary,
              sortOrder: draft.sortOrder,
            })),
          ),
          remove: JSON.stringify(removedExisting.map((draft) => draft.id)),
        },
      );

      open?.({
        type: "success",
        message: "Media updated",
        description: "The drive's media changes were applied.",
        key: "drive-media-management",
      });
      router.push(`/physical-drives/show/${values.driveId}`);
    } catch (error) {
      open?.({
        type: "error",
        message: "Could not apply all media changes",
        description:
          "Some changes may have been applied. Reopen the drive to verify its media.",
        key: "drive-media-management",
      });
      throw error;
    }
  };

  return (
    <WorkflowWizard
      title="Drive Media Management"
      subtitle="Review, add and remove media attached to a physical drive."
      icon={<PaperClipOutlined />}
      form={form}
      steps={steps}
      submitLabel="Apply media changes"
      submittingLabel="Applying..."
      onCancel={() => router.push("/dashboard")}
      onFinish={handleFinish}
    />
  );
};
