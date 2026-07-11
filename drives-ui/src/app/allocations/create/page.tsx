"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useForm, useSelect } from "@refinedev/antd";
import { Create } from "@refinedev/antd";
import {
  Button,
  ConfigProvider,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Spin,
  Switch,
  Typography,
  Table,
  Card,
  Divider,
} from "antd";
import {
  EditableProTable,
  enUSIntl,
  ProConfigProvider,
} from "@ant-design/pro-components";
import { useCustom, useDataProvider, useMany } from "@refinedev/core";
import type { ProColumns } from "@ant-design/pro-components";
import en_US from "antd/locale/en_US";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { MetadataEditor } from "@components/metadata-editor";

const { Title } = Typography;

interface ProductRecord {
  id?: number;
  name?: string;
  weight?: number;
  description?: string;
  categoryId?: number;
  size?: string;
  make?: string;
  style?: string;
  collection?: string;
  colorId?: number;
  materialId?: number;
}

interface AllocationFormValues {
  metadata?: any;
  products?: ProductRecord[];
}

export default function AllocationCreate() {
  const { formProps, saveButtonProps, form } = useForm<AllocationFormValues>({
    resource: "allocations",
    redirect: "list",
  });

  const dataProvider = useDataProvider();
  const API_URL = dataProvider().getApiUrl?.() || "";

  const {
    result: poData,
    query: { isLoading: poLoading },
  } = useCustom({
    url: `${API_URL}/allocations/unallocated-purchase-orders`,
    method: "get",
  });

  const pos = Array.isArray(poData?.data) ? poData?.data : [];

  const [selectedPO, setSelectedPO] = useState<number | null>(null);
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [lines, setLines] = useState<any[]>([]);
  const [editableKeys, setEditableRowKeys] = useState<React.Key[]>([]);

  const nextId = useRef(1);

  const handlePOChange = (value: number) => {
    setSelectedPO(value);
    const po = pos.find((p: any) => p.id === value);
    setLines(po ? po.lines : []);
    setSelectedLine(null);
    form.setFieldsValue({ products: [] });
  };

  const handleLineChange = (value: number) => {
    setSelectedLine(value);
  };

  const lineObj = lines.find((l) => l.id === selectedLine);

  const { selectProps: categorySelectProps } = useSelect({
    resource: "categories",
    pagination: { mode: "off" },
  });
  const { selectProps: colorSelectProps } = useSelect({
    resource: "colors",
    pagination: { mode: "off" },
  });
  const { selectProps: materialSelectProps } = useSelect({
    resource: "materials",
    pagination: { mode: "off" },
  });

  const { result: unitData } = useMany({
    resource: "quantity-units",
    ids: lineObj ? [lineObj.quantityUnitId] : [],
    queryOptions: {
      enabled: !!lineObj,
    },
  });
  const unit = unitData?.data?.[0];

  useEffect(() => {
    form.setFieldsValue({
      purchaseOrderLineId: selectedLine,
      allocatedQuantityUnitId: lineObj?.quantityUnitId,
    });
  }, [selectedLine, lineObj, form]);

  const products = Form.useWatch("products", form) || [];
  const isFinal = Form.useWatch("isFinal", form) || false;

  const columns: ProColumns<ProductRecord>[] = useMemo(
    () => [
      {
        title: "Name",
        dataIndex: "name",
        formItemProps: {
          rules: [{ required: true, message: "Name is required" }],
        },
      },
      {
        title: "Weight",
        dataIndex: "weight",
        valueType: "digit",
        formItemProps: {
          rules: [{ required: true, message: "Weight is required" }],
        },
      },
      {
        title: "Category",
        dataIndex: "categoryId",
        valueType: "select",
        fieldProps: categorySelectProps,
        formItemProps: {
          rules: [{ required: true, message: "Category is required" }],
        },
      },
      {
        title: "Size",
        dataIndex: "size",
        valueType: "digit",
      },
      { title: "Description", dataIndex: "description" },
      { title: "Make", dataIndex: "make" },
      { title: "Style", dataIndex: "style" },
      { title: "Collection", dataIndex: "collection" },
      {
        title: "Color",
        dataIndex: "colorId",
        valueType: "select",
        fieldProps: colorSelectProps,
      },
      {
        title: "Material",
        dataIndex: "materialId",
        valueType: "select",
        fieldProps: materialSelectProps,
      },
      {
        title: "Actions",
        valueType: "option", // Required slot for buttons
        width: 100,
        render: (text, record) => [
          <Button
            key="delete"
            type="text" // Keeps it as text rather than a boxy button
            danger // Ant Design standard for red
            icon={<DeleteOutlined />}
            style={{ color: "#ff4d4f" }} // Forced override for Refine themes
            onClick={() => {
              const currentProducts = form.getFieldValue("products") || [];
              form.setFieldsValue({
                products: currentProducts.filter(
                  (p: any) => p.id !== record.id,
                ),
              });
              // Clear from edit mode state
              setEditableRowKeys((prev) =>
                prev.filter((key) => key !== record.id),
              );
            }}
          >
            Delete
          </Button>,
        ],
      },
    ],
    [categorySelectProps, colorSelectProps, materialSelectProps, form],
  );

  if (poLoading) return <Spin size="large" />;

  return (
    <Create saveButtonProps={saveButtonProps}>
      <ConfigProvider locale={en_US}>
        <Form
          {...formProps}
          layout="vertical"
          onValuesChange={(changedValues, allValues) => {
            if (changedValues.products) {
              form.validateFields(["allocatedQuantity"]).catch(() => {});
            }
          }}
          onFinish={(values: AllocationFormValues) => {
            if (values.products) {
              values.products = values.products.map((p: ProductRecord) => ({
                name: p.name,
                weight: p.weight,
                description: p.description,
                colorId: p.colorId,
                categoryId: p.categoryId,
                materialId: p.materialId,
                weightUnitId: unit?.id,
                purchaseOrderLineId: selectedLine,
                attributes: {
                  ...(p.size && { size: p.size }),
                  ...(p.make && { make: p.make }),
                  ...(p.style && { style: p.style }),
                  ...(p.collection && { collection: p.collection }),
                },
              }));
            }

            const transformedMetadata = (values.metadata || []).reduce(
              (acc: any, item: any) => {
                if (item.key) {
                  let val = item.value;
                  if (item.type === "number") val = Number(val);
                  if (item.type === "boolean") val = val === true;
                  acc[item.key] = val;
                }
                return acc;
              },
              {},
            );

            return formProps.onFinish?.({
              ...values,
              metadata: transformedMetadata,
            });
          }}
        >
          <Card title="Allocation Information" size="small">
            <Form.Item label="Purchase Order">
              <Select
                value={selectedPO}
                onChange={handlePOChange}
                options={pos.map((po: any) => ({
                  label: po.poNumber,
                  value: po.id,
                }))}
                placeholder="Select Purchase Order"
                loading={poLoading}
              />
            </Form.Item>

            <Form.Item label="Purchase Order Line">
              <Select
                value={selectedLine}
                onChange={handleLineChange}
                options={lines.map((line: any) => ({
                  label: `${line.title} (Unallocated: ${line.unallocatedQuantityValue} ${unit?.name || ""})`,
                  value: line.id,
                }))}
                placeholder="Select Line"
                disabled={!selectedPO}
              />
            </Form.Item>

            <Form.Item name="purchaseOrderLineId" hidden>
              <Input />
            </Form.Item>
            <Form.Item name="allocatedQuantityUnitId" hidden>
              <Input />
            </Form.Item>

            <Form.Item
              name="allocatedQuantity"
              label={`Allocated Quantity (max ${lineObj?.unallocatedQuantityValue || 0} ${unit?.name || ""})`}
              rules={[
                { required: true },
                {
                  validator: (_, value) => {
                    if (!lineObj) return Promise.resolve();
                    return value > lineObj.unallocatedQuantityValue
                      ? Promise.reject(
                          `Cannot exceed ${lineObj.unallocatedQuantityValue}`,
                        )
                      : Promise.resolve();
                  },
                },
                {
                  validator: (_, value) => {
                    if (isFinal) return Promise.resolve();
                    const total = products.reduce(
                      (sum: number, p: any) => sum + (p.weight || 0),
                      0,
                    );
                    return value !== total
                      ? Promise.reject("Must equal sum of product weights")
                      : Promise.resolve();
                  },
                },
              ]}
            >
              <InputNumber
                min={0}
                disabled={!selectedLine}
                addonAfter={unit?.name || ""}
                style={{ width: "100%" }}
              />
            </Form.Item>

            <Form.Item name="notes" label="Notes">
              <Input.TextArea />
            </Form.Item>

            <Form.Item
              name="isFinal"
              label="Final Allocation"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <MetadataEditor name="metadata" label="Allocation Metadata" />
          </Card>

          <Divider />

          <Card title="Allocated Products" size="small">
            <ProConfigProvider intl={enUSIntl}>
              <EditableProTable<ProductRecord>
                columns={columns}
                rowKey="id"
                name="products" // Connects to Form.Item automatically
                value={products}
                recordCreatorProps={{
                  position: "bottom",
                  disabled: !selectedLine,
                  creatorButtonText: "Add Product",
                  icon: <PlusOutlined />,
                  record: () => ({
                    id: nextId.current++,
                    colorId: lineObj?.colorId,
                    materialId: lineObj?.materialId,
                  }),
                }}
                editable={{
                  type: "multiple",
                  editableKeys,
                  onChange: setEditableRowKeys, // Keeps new rows editable
                  actionRender: (row, config, defaultDoms) => [
                    defaultDoms.delete,
                  ],
                }}
                // Simplify onChange to avoid render loops
                onChange={(newValue) => {
                  form.setFieldsValue({ products: newValue });
                  form.validateFields(["allocatedQuantity"]).catch(() => {});
                }}
                tableAlertRender={false}
                summary={(pageData) => {
                  const totalWeight = pageData.reduce(
                    (acc, item) => acc + (item.weight || 0),
                    0,
                  );
                  return (
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0}>
                        Total Allocated
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1}>
                        {Number(totalWeight).toFixed(3)}
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={2} colSpan={7} />
                    </Table.Summary.Row>
                  );
                }}
              />
            </ProConfigProvider>
          </Card>
        </Form>
      </ConfigProvider>
    </Create>
  );
}
