"use client";

import { useState, useEffect } from "react";
import {
  DateField,
  DeleteButton,
  EditButton,
  ListButton,
  MarkdownField,
  NumberField,
  RefreshButton,
  Show,
  TextField,
} from "@refinedev/antd";
import { useOne, useMany, useShow } from "@refinedev/core";
import {
  Col,
  Divider,
  Flex,
  Row,
  Typography,
  Table,
  Card,
  Button,
  Modal,
  Form,
  Input,
  Space,
  Tooltip,
  Descriptions,
} from "antd";

import { PricingCalculator } from "@purchase-orders/components/pricing-calculator";
import {
  PurchaseItemType,
  PurchaseItemDetails,
  unitPriceCalculator,
  totalPriceCalculator,
} from "@purchase-orders/components/price-calculators";
import { TotalsDisplay } from "@purchase-orders/components/totals-display";
import { PurchaseOrderType } from "@purchase-orders/components/purchase-order-type";
import { ApprovelTimeline } from "@components/approvals-timeline";
import { useApprovalTransition } from "@hooks/use-approval-transition";
import { QRCodeDisplay } from "@components/qrcode-display";

const { Title } = Typography;

export default function PurchaseOrderShow() {
  const { result: record, query } = useShow({});
  const { isLoading } = query;

  const {
    result: currency,
    query: { isLoading: currencyIsLoading },
  } = useOne({
    resource: "currencies",
    id: record?.pricingCurrencyId,
    queryOptions: {
      enabled: !!record,
    },
  });

  // Safely extract the currency code, defaulting to "USD" if not found or loading
  const currencyCode = currency?.code || "USD";

  // 1. Fetch Related QuantityUnits
  const {
    result: lineQuantityUnitsData,
    query: { isLoading: lineQuantityIsLoading },
  } = useMany({
    resource: "quantity-units",
    ids: record?.lines?.map((item: any) => item.quantityUnitId),
    queryOptions: { enabled: !!record?.lines?.length },
  });

  // 2. Fetch Related Colors
  const {
    result: colorsData,
    query: { isLoading: colorIsLoading },
  } = useMany({
    resource: "colors",
    ids: record?.lines?.map((item: any) => item.colorId),
    queryOptions: { enabled: !!record?.lines?.length },
  });

  // 3. Fetch Related Materials
  const {
    result: materialsData,
    query: { isLoading: materialIsLoading },
  } = useMany({
    resource: "materials",
    ids: record?.lines?.map((item: any) => item.materialId),
    queryOptions: { enabled: !!record?.lines?.length },
  });

  const {
    result: orderQuantityUnit,
    query: { isLoading: orderQuantityUnitIsLoading },
  } = useOne({
    resource: "quantity-units",
    id: record?.metalPriceUnitId,
    queryOptions: {
      enabled: !!record,
    },
  });

  const {
    result: metal,
    query: { isLoading: metalIsLoading },
  } = useOne({
    resource: "metals",
    id: record?.metalId,
    queryOptions: {
      enabled: !!record,
    },
  });

  const {
    result: vendor,
    query: { isLoading: vendorIsLoading },
  } = useOne({
    resource: "vendors",
    id: record?.vendorId,
    queryOptions: {
      enabled: !!record,
    },
  });

  const [updatedLines, setUpdatedLines] = useState(record?.lines || []); // New state

  useEffect(() => {
    setUpdatedLines(record?.lines || []);
  }, [record?.lines]); // Reset on data change

  const handleCalculationUpdate = (data: {
    premiumAmount: number;
    effectivePrice: number;
    pricePerGram: number;
  }) => {
    if (!record?.lines?.length || !materialsData?.data?.length) {
      return; // Early exit if no lines or materials to process
    }

    const EPS = 1e-6; // Tolerance for floating-point comparison
    let needsUpdate = false;

    const newLines = (record?.lines || []).map((line: any, index: number) => {
      const material = materialsData?.data?.find(
        (m: any) => m.id === line.materialId,
      );
      const purity = material?.purity ? Number(material.purity) : 1; // Default to 1 if missing/invalid
      const newPricePerGram = data.pricePerGram * purity;

      // Check if this line's pricePerGram has changed (using tolerance)
      const currentPrice = updatedLines[index]?.pricePerGram ?? 0;
      if (Math.abs(currentPrice - newPricePerGram) > EPS) {
        needsUpdate = true;
      }

      return {
        ...line,
        pricePerGram: newPricePerGram,
      };
    });

    if (needsUpdate) {
      setUpdatedLines(newLines);
    }
  };

  const toPurchaseItemDetails = (line: {
    quantityUnitId: number;
    pricePerGram: number;
    charge: number;
    quantityValue: number;
    amount: number;
  }): PurchaseItemDetails => {
    const unitRecord = lineQuantityUnitsData?.data?.find(
      (unit: any) => unit.id === line?.quantityUnitId,
    );

    const gramsEquivalent = unitRecord ? Number(unitRecord.gramsEquivalent) : 1;

    const itemDetails: PurchaseItemDetails = {
      type: record?.purchaseType as PurchaseItemType, // Cast to enum
      pricePerGram: Number(line?.pricePerGram || 0),
      charge: Number(line?.charge || 0),
      quantity: Number(line?.quantityValue || 0),
      quantityInGramsEquivalent: gramsEquivalent,
      amount: Number(line?.amount || 0),
    };
    return itemDetails;
  };

  // Table column definitions for purchaseOrderLines
  const purchaseOrderLineColumns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (value: string) => <TextField value={value} />,
    },
    {
      title: "Quantity",
      dataIndex: "quantityValue",
      key: "quantityValue",
      // 1. Pass 'record' as the second argument to access the ID
      render: (value: number, record: any) => {
        // 2. Find the specific unit for this row
        const unitRecord = lineQuantityUnitsData?.data?.find(
          (unit: any) => unit.id === record.quantityUnitId,
        );

        // Get the name/code or default to empty string
        const unitSuffix = unitRecord ? ` ${unitRecord.symbol}` : "";

        return lineQuantityIsLoading ? (
          "Loading..."
        ) : (
          <div style={{ textAlign: "right" }}>
            <NumberField
              value={value}
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
      title: "Charge",
      dataIndex: "charge",
      key: "charge",
      render: (value: number, record: any) => (
        <div style={{ textAlign: "right" }}>
          <NumberField
            value={value}
            options={{
              style: "currency",
              currency: currencyCode,
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }}
          />
        </div>
      ),
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
      title: "Price/Gram",
      dataIndex: "pricePerGram",
      key: "pricePerGram",
      render: (value: number, record: any) => (
        <div style={{ textAlign: "right" }}>
          <NumberField
            value={record?.pricePerGram}
            options={{
              style: "currency",
              currency: currencyCode,
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }}
          />
        </div>
      ),
    },
    {
      title: "Price/Quantity Unit",
      key: "pricePerUnit",
      render: (value: number, record: any) => {
        const itemDetails = toPurchaseItemDetails(record);
        const pricePerUnit = unitPriceCalculator(itemDetails);

        return (
          <div style={{ textAlign: "right" }}>
            <NumberField
              value={pricePerUnit}
              options={{
                style: "currency",
                currency: currencyCode,
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }}
            />
          </div>
        );
      },
    },
    {
      title: "Total Price (Calculated)",
      key: "totalPriceCalculated",
      render: (value: number, record: any) => {
        const itemDetails = toPurchaseItemDetails(record);
        const totalPrice =
          unitPriceCalculator(itemDetails) * Number(record.quantityValue);

        return (
          <div style={{ textAlign: "right" }}>
            <NumberField
              value={totalPrice}
              options={{
                style: "currency",
                currency: currencyCode,
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }}
            />
          </div>
        );
      },
    },
    {
      title: "Amount Paid ",
      dataIndex: "amount",
      key: "amount",
      render: (value: number, record: any) => (
        <div style={{ textAlign: "right" }}>
          <NumberField
            value={value}
            options={{
              style: "currency",
              currency: currencyCode,
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }}
          />
        </div>
      ),
    },
  ];

  const calculatedTotal: number = totalPriceCalculator(
    updatedLines.map(
      (line: {
        quantityUnitId: number;
        purchaseType: string;
        pricePerGram: number;
        charge: number;
        quantityValue: number;
        amount: number;
      }) => toPurchaseItemDetails(line),
    ),
  );

  const paidTotal: number = updatedLines.reduce(
    (sum: number, line: { amount: any }) => sum + Number(line?.amount),
    0,
  );

  const purchaseOrderLineSummary = (data: readonly any[]) => {
    return (
      <Table.Summary fixed>
        <Table.Summary.Row>
          <Table.Summary.Cell index={0} colSpan={8} align="right">
            <NumberField
              value={calculatedTotal}
              options={{
                style: "currency",
                currency: currencyCode,
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }}
            />
          </Table.Summary.Cell>
          <Table.Summary.Cell index={2} align="right">
            <NumberField
              value={paidTotal}
              options={{
                style: "currency",
                currency: currencyCode,
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }}
            />
          </Table.Summary.Cell>
        </Table.Summary.Row>
        <Table.Summary.Row>
          <Table.Summary.Cell index={0} colSpan={8} align="right">
            <Title level={5}>Calculated Total</Title>
          </Table.Summary.Cell>
          <Table.Summary.Cell index={2} align="right">
            <Title level={5}>Paid Total</Title>
          </Table.Summary.Cell>
        </Table.Summary.Row>
      </Table.Summary>
    );
  };

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
  } = useApprovalTransition("purchase-orders", record?.id);

  const formattedEvents = Array.isArray(approvalsTimeline)
    ? approvalsTimeline.map((item: any) => ({
        id: item.id,
        status: item.status,
        createdAt: item.createdAt,
        userName: item.user?.name || item.userId,
        reason: item.metadata?.reason,
      }))
    : []; // Fallback to empty array if not a list

  // Find the QR code fileId from the record's media array
  const qrFileId = record?.media?.find((m: any) => m.sortOrder === 999)?.fileId;

  return (
    <Show
      isLoading={isLoading}
      headerButtons={({
        editButtonProps,
        deleteButtonProps,
        listButtonProps,
        refreshButtonProps,
      }) => (
        <>
          {listButtonProps && <ListButton {...listButtonProps} />}

          {editButtonProps && (
            <EditButton
              {...editButtonProps}
              disabled={currentState !== "DRAFT"}
            />
          )}

          {deleteButtonProps && (
            <DeleteButton
              {...deleteButtonProps}
              disabled={currentState !== "DRAFT"}
            />
          )}
          {refreshButtonProps && <RefreshButton {...refreshButtonProps} />}
        </>
      )}
    >
      <Space direction="vertical" size="middle" style={{ display: "flex" }}>
        <Card title="Purchase Order">
          <Row gutter={16} style={{ display: "flex" }}>
            {/* First column: takes remaining space */}
            <Col flex="auto">
              <Card size="small">
                <Descriptions title="Details" bordered column={2}>
                  <Descriptions.Item label="PO Number">
                    {record?.poNumber}
                  </Descriptions.Item>
                  <Descriptions.Item label="Metal">
                    {metalIsLoading ? <>Loading...</> : <>{metal?.title}</>}
                  </Descriptions.Item>
                  <Descriptions.Item label="Purchase Date">
                    <DateField value={record?.purchaseDate} />
                  </Descriptions.Item>
                  <Descriptions.Item
                    label="Metal Price"
                    styles={{ content: { textAlign: "right" } }}
                  >
                    <NumberField
                      value={record?.metalPriceValue}
                      options={{
                        style: "currency",
                        currency: currencyCode,
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }}
                    />
                    / {orderQuantityUnit?.symbol}
                  </Descriptions.Item>
                  <Descriptions.Item label="Purchase Type">
                    <PurchaseOrderType value={record?.purchaseType} />
                  </Descriptions.Item>
                  <Descriptions.Item
                    label="Pricing Premium"
                    styles={{ content: { textAlign: "right" } }}
                  >
                    <NumberField
                      value={record?.pricingPremium}
                      options={{
                        style: "percent",
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }}
                    />
                  </Descriptions.Item>
                  <Descriptions.Item
                    label="Total Amount Paid"
                    styles={{ content: { textAlign: "right" } }}
                  >
                    <NumberField
                      value={paidTotal}
                      options={{
                        style: "currency",
                        currency: currencyCode,
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
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
                        {record?.poNumber}
                      </div>
                    </div>
                  )}
                </Flex>
              </Card>
            </Col>
          </Row>
          <Divider /> {/* Adds a clear separation before the metadata */}
          <Row gutter={[16, 24]}>
            {/* Third Column */}
            <Col span={12}>
              <Title level={5}>{"Description"}</Title>
              <MarkdownField value={record?.description} />
            </Col>
            {/* Fourth Column */}
            <Col span={12}>
              <Title level={5}>{"Vendor"}</Title>
              <TextField
                value={vendorIsLoading ? <>Loading...</> : <>{vendor?.title}</>}
              />
            </Col>
          </Row>
          <Divider /> {/* Adds a clear separation before the metadata */}
          <Row gutter={[16, 24]}>
            {/* Third Column */}
            <Col span={12}>
              <PricingCalculator
                metalPriceValue={record?.metalPriceValue}
                pricingPremium={record?.pricingPremium}
                pricingCurrency={currencyCode}
                metalQuantityInGrams={orderQuantityUnit?.gramsEquivalent}
                onCalculationUpdate={handleCalculationUpdate}
              />
            </Col>
            {/* Fourth Column */}
            <Col span={12}>
              <TotalsDisplay
                totalAmountCalculated={calculatedTotal}
                totalAmountPaid={paidTotal}
                numberOfLines={updatedLines.length}
                currencyCode={currencyCode}
              />
            </Col>
          </Row>
        </Card>
        <Divider /> {/* Adds a clear separation before the metadata */}
        <Card title="Order Lines Information" size="small">
          <Table
            dataSource={updatedLines}
            columns={purchaseOrderLineColumns}
            rowKey="id"
            pagination={false} // Usually disabled for nested items on a show page
            summary={purchaseOrderLineSummary}
          />
        </Card>
        <Divider />
        <Card title="Misc Information" size="small">
          <Row gutter={[24, 24]}>
            <Col span={12}>
              <Title level={5}>Created At</Title>
              <DateField
                value={record?.createdAt}
                format="LLL" // Example: January 17, 2026 4:19 PM
              />
            </Col>
            <Col span={12}>
              <Title level={5}>Last Updated</Title>
              <DateField value={record?.updatedAt} format="LLL" />
            </Col>
          </Row>
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
