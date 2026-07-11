"use client";

import { useShow, useOne, useMany } from "@refinedev/core";
import { Show, NumberField, DateField, MarkdownField } from "@refinedev/antd";
import {
  Typography,
  Card,
  Space,
  Table,
  Descriptions,
  Divider,
  Row,
  Col,
  Flex,
  Tooltip,
  Button,
  Modal,
  Form,
  Input,
} from "antd";
import { useApprovalTransition } from "@hooks/use-approval-transition";
import { ApprovelTimeline } from "@components/approvals-timeline";
import {
  CheckCircleFilled,
  CloseCircleFilled,
  DownloadOutlined,
  PrinterOutlined,
} from "@ant-design/icons";
import { PurchaseOrderType } from "@purchase-orders/components/purchase-order-type";
import { MetadataTags } from "@components/metadata-tags";
import Link from "next/link";
import { QRCodeDisplay } from "@components/qrcode-display";
import { useExportProductCSV } from "@allocations/hooks/use-export-products-csv";
import { useEffect, useState } from "react";

const { Title } = Typography;

export default function AllocationShow() {
  const { query } = useShow();
  const { data, isLoading } = query;

  const record = data?.data;

  const { exportCSV, isExporting } = useExportProductCSV();
  const [sortedProducts, setSortedProducts] = useState<any[]>([]);

  const {
    result: purchaseOrderLine,
    query: { isLoading: purchaseOrderLineIsLoading },
  } = useOne({
    resource: "purchase-order-lines",
    id: record?.purchaseOrderLineId || "",
    queryOptions: { enabled: !!record },
  });

  const {
    result: colorsData,
    query: { isLoading: colorIsLoading },
  } = useMany({
    resource: "colors",
    ids: record?.products?.map((item: any) => item.colorId),
    queryOptions: { enabled: !!record?.products?.length },
  });

  const {
    result: materialsData,
    query: { isLoading: materialIsLoading },
  } = useMany({
    resource: "materials",
    ids: record?.products?.map((item: any) => item.materialId),
    queryOptions: { enabled: !!record?.products?.length },
  });

  const {
    result: categoriesData,
    query: { isLoading: categoryIsLoading },
  } = useMany({
    resource: "categories",
    ids: record?.products?.map((item: any) => item.categoryId),
    queryOptions: { enabled: !!record?.products?.length },
  });

  const {
    result: weightUnitData,
    query: { isLoading: weightUnitIsLoading },
  } = useMany({
    resource: "quantity-units",
    ids: record?.products?.map((item: any) => item.weightUnitId),
    queryOptions: { enabled: !!record?.products?.length },
  });

  const {
    result: allocatedQuantityUnit,
    query: { isLoading: allocatedQuantityUnitIsLoading },
  } = useOne({
    resource: "quantity-units",
    id: record?.allocatedQuantityUnitId,
    queryOptions: {
      enabled: !!record,
    },
  });

  // Everything related to the state machine is now here
  const {
    currentState,
    currentStateLoading,
    availableStates,
    availableStatesLoading,
    approvalsTimeline,
    approvalsTimelineIsLoading,
    modalProps,
    showModal,
    stateToButton,
    form,
    selectedState,
  } = useApprovalTransition("allocations", record?.id);

  const formattedEvents = Array.isArray(approvalsTimeline)
    ? approvalsTimeline.map((item: any) => ({
        id: item.id,
        status: item.status,
        createdAt: item.createdAt,
        userName: item.user?.name || item.userId,
        reason: item.metadata?.reason,
      }))
    : []; // Fallback to empty array if not a list

  const productColumns = [
    {
      title: "Sequence",
      dataIndex: "allocationSequence",
      key: "allocationSequence",
      width: 100,
      render: (value: any) => (
        <div style={{ textAlign: "right" }}>
          <NumberField value={value} />
        </div>
      ),
    },
    { title: "SKU", dataIndex: "sku", key: "sku" },
    { title: "Name", dataIndex: "name", key: "name" },
    {
      title: "Weight",
      dataIndex: "weightUnitId",
      // 1. Pass 'record' as the second argument to access the ID
      render: (value: number, item: any) => {
        // 2. Find the specific unit for this row
        const unitRecord = weightUnitData?.data?.find(
          (unit: any) => unit.id === value,
        );

        // Get the name/code or default to empty string
        const unitSuffix = unitRecord ? ` ${unitRecord.symbol}` : "";

        return weightUnitIsLoading ? (
          "Loading..."
        ) : (
          <div style={{ textAlign: "right" }}>
            <NumberField
              value={item.weight}
              options={{
                minimumFractionDigits: 2,
              }}
            />
            {unitSuffix}
          </div>
        );
      },
    },
    {
      title: "Category",
      dataIndex: "categoryId",
      render: (value: any) =>
        categoryIsLoading
          ? "Loading..."
          : categoriesData?.data?.find((item) => item.id === value)?.title ||
            "-",
    },
    {
      title: "Color",
      dataIndex: "colorId",
      render: (value: any) =>
        colorIsLoading
          ? "Loading..."
          : colorsData?.data?.find((item) => item.id === value)?.title || "-",
    },
    {
      title: "Material",
      dataIndex: "materialId",
      render: (value: any) =>
        materialIsLoading
          ? "Loading..."
          : materialsData?.data?.find((item) => item.id === value)?.title ||
            "-",
    },
    {
      title: "Attributes",
      dataIndex: "attributes",
      key: "attributes",
      render: (value: any) => (
        <MetadataTags
          metadata={value}
          colorOverrides={{
            make: "green",
            style: "gold",
            size: "cyan",
            collection: "purple",
          }}
        />
      ),
    },
    // {
    //   title: "QR Code",
    //   dataIndex: "media",
    //   key: "media", // Added an explicit key
    //   render: (value: any, record: any) => {
    //     // Use the full record to be safe
    //     const qrMedia = record.media?.find((x: any) => x.sortOrder === 999);
    //
    //     if (qrMedia?.fileId) {
    //       const imageUrl = `${API_URL}/files/${qrMedia.fileId}`;
    //
    //       return (
    //         <img
    //           src={imageUrl}
    //           alt="QR"
    //           style={{ width: 50, height: 50, objectFit: "contain" }}
    //           // Debug: log the URL to console to see if it's correct
    //           onError={(e) => console.error("Image Load Failed:", imageUrl)}
    //         />
    //       );
    //     }
    //
    //     return <span>No QR</span>;
    //   },
    // },
    {
      title: "QR Code",
      dataIndex: "media",
      render: (media: any[]) => {
        const qrMedia = media?.find((m) => m.sortOrder === 999);
        return qrMedia?.fileId ? (
          <QRCodeDisplay fileId={qrMedia.fileId} size={50} />
        ) : (
          "-"
        );
      },
    },
  ];

  // Find the QR code fileId from the record's media array
  const qrFileId = record?.media?.find((m: any) => m.sortOrder === 999)?.fileId;

  useEffect(() => {
    if (record?.products) {
      const sorted = [...record.products].sort(
        (a, b) => a.allocationSequence - b.allocationSequence,
      );
      setSortedProducts(sorted);
    }
  }, [record]);

  return (
    <Show
      isLoading={isLoading}
      headerButtons={({ defaultButtons }) => (
        <>
          {defaultButtons}
          <Link href={`/allocations/print/${record?.id}`}>
            <Button icon={<PrinterOutlined />} type="primary">
              Print Labels
            </Button>
            <Button
              icon={<DownloadOutlined />}
              loading={isExporting}
              onClick={() =>
                exportCSV(
                  sortedProducts,
                  `${record?.alNumber}_product_labels.csv`,
                )
              }
            >
              Export Labels
            </Button>
          </Link>
        </>
      )}
    >
      <Space direction="vertical" size="middle" style={{ display: "flex" }}>
        <Card title="Allocation">
          <Row gutter={16} style={{ display: "flex" }}>
            {/* First column: takes remaining space */}
            <Col flex="auto">
              <Card size="small">
                <Descriptions title="Details" bordered column={2}>
                  <Descriptions.Item label="AL Number">
                    {record?.alNumber}
                  </Descriptions.Item>
                  <Descriptions.Item label="Allocation Date">
                    <DateField value={record?.allocationDate} format="LLL" />
                  </Descriptions.Item>
                  {/* PO Number */}
                  <Descriptions.Item label="PO Number">
                    {purchaseOrderLineIsLoading
                      ? "Loading..."
                      : purchaseOrderLine?.poNumber}
                  </Descriptions.Item>
                  {/* Purchase Type */}
                  <Descriptions.Item label="Purchase Type">
                    <PurchaseOrderType
                      value={
                        purchaseOrderLineIsLoading
                          ? "Loading..."
                          : purchaseOrderLine?.purchaseType
                      }
                    />
                  </Descriptions.Item>
                  <Descriptions.Item label="Allocated Quantity">
                    {(() => {
                      if (allocatedQuantityUnitIsLoading) return "Loading...";

                      const unitSuffix = ` ${allocatedQuantityUnit?.symbol}`;

                      return (
                        <div style={{ textAlign: "right" }}>
                          <NumberField
                            value={record?.allocatedQuantity}
                            options={{
                              minimumFractionDigits: 2,
                            }}
                          />
                          {unitSuffix}
                        </div>
                      );
                    })()}
                  </Descriptions.Item>
                  <Descriptions.Item label="Final Allaocation">
                    {record?.isFinal ? (
                      <CheckCircleFilled style={{ color: "#52c41a" }} />
                    ) : (
                      <CloseCircleFilled style={{ color: "#ff4d4f" }} />
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="Metadata">
                    <MetadataTags
                      metadata={record?.metadata}
                      colorOverrides={{
                        location: "green",
                        batch: "gold",
                      }}
                    />
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>

            {/* Second column: fixed width (e.g., 200px) */}
            <Col style={{ width: 250, marginLeft: 16 }}>
              <Card size="small">
                {/*Transparent Background*/}
                <Flex justify="space-between" align="start">
                  {!isLoading && qrFileId && (
                    <div
                      style={{
                        border: "1px solid #f0f0f0",
                        padding: "8px",
                        borderRadius: "8px",
                      }}
                    >
                      <QRCodeDisplay fileId={qrFileId} size={200} />
                      <div
                        style={{
                          fontSize: "10px",
                          textAlign: "center",
                          marginTop: "4px",
                        }}
                      >
                        {record?.alNumber}
                      </div>
                    </div>
                  )}
                </Flex>
              </Card>
            </Col>
          </Row>

          <Divider />

          <Title level={5}>{"Notes"}</Title>
          <MarkdownField value={record?.notes} />
        </Card>

        <Divider />

        <Card title="Products">
          <Table
            dataSource={record?.products}
            columns={productColumns}
            rowKey="id"
            pagination={false}
          />
        </Card>

        <Divider />

        <Card title="Approvals" size="small">
          <Row gutter={[24, 24]}>
            <Col span={12}>
              <Title level={5}>Current State</Title>
              {currentStateLoading ? (
                <p>Loading current state...</p>
              ) : (
                <p>
                  <strong>{currentState}</strong>
                </p>
              )}
            </Col>
            <Col span={12}>
              <Title level={5}>Available Actions</Title>
              <Flex gap="small" wrap="wrap">
                {availableStatesLoading ? (
                  <p>Loading available actions...</p>
                ) : !Array.isArray(availableStates) ||
                  availableStates.length === 0 ? (
                  <p>No available state transitions</p>
                ) : (
                  availableStates.map(
                    ({
                      state,
                      description,
                    }: {
                      state: string;
                      description: string;
                    }) => (
                      <Tooltip key={state} title={description}>
                        <Button
                          type="primary"
                          danger={state === "CANCELLED" || state === "REJECTED"}
                          onClick={() => showModal(state)}
                          disabled={currentState === state}
                        >
                          {stateToButton[state as keyof typeof stateToButton] ||
                            state}
                        </Button>
                      </Tooltip>
                    ),
                  )
                )}
              </Flex>
            </Col>
          </Row>

          <Divider />

          <Card title="Timeline" size="small">
            <Space
              direction="vertical"
              size="middle"
              style={{ display: "flex" }}
            >
              <ApprovelTimeline
                events={formattedEvents}
                loading={approvalsTimelineIsLoading}
              />
            </Space>
          </Card>
        </Card>
        <Modal {...modalProps}>
          <Form form={form} layout="vertical">
            <Form.Item
              name="reason"
              label={
                selectedState === "REJECTED" || selectedState === "CANCELLED"
                  ? "Reason"
                  : "Reason (optional)"
              }
              rules={[
                {
                  required:
                    selectedState === "REJECTED" ||
                    selectedState === "CANCELLED",
                  message: "Please provide a reason",
                },
              ]}
            >
              <Input.TextArea
                rows={4}
                placeholder={
                  selectedState === "REJECTED" || selectedState === "CANCELLED"
                    ? "Please explain why this is being rejected/cancelled..."
                    : "Any additional notes..."
                }
              />
            </Form.Item>
          </Form>
        </Modal>
      </Space>
    </Show>
  );
}
