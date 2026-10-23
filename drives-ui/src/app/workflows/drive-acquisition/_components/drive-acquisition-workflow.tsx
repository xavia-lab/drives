"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCustomMutation, useList, useNotification } from "@refinedev/core";
import {
  Alert,
  App,
  Button,
  Card,
  Checkbox,
  Col,
  DatePicker,
  Descriptions,
  Divider,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Tag,
  Typography,
  Upload,
} from "antd";
import type { SelectProps, UploadProps } from "antd";
import {
  DeleteOutlined,
  EnvironmentOutlined,
  FileSearchOutlined,
  HddOutlined,
  InboxOutlined,
  PaperClipOutlined,
  PlusOutlined,
  ShoppingCartOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  WorkflowWizard,
  type WorkflowStep,
  type WorkflowValues,
} from "@components/workflow";
import { CurrencyFormatter } from "@utils/currency-formatter";
import { BinaryService } from "@providers/binary-data-provider";
import {
  DriveModelSubWorkflow,
  type CreatedDriveModel,
} from "./drive-model-sub-workflow";

const { Text } = Typography;

type DriveModelSelectProps = SelectProps & {
  canCreate: boolean;
  onCreate: () => void;
};

/**
 * Form.Item clones its direct child, so this wrapper must forward `value` and
 * `onChange` to the Select. Keeping the create button outside the Select still
 * lets Form.Item control the selected model.
 */
const DriveModelSelect = ({
  canCreate,
  onCreate,
  ...selectProps
}: DriveModelSelectProps) => (
  <Space.Compact style={{ width: "100%" }}>
    <Select {...selectProps} style={{ width: "100%" }} />
    <Button icon={<PlusOutlined />} disabled={!canCreate} onClick={onCreate}>
      New model
    </Button>
  </Space.Compact>
);

const PAGE_SIZE = 250;
const formatter = new CurrencyFormatter();

interface VendorRecord {
  id: string;
  name: string;
  isManufacturer?: boolean;
  isRetailer?: boolean;
}

interface DriveModelRecord {
  id: string;
  name?: string;
  modelNumber?: string;
  title?: string;
  manufacturerId?: string;
}

interface CurrencyRecord {
  id: string;
  code: string;
  name?: string;
}

interface DatacenterRecord {
  id: string;
  code: string;
  name: string;
}

// A type alias (not an interface) so it is assignable to the wizard's
// `Record<string, unknown>` value bag.
type AcquisitionFormValues = {
  manufacturerId?: string;
  driveModelId?: string;
  serialNumber?: string;
  worldwideNameWwn?: string;
  retailerVendorId?: string;
  acquisitionCost?: number;
  currencyId?: string;
  purchaseDate?: string;
  warrantyExpiryDate?: string;
  datacenterId?: string;
  locatedAt?: string;
  locationNotes?: string;
};

type MediaAttachmentType =
  "PICTURE" | "INVOICE" | "DOCUMENT" | "CERTIFICATE" | "OTHER";

type MediaDraft = {
  uid: string;
  file: File;
  attachmentType: MediaAttachmentType;
  notes: string;
  isPrimary: boolean;
};

const MAX_FILES = 20;
const MAX_FILE_SIZE = 25 * 1024 * 1024;

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

const inferAttachmentType = (mimeType: string): MediaAttachmentType =>
  mimeType.startsWith("image/") ? "PICTURE" : "DOCUMENT";

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Date fields store plain `YYYY-MM-DD` strings; these props belong on the
// `Form.Item` (not the `DatePicker`) so antd converts to/from Dayjs correctly.
const dateFieldProps = {
  getValueProps: (value?: string | null) => ({
    value: value ? dayjs(value) : undefined,
  }),
  normalize: (value: unknown) =>
    value ? dayjs(value as string).format("YYYY-MM-DD") : undefined,
};

export const DriveAcquisitionWorkflow = () => {
  const [form] = Form.useForm<AcquisitionFormValues>();
  const router = useRouter();
  const { message } = App.useApp();
  const { open } = useNotification();
  const { mutateAsync: acquireDrive } = useCustomMutation();
  const [mediaDrafts, setMediaDrafts] = useState<MediaDraft[]>([]);
  const [createdModels, setCreatedModels] = useState<DriveModelRecord[]>([]);
  const [modelModalOpen, setModelModalOpen] = useState(false);

  const addFiles = (files: File[]) => {
    setMediaDrafts((current) => {
      const next = [...current];

      for (const file of files) {
        if (next.length >= MAX_FILES) {
          message.warning(`You can attach up to ${MAX_FILES} files`);
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

  const updateDraft = (uid: string, patch: Partial<MediaDraft>) => {
    setMediaDrafts((current) =>
      current.map((draft) =>
        draft.uid === uid ? { ...draft, ...patch } : draft,
      ),
    );
  };

  const removeDraft = (uid: string) => {
    setMediaDrafts((current) => current.filter((draft) => draft.uid !== uid));
  };

  const makePrimary = (uid: string) => {
    setMediaDrafts((current) =>
      current.map((draft) => ({
        ...draft,
        isPrimary: draft.uid === uid,
      })),
    );
  };

  const beforeUpload: UploadProps["beforeUpload"] = (file) => {
    addFiles([file]);
    return false;
  };

  const { query: vendorsQuery } = useList<VendorRecord>({
    resource: "vendors",
    pagination: { mode: "server", currentPage: 1, pageSize: PAGE_SIZE },
  });
  const { query: driveModelsQuery } = useList<DriveModelRecord>({
    resource: "drive-models",
    pagination: { mode: "server", currentPage: 1, pageSize: PAGE_SIZE },
  });
  const { query: currenciesQuery } = useList<CurrencyRecord>({
    resource: "currencies",
    pagination: { mode: "server", currentPage: 1, pageSize: PAGE_SIZE },
  });
  const { query: datacentersQuery } = useList<DatacenterRecord>({
    resource: "datacenters",
    pagination: { mode: "server", currentPage: 1, pageSize: PAGE_SIZE },
  });

  const vendors = useMemo(
    () => vendorsQuery.data?.data ?? [],
    [vendorsQuery.data?.data],
  );
  const driveModels = useMemo(
    () => driveModelsQuery.data?.data ?? [],
    [driveModelsQuery.data?.data],
  );
  const currencies = useMemo(
    () => currenciesQuery.data?.data ?? [],
    [currenciesQuery.data?.data],
  );
  const datacenters = useMemo(
    () => datacentersQuery.data?.data ?? [],
    [datacentersQuery.data?.data],
  );

  const manufacturers = useMemo(
    () => vendors.filter((vendor) => vendor.isManufacturer),
    [vendors],
  );
  const retailers = useMemo(
    () => vendors.filter((vendor) => vendor.isRetailer),
    [vendors],
  );

  const manufacturerOptions = useMemo(
    () =>
      manufacturers.map((vendor) => ({
        label: vendor.name,
        value: vendor.id,
      })),
    [manufacturers],
  );
  const retailerOptions = useMemo(
    () => retailers.map((vendor) => ({ label: vendor.name, value: vendor.id })),
    [retailers],
  );
  const currencyOptions = useMemo(
    () =>
      currencies.map((currency) => ({
        label: currency.code,
        value: currency.id,
      })),
    [currencies],
  );
  const datacenterOptions = useMemo(
    () =>
      datacenters.map((datacenter) => ({
        label: `${datacenter.code} — ${datacenter.name}`,
        value: datacenter.id,
      })),
    [datacenters],
  );

  const manufacturerNames = useMemo(
    () => new Map(manufacturers.map((vendor) => [vendor.id, vendor.name])),
    [manufacturers],
  );
  const retailerNames = useMemo(
    () => new Map(retailers.map((vendor) => [vendor.id, vendor.name])),
    [retailers],
  );
  const modelRecords = useMemo(() => {
    const records = new Map(driveModels.map((model) => [model.id, model]));
    for (const model of createdModels) {
      records.set(model.id, model);
    }
    return Array.from(records.values());
  }, [createdModels, driveModels]);

  const modelsById = useMemo(
    () => new Map(modelRecords.map((model) => [model.id, model])),
    [modelRecords],
  );
  const currenciesById = useMemo(
    () => new Map(currencies.map((currency) => [currency.id, currency])),
    [currencies],
  );
  const datacentersById = useMemo(
    () => new Map(datacenters.map((datacenter) => [datacenter.id, datacenter])),
    [datacenters],
  );

  const selectedManufacturerId = Form.useWatch("manufacturerId", form) as
    string | undefined;
  const selectedManufacturerName = selectedManufacturerId
    ? manufacturerNames.get(selectedManufacturerId)
    : undefined;

  const modelOptions = useMemo(
    () =>
      modelRecords
        .filter(
          (model) =>
            !selectedManufacturerId ||
            model.manufacturerId === selectedManufacturerId,
        )
        .map((model) => ({
          label:
            model.title ??
            [model.name, model.modelNumber].filter(Boolean).join(" | "),
          value: model.id,
        })),
    [modelRecords, selectedManufacturerId],
  );

  const initialValues = useMemo<AcquisitionFormValues>(
    () => ({
      purchaseDate: dayjs().format("YYYY-MM-DD"),
      warrantyExpiryDate: dayjs().add(3, "year").format("YYYY-MM-DD"),
      locatedAt: dayjs().format("YYYY-MM-DD"),
    }),
    [],
  );

  const steps: WorkflowStep[] = [
    {
      key: "hardware",
      title: "Hardware",
      description: "Manufacturer, model & identifiers",
      icon: <HddOutlined />,
      fields: [
        ["manufacturerId"],
        ["driveModelId"],
        ["serialNumber"],
        ["worldwideNameWwn"],
      ],
      content: () => (
        <Space direction="vertical" size="middle" style={{ display: "flex" }}>
          <Alert
            type="info"
            showIcon
            message="Hardware details"
            description="Choose the manufacturer and exact drive model, then enter the identifiers printed on the physical drive."
          />
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Manufacturer"
                name="manufacturerId"
                rules={[{ required: true, message: "Select the manufacturer" }]}
              >
                <Select
                  showSearch
                  optionFilterProp="label"
                  placeholder="Select manufacturer"
                  loading={vendorsQuery.isLoading}
                  options={manufacturerOptions}
                  onChange={() => {
                    form.resetFields(["driveModelId"]);
                    setModelModalOpen(false);
                  }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Drive model"
                name="driveModelId"
                rules={[{ required: true, message: "Select the drive model" }]}
              >
                <DriveModelSelect
                  showSearch
                  optionFilterProp="label"
                  placeholder={
                    selectedManufacturerId
                      ? "Select drive model"
                      : "Select a manufacturer first"
                  }
                  disabled={!selectedManufacturerId}
                  loading={driveModelsQuery.isLoading}
                  options={modelOptions}
                  canCreate={Boolean(selectedManufacturerId)}
                  onCreate={() => setModelModalOpen(true)}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Serial number"
                name="serialNumber"
                rules={[
                  { required: true, message: "Serial number is required" },
                  {
                    max: 64,
                    message: "Serial number cannot exceed 64 characters",
                  },
                ]}
              >
                <Input maxLength={64} placeholder="e.g. PHG2134001A87" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Worldwide name (WWN)"
                name="worldwideNameWwn"
                rules={[
                  { max: 32, message: "WWN cannot exceed 32 characters" },
                ]}
              >
                <Input maxLength={32} placeholder="e.g. eui.00253811110023c4" />
              </Form.Item>
            </Col>
          </Row>
        </Space>
      ),
    },
    {
      key: "purchase",
      title: "Purchase",
      description: "Retailer, cost & warranty",
      icon: <ShoppingCartOutlined />,
      fields: [
        ["retailerVendorId"],
        ["currencyId"],
        ["acquisitionCost"],
        ["purchaseDate"],
        ["warrantyExpiryDate"],
      ],
      content: () => (
        <Space direction="vertical" size="middle" style={{ display: "flex" }}>
          <Alert
            type="info"
            showIcon
            message="Purchase details"
            description="Record where the drive was bought, what it cost and the warranty window."
          />
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Retailer"
                name="retailerVendorId"
                rules={[{ required: true, message: "Select the retailer" }]}
              >
                <Select
                  showSearch
                  optionFilterProp="label"
                  placeholder="Select retailer"
                  loading={vendorsQuery.isLoading}
                  options={retailerOptions}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Currency"
                name="currencyId"
                rules={[{ required: true, message: "Select the currency" }]}
              >
                <Select
                  showSearch
                  optionFilterProp="label"
                  placeholder="Select currency"
                  loading={currenciesQuery.isLoading}
                  options={currencyOptions}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Acquisition cost"
                name="acquisitionCost"
                rules={[
                  { required: true, message: "Acquisition cost is required" },
                  {
                    type: "number",
                    min: 0,
                    message: "Must be a positive number",
                  },
                ]}
              >
                <InputNumber
                  min={0}
                  precision={2}
                  style={{ width: "100%" }}
                  placeholder="e.g. 849.50"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item
                label="Purchase date"
                name="purchaseDate"
                rules={[
                  { required: true, message: "Purchase date is required" },
                ]}
                {...dateFieldProps}
              >
                <DatePicker
                  style={{ width: "100%" }}
                  placeholder="Select purchase date"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item
                label="Warranty expiry"
                name="warrantyExpiryDate"
                dependencies={["purchaseDate"]}
                rules={[
                  {
                    required: true,
                    message: "Warranty expiry date is required",
                  },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const purchaseDate = getFieldValue("purchaseDate") as
                        string | undefined;
                      if (!value || !purchaseDate) return Promise.resolve();
                      return dayjs(value as string).isBefore(
                        dayjs(purchaseDate),
                        "day",
                      )
                        ? Promise.reject(
                            new Error(
                              "Warranty expiry must be on or after the purchase date",
                            ),
                          )
                        : Promise.resolve();
                    },
                  }),
                ]}
                {...dateFieldProps}
              >
                <DatePicker
                  style={{ width: "100%" }}
                  placeholder="Select warranty expiry"
                />
              </Form.Item>
            </Col>
          </Row>
        </Space>
      ),
    },
    {
      key: "location",
      title: "Receiving",
      description: "Datacenter & arrival",
      icon: <EnvironmentOutlined />,
      fields: [["datacenterId"], ["locatedAt"], ["locationNotes"]],
      content: () => (
        <Space direction="vertical" size="middle" style={{ display: "flex" }}>
          <Alert
            type="info"
            showIcon
            message="Receiving location"
            description="Where is the drive being received? This becomes its initial location event."
          />
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Receiving datacenter"
                name="datacenterId"
                rules={[{ required: true, message: "Select a datacenter" }]}
              >
                <Select
                  showSearch
                  optionFilterProp="label"
                  placeholder="Select datacenter"
                  loading={datacentersQuery.isLoading}
                  options={datacenterOptions}
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
              <Form.Item label="Location notes" name="locationNotes">
                <Input.TextArea
                  rows={3}
                  placeholder="Optional: ticket reference, dock, receiving notes..."
                />
              </Form.Item>
            </Col>
          </Row>
        </Space>
      ),
    },
    {
      key: "media",
      title: "Media",
      description: "Optional photos & documents",
      icon: <PaperClipOutlined />,
      fields: [],
      content: () => (
        <Space direction="vertical" size="middle" style={{ display: "flex" }}>
          <Alert
            type="info"
            showIcon
            message="Attach files (optional)"
            description="Drag and drop or browse for photos, invoices, certificates or other documents. You can add notes and mark one file as the primary attachment."
          />
          <Upload.Dragger
            multiple
            showUploadList={false}
            beforeUpload={beforeUpload}
            disabled={mediaDrafts.length >= MAX_FILES}
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">
              Drop files here or click to browse
            </p>
            <p className="ant-upload-hint">
              Up to {MAX_FILES} files, 25 MB each.
            </p>
          </Upload.Dragger>

          {mediaDrafts.length === 0 ? (
            <Text type="secondary">
              No files selected. This step can be skipped.
            </Text>
          ) : (
            <Space direction="vertical" size={8} style={{ display: "flex" }}>
              {mediaDrafts.map((draft) => (
                <Card
                  key={draft.uid}
                  size="small"
                  title={
                    <Space size={8} wrap>
                      <Text strong>{draft.file.name}</Text>
                      <Text type="secondary">
                        {formatFileSize(draft.file.size)}
                      </Text>
                      {draft.isPrimary ? <Tag color="gold">Primary</Tag> : null}
                    </Space>
                  }
                  extra={
                    <Button
                      danger
                      size="small"
                      type="text"
                      icon={<DeleteOutlined />}
                      onClick={() => removeDraft(draft.uid)}
                    >
                      Remove
                    </Button>
                  }
                >
                  <Space
                    direction="vertical"
                    size={8}
                    style={{ display: "flex" }}
                  >
                    <Row gutter={16}>
                      <Col xs={24} md={8}>
                        <Form.Item
                          label="Attachment type"
                          style={{ marginBottom: 0 }}
                        >
                          <Select
                            value={draft.attachmentType}
                            options={ATTACHMENT_TYPE_OPTIONS}
                            onChange={(attachmentType) =>
                              updateDraft(draft.uid, { attachmentType })
                            }
                          />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={16}>
                        <Form.Item label="Notes" style={{ marginBottom: 0 }}>
                          <Input.TextArea
                            rows={2}
                            value={draft.notes}
                            placeholder="Optional: serial close-up, invoice reference, condition notes..."
                            onChange={(event) =>
                              updateDraft(draft.uid, {
                                notes: event.target.value,
                              })
                            }
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Checkbox
                      checked={draft.isPrimary}
                      onChange={(event) => {
                        if (event.target.checked) {
                          makePrimary(draft.uid);
                        } else {
                          updateDraft(draft.uid, { isPrimary: false });
                        }
                      }}
                    >
                      Mark as primary attachment
                    </Checkbox>
                  </Space>
                </Card>
              ))}
            </Space>
          )}
        </Space>
      ),
    },
    {
      key: "review",
      title: "Review",
      description: "Confirm & acquire",
      icon: <FileSearchOutlined />,
      fields: [],
      content: ({ values }) => {
        const data = values as AcquisitionFormValues;
        const model = data.driveModelId
          ? modelsById.get(data.driveModelId)
          : undefined;
        const currency = data.currencyId
          ? currenciesById.get(data.currencyId)
          : undefined;
        const datacenter = data.datacenterId
          ? datacentersById.get(data.datacenterId)
          : undefined;
        const cost =
          data.acquisitionCost !== undefined &&
          data.acquisitionCost !== null &&
          !Number.isNaN(Number(data.acquisitionCost))
            ? formatter.format(Number(data.acquisitionCost), currency?.code, {
                withSymbol: true,
              })
            : "-";

        return (
          <Space direction="vertical" size="middle" style={{ display: "flex" }}>
            <Alert
              type="info"
              showIcon
              message="Review & confirm"
              description="Completing this workflow creates the physical drive, its initial location event and an ACQUIRE lifecycle event in a single transaction."
            />
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Manufacturer">
                {(data.manufacturerId &&
                  manufacturerNames.get(data.manufacturerId)) ??
                  "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Drive model">
                {model
                  ? (model.title ??
                    [model.name, model.modelNumber]
                      .filter(Boolean)
                      .join(" | ") ??
                    "-")
                  : "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Serial number">
                {data.serialNumber ?? "-"}
              </Descriptions.Item>
              <Descriptions.Item label="WWN">
                {data.worldwideNameWwn || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Retailer">
                {(data.retailerVendorId &&
                  retailerNames.get(data.retailerVendorId)) ??
                  "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Acquisition cost">
                {cost}
              </Descriptions.Item>
              <Descriptions.Item label="Purchase date">
                {data.purchaseDate ?? "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Warranty expiry">
                {data.warrantyExpiryDate ?? "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Receiving datacenter" span={2}>
                {datacenter ? `${datacenter.code} — ${datacenter.name}` : "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Arrival date">
                {data.locatedAt ?? "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Location notes">
                {data.locationNotes || "-"}
              </Descriptions.Item>
            </Descriptions>
            <Divider style={{ margin: 0 }} />
            <Text strong>Attachments</Text>
            {mediaDrafts.length === 0 ? (
              <Text type="secondary">
                No files attached. You can skip the media step.
              </Text>
            ) : (
              <Space direction="vertical" size={6} style={{ display: "flex" }}>
                {mediaDrafts.map((draft) => (
                  <div
                    key={draft.uid}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                    }}
                  >
                    <Space size={6} wrap>
                      <Tag>{draft.attachmentType}</Tag>
                      <Text>{draft.file.name}</Text>
                      {draft.isPrimary ? <Tag color="gold">Primary</Tag> : null}
                    </Space>
                    <Text
                      type="secondary"
                      ellipsis
                      style={{ maxWidth: "45%", fontSize: 12 }}
                    >
                      {draft.notes || "No notes"}
                    </Text>
                  </div>
                ))}
              </Space>
            )}
            <Divider style={{ margin: 0 }} />
            <Text type="secondary">
              This action is atomic: if any step fails, no drive, location or
              lifecycle record is created.
            </Text>
          </Space>
        );
      },
    },
  ];

  const handleFinish = async (raw: WorkflowValues) => {
    const values = raw as AcquisitionFormValues;

    const response = await acquireDrive({
      url: "/api/proxy/physical-drives/acquisitions",
      method: "post",
      values: {
        serialNumber: values.serialNumber,
        worldwideNameWwn: values.worldwideNameWwn || undefined,
        driveModelId: values.driveModelId,
        retailerVendorId: values.retailerVendorId,
        acquisitionCost: Number(values.acquisitionCost),
        currencyId: values.currencyId,
        purchaseDate: values.purchaseDate,
        warrantyExpiryDate: values.warrantyExpiryDate,
        datacenterId: values.datacenterId,
        locatedAt: values.locatedAt || undefined,
        locationNotes: values.locationNotes || undefined,
      },
    });

    const created = response.data as
      { id?: string; label?: string; serialNumber?: string } | undefined;

    let mediaUploadFailed = false;
    if (created?.id && mediaDrafts.length > 0) {
      try {
        await BinaryService.put(
          `/api/proxy/physical-drives/${created.id}/media`,
          mediaDrafts.map((draft) => draft.file),
          {
            add: JSON.stringify(
              mediaDrafts.map((draft) => ({
                attachmentType: draft.attachmentType,
                notes: draft.notes.trim() || undefined,
                isPrimary: draft.isPrimary,
              })),
            ),
          },
        );
      } catch {
        mediaUploadFailed = true;
      }
    }

    open?.({
      type: mediaUploadFailed ? "error" : "success",
      message: mediaUploadFailed
        ? "Drive acquired, but media upload failed"
        : "Drive acquired",
      description: mediaUploadFailed
        ? "The drive was added to inventory, but one or more files could not be attached. The drive itself was created successfully."
        : created?.label
          ? `Drive ${created.label} was added to inventory.`
          : "The drive was added to inventory.",
      key: "drive-acquisition",
    });

    router.push(
      created?.id ? `/physical-drives/show/${created.id}` : "/physical-drives",
    );
  };

  const handleModelCreated = (model: CreatedDriveModel) => {
    setCreatedModels((current) => [
      ...current.filter((item) => item.id !== model.id),
      model as DriveModelRecord,
    ]);
    form.setFieldValue("driveModelId", model.id);
    setModelModalOpen(false);
    void driveModelsQuery.refetch();
  };

  return (
    <>
      <WorkflowWizard
        title="New Drive Acquisition"
        subtitle="Register a purchased drive, its receiving datacenter and acquisition lifecycle event."
        icon={<HddOutlined />}
        form={form}
        steps={steps}
        initialValues={initialValues}
        submitLabel="Acquire drive"
        submittingLabel="Acquiring..."
        onCancel={() => router.push("/dashboard")}
        onFinish={handleFinish}
      />
      <DriveModelSubWorkflow
        open={modelModalOpen}
        manufacturerId={selectedManufacturerId}
        manufacturerName={selectedManufacturerName}
        onCancel={() => setModelModalOpen(false)}
        onCreated={handleModelCreated}
      />
    </>
  );
};
