"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useForm, useSelect } from "@refinedev/antd";
import { Edit } from "@refinedev/antd";
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
import { useCustom, useDataProvider, useMany, useOne } from "@refinedev/core";
import type { ProColumns } from "@ant-design/pro-components";
import en_US from "antd/locale/en_US";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

interface ProductRecord {
  id?: number;
  name?: string;
  weight?: number;
  description?: string;
  categoryId?: number;
  size?: number;
  make?: string;
  style?: string;
  collection?: string;
  colorId?: number;
  materialId?: number;
}

interface AllocationFormValues {
  products?: ProductRecord[];
  purchaseOrderLineId?: number;
  allocatedQuantity?: number;
}

export default function AllocationEdit() {
  const { form, formProps, saveButtonProps, query } =
    useForm<AllocationFormValues>({
      resource: "allocations",
      action: "edit",
      redirect: "list",
    });

  const record = query?.data?.data;

  const [editableKeys, setEditableRowKeys] = useState<React.Key[]>([]);
  const [lineObj, setLineObj] = useState<any>(null);
  const [poObj, setPoObj] = useState<any>(null);

  const nextId = useRef(1);

  const { result: lineData } = useOne({
    resource: "purchase-order-lines",
    id: record?.purchaseOrderLineId,
    queryOptions: {
      enabled: !!record?.purchaseOrderLineId,
    },
  });

  useEffect(() => {
    setLineObj(lineData?.data);
  }, [lineData]);

  const { result: poData } = useOne({
    resource: "purchase-orders",
    id: lineObj?.purchaseOrderId,
    queryOptions: {
      enabled: !!lineObj?.purchaseOrderId,
    },
  });

  useEffect(() => {
    setPoObj(poData?.data);
  }, [poData]);

  const { result: unitData } = useMany({
    resource: "quantity-units",
    ids: lineObj ? [lineObj.quantityUnitId] : [],
    queryOptions: {
      enabled: !!lineObj,
    },
  });
  const unit = unitData?.data?.[0];

  useEffect(() => {
    if (record) {
      form.setFieldsValue({
        ...record,
        products: record.products?.map((p: any) => ({
          ...p,
          ...p.attributes, // Flatten attributes into the record
          id: p.id || Date.now(),
        })),
      });
    }
  }, [record, form]);

  const products = Form.useWatch("products", form) || [];
  const isFinal = Form.useWatch("isFinal", form) || false;

  const maxAllocatable =
    (lineObj?.unallocatedQuantityValue || 0) + (record?.allocatedQuantity || 0);

  // 1. Move hooks to the top level of your component
  const categorySelect = useSelect({
    resource: "categories",
    pagination: { mode: "off" },
  });

  const colorSelect = useSelect({
    resource: "colors",
    pagination: { mode: "off" },
  });

  const materialSelect = useSelect({
    resource: "materials",
    pagination: { mode: "off" },
  });

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
        // 2. Reference the variables here
        fieldProps: categorySelect.selectProps,
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
        fieldProps: colorSelect.selectProps,
      },
      {
        title: "Material",
        dataIndex: "materialId",
        valueType: "select",
        fieldProps: materialSelect.selectProps,
      },
      {
        title: "Actions",
        valueType: "option",
        width: 100,
        render: (_, rec) => [
          <Button
            key="delete"
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              const currentProducts = form.getFieldValue("products") || [];
              form.setFieldsValue({
                products: currentProducts.filter((p: any) => p.id !== rec.id),
              });
              setEditableRowKeys((prev) =>
                prev.filter((key) => key !== rec.id),
              );
            }}
          >
            Delete
          </Button>,
        ],
      },
    ],
    // 3. Add the select objects to the dependency array
    [
      form,
      categorySelect.selectProps,
      colorSelect.selectProps,
      materialSelect.selectProps,
    ],
  );

  if (query?.isLoading || !record) return <Spin size="large" />;

  return (
    <Edit saveButtonProps={saveButtonProps}>
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
                id: p.id,
                name: p.name,
                weight: p.weight,
                description: p.description,
                colorId: p.colorId,
                categoryId: p.categoryId,
                materialId: p.materialId,
                weightUnitId: unit?.id,
                purchaseOrderLineId: record.purchaseOrderLineId,
                attributes: {
                  ...(p.size && { size: p.size }),
                  ...(p.make && { make: p.make }),
                  ...(p.style && { style: p.style }),
                  ...(p.collection && { collection: p.collection }),
                },
              }));
            }
            return formProps.onFinish?.(values);
          }}
        >
          <Card title="Allocation Information" size="small">
            <Form.Item label="Purchase Order">
              <Text>{poObj?.poNumber || "Loading..."}</Text>
            </Form.Item>

            <Form.Item label="Purchase Order Line">
              <Text>
                {lineObj?.title || "Loading..."} (Unallocated:{" "}
                {lineObj?.unallocatedQuantityValue || 0} {unit?.name || ""})
              </Text>
            </Form.Item>

            <Form.Item name="purchaseOrderLineId" hidden>
              <Input />
            </Form.Item>
            <Form.Item name="allocatedQuantityUnitId" hidden>
              <Input />
            </Form.Item>

            <Form.Item
              name="allocatedQuantity"
              label={`Allocated Quantity (max ${maxAllocatable} ${unit?.name || ""})`}
              rules={[
                { required: true },
                {
                  validator: (_, value) => {
                    if (!lineObj) return Promise.resolve();
                    return value > maxAllocatable
                      ? Promise.reject(`Cannot exceed ${maxAllocatable}`)
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

            <Card title="Allocation Metadata" size="small">
              <Form.Item name={["metadata", "batch"]} label="Batch">
                <Input />
              </Form.Item>
              <Form.Item name={["metadata", "location"]} label="Location">
                <Input />
              </Form.Item>
            </Card>
          </Card>

          <Divider />

          <Card title="Allocated Products" size="small">
            <Title level={5}>Products</Title>
            <ProConfigProvider intl={enUSIntl}>
              <EditableProTable<ProductRecord>
                columns={columns}
                rowKey="id"
                name="products"
                value={products}
                recordCreatorProps={{
                  position: "bottom",
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
                  onChange: setEditableRowKeys,
                  actionRender: (row, config, defaultDoms) => [
                    defaultDoms.delete,
                  ],
                }}
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
    </Edit>
  );
}
