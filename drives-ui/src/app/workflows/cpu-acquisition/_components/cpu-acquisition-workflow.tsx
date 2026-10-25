"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCustomMutation, useList } from "@refinedev/core";
import {
  Alert,
  App,
  Button,
  Col,
  DatePicker,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Typography,
} from "antd";
import type { SelectProps } from "antd";
import {
  FileSearchOutlined,
  PlusOutlined,
  ShoppingCartOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  WorkflowWizard,
  type WorkflowStep,
  type WorkflowValues,
} from "@components/workflow";
import { CurrencyFormatter } from "@utils/currency-formatter";
import {
  CpuModelSubWorkflow,
  type CreatedCpuModel,
} from "./cpu-model-sub-workflow";

const { Text } = Typography;
const PAGE_SIZE = 250;
const formatter = new CurrencyFormatter();

interface VendorRecord {
  id: string;
  name: string;
  isManufacturer?: boolean;
  isRetailer?: boolean;
}

interface CpuModelRecord {
  id: string;
  vendorId?: string;
  architecture?: string;
  name?: string;
  physicalCores?: number;
  threads?: number;
  tdpWatts?: number | null;
}

interface CurrencyRecord {
  id: string;
  code: string;
  name?: string;
}

type CpuAcquisitionValues = {
  vendorId?: string;
  cpuModelId?: string;
  serialNumber?: string;
  retailerVendorId?: string;
  currencyId?: string;
  acquisitionCost?: number;
  purchaseDate?: string;
  warrantyExpiryDate?: string;
};

const dateFieldProps = {
  getValueProps: (value?: string | null) => ({
    value: value ? dayjs(value) : undefined,
  }),
  normalize: (value: unknown) =>
    value ? dayjs(value as string).format("YYYY-MM-DD") : undefined,
};

type CpuModelSelectProps = SelectProps & {
  canCreate: boolean;
  onCreate: () => void;
};

const CpuModelSelect = ({
  canCreate,
  onCreate,
  ...selectProps
}: CpuModelSelectProps) => (
  <Space.Compact style={{ width: "100%" }}>
    <Select {...selectProps} style={{ width: "100%" }} />
    <Button icon={<PlusOutlined />} disabled={!canCreate} onClick={onCreate}>
      New model
    </Button>
  </Space.Compact>
);

export const CpuAcquisitionWorkflow = () => {
  const [form] = Form.useForm<CpuAcquisitionValues>();
  const router = useRouter();
  const { message } = App.useApp();
  const { mutateAsync: acquireCpu } = useCustomMutation();
  const [createdModels, setCreatedModels] = useState<CpuModelRecord[]>([]);
  const [modelModalOpen, setModelModalOpen] = useState(false);

  const { query: vendorsQuery } = useList<VendorRecord>({
    resource: "vendors",
    pagination: { mode: "server", currentPage: 1, pageSize: PAGE_SIZE },
  });
  const { query: cpuModelsQuery } = useList<CpuModelRecord>({
    resource: "cpu-models",
    pagination: { mode: "server", currentPage: 1, pageSize: PAGE_SIZE },
  });
  const { query: currenciesQuery } = useList<CurrencyRecord>({
    resource: "currencies",
    pagination: { mode: "server", currentPage: 1, pageSize: PAGE_SIZE },
  });

  const vendors = useMemo(
    () => vendorsQuery.data?.data ?? [],
    [vendorsQuery.data?.data],
  );
  const cpuModels = useMemo(
    () => cpuModelsQuery.data?.data ?? [],
    [cpuModelsQuery.data?.data],
  );
  const currencies = useMemo(
    () => currenciesQuery.data?.data ?? [],
    [currenciesQuery.data?.data],
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

  const manufacturerNames = useMemo(
    () => new Map(manufacturers.map((vendor) => [vendor.id, vendor.name])),
    [manufacturers],
  );
  const retailerNames = useMemo(
    () => new Map(retailers.map((vendor) => [vendor.id, vendor.name])),
    [retailers],
  );

  const modelRecords = useMemo(() => {
    const records = new Map(cpuModels.map((model) => [model.id, model]));
    for (const model of createdModels) {
      records.set(model.id, model);
    }
    return Array.from(records.values());
  }, [createdModels, cpuModels]);

  const modelsById = useMemo(
    () => new Map(modelRecords.map((model) => [model.id, model])),
    [modelRecords],
  );
  const currenciesById = useMemo(
    () => new Map(currencies.map((currency) => [currency.id, currency])),
    [currencies],
  );

  const selectedVendorId = Form.useWatch("vendorId", form) as
    string | undefined;
  const selectedVendorName = selectedVendorId
    ? manufacturerNames.get(selectedVendorId)
    : undefined;

  const modelOptions = useMemo(
    () =>
      modelRecords
        .filter(
          (model) => !selectedVendorId || model.vendorId === selectedVendorId,
        )
        .map((model) => ({
          label: [model.name, model.architecture].filter(Boolean).join(" | "),
          value: model.id,
        })),
    [modelRecords, selectedVendorId],
  );

  const initialValues = useMemo<CpuAcquisitionValues>(
    () => ({
      purchaseDate: dayjs().format("YYYY-MM-DD"),
      warrantyExpiryDate: dayjs().add(3, "year").format("YYYY-MM-DD"),
    }),
    [],
  );

  const steps: WorkflowStep[] = [
    {
      key: "hardware",
      title: "Hardware",
      description: "Manufacturer, CPU model & serial",
      icon: <ThunderboltOutlined />,
      fields: [["vendorId"], ["cpuModelId"], ["serialNumber"]],
      content: () => (
        <Space direction="vertical" size="middle" style={{ display: "flex" }}>
          <Alert
            type="info"
            showIcon
            message="CPU hardware"
            description="Select the processor manufacturer and model, then enter the serial number printed on the CPU or packaging."
          />
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Manufacturer"
                name="vendorId"
                rules={[{ required: true, message: "Select the manufacturer" }]}
              >
                <Select
                  showSearch
                  optionFilterProp="label"
                  placeholder="Select manufacturer"
                  loading={vendorsQuery.isLoading}
                  options={manufacturerOptions}
                  onChange={() => {
                    form.resetFields(["cpuModelId"]);
                    setModelModalOpen(false);
                  }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="CPU model"
                name="cpuModelId"
                rules={[{ required: true, message: "Select the CPU model" }]}
              >
                <CpuModelSelect
                  showSearch
                  optionFilterProp="label"
                  placeholder={
                    selectedVendorId
                      ? "Select CPU model"
                      : "Select a manufacturer first"
                  }
                  disabled={!selectedVendorId}
                  loading={cpuModelsQuery.isLoading}
                  options={modelOptions}
                  canCreate={Boolean(selectedVendorId)}
                  onCreate={() => setModelModalOpen(true)}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Serial number (optional)"
                name="serialNumber"
                rules={[
                  {
                    max: 64,
                    message: "Serial number cannot exceed 64 characters",
                  },
                ]}
              >
                <Input maxLength={64} placeholder="e.g. BF2104S00012" />
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
            description="Record where the CPU was bought, the acquisition cost and the warranty window."
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
      key: "review",
      title: "Review",
      description: "Confirm & acquire",
      icon: <FileSearchOutlined />,
      fields: [],
      content: ({ values }) => {
        const data = values as CpuAcquisitionValues;
        const model = data.cpuModelId
          ? modelsById.get(data.cpuModelId)
          : undefined;
        const currency = data.currencyId
          ? currenciesById.get(data.currencyId)
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
              description="Completing this workflow creates the physical CPU asset and generates its label."
            />
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Manufacturer">
                {(data.vendorId && manufacturerNames.get(data.vendorId)) ?? "-"}
              </Descriptions.Item>
              <Descriptions.Item label="CPU model">
                {model
                  ? [model.name, model.architecture].filter(Boolean).join(" | ")
                  : "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Physical cores">
                {model?.physicalCores ?? "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Threads">
                {model?.threads ?? "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Serial number">
                {data.serialNumber ?? "-"}
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
            </Descriptions>
            <Text type="secondary">
              The CPU label is generated automatically from the manufacturer and
              model.
            </Text>
          </Space>
        );
      },
    },
  ];

  const handleFinish = async (raw: WorkflowValues) => {
    const values = raw as CpuAcquisitionValues;
    const response = await acquireCpu({
      url: "/api/proxy/physical-cpus/acquisitions",
      method: "post",
      values: {
        serialNumber: values.serialNumber,
        cpuModelId: values.cpuModelId,
        retailerVendorId: values.retailerVendorId,
        acquisitionCost: Number(values.acquisitionCost),
        currencyId: values.currencyId,
        purchaseDate: values.purchaseDate,
        warrantyExpiryDate: values.warrantyExpiryDate,
      },
    });

    const created = response.data as
      { id?: string; label?: string } | undefined;
    message.success(
      created?.label
        ? `CPU ${created.label} added to inventory`
        : "CPU added to inventory",
    );
    router.push(
      created?.id ? `/physical-cpus/show/${created.id}` : "/physical-cpus",
    );
  };

  const handleModelCreated = (model: CreatedCpuModel) => {
    setCreatedModels((current) => [
      ...current.filter((item) => item.id !== model.id),
      model as CpuModelRecord,
    ]);
    form.setFieldValue("cpuModelId", model.id);
    setModelModalOpen(false);
    void cpuModelsQuery.refetch();
  };

  return (
    <>
      <WorkflowWizard
        title="New CPU Acquisition"
        subtitle="Register a purchased processor, its purchase details and warranty."
        icon={<ThunderboltOutlined />}
        form={form}
        steps={steps}
        initialValues={initialValues}
        submitLabel="Acquire CPU"
        submittingLabel="Acquiring..."
        onCancel={() => router.push("/dashboard")}
        onFinish={handleFinish}
      />
      <CpuModelSubWorkflow
        open={modelModalOpen}
        vendorId={selectedVendorId}
        vendorName={selectedVendorName}
        onCancel={() => setModelModalOpen(false)}
        onCreated={handleModelCreated}
      />
    </>
  );
};
