"use client";

import { useEffect, useState } from "react";
import { Create, useForm, useSelect } from "@refinedev/antd";
import { useMany, useOne } from "@refinedev/core";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Divider,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Typography,
} from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { CurrencyFormatter } from "@/utils/CurrencyFormatter";
import { PricingCalculator } from "@purchase-orders/components/pricing-calculator";
import { TotalsDisplay } from "@purchase-orders/components/totals-display";
import {
  PurchaseItemDetails,
  PurchaseItemType,
  totalPriceCalculator,
  unitPriceCalculator,
} from "@purchase-orders/components/price-calculators";
import { PURCHASE_ORDER_TYPE_OPTIONS } from "@purchase-orders/components/purchase-order-type";

const { Text } = Typography;

export default function PurchaseOrderCreate() {
  const { form, formProps, saveButtonProps } = useForm({});
  const [calculatedTotal, setCalculatedTotal] = useState<number>(0);
  const [paidTotal, setPaidTotal] = useState<number>(0);

  const { selectProps: quantityUnitSelectProps } = useSelect({
    resource: "quantity-units",
    pagination: { mode: "off" },
  });

  const { selectProps: currencySelectProps } = useSelect({
    resource: "currencies",
    pagination: { mode: "off" },
  });

  const { selectProps: vendorSelectProps } = useSelect({
    resource: "vendors",
    optionLabel: "title",
    optionValue: "id",
    pagination: { mode: "off" },
  });

  const { selectProps: colorSelectProps } = useSelect({
    resource: "colors",
    pagination: { mode: "off" },
  });

  const { selectProps: metalSelectProps } = useSelect({
    resource: "metals",
    optionLabel: "title",
    optionValue: "id",
    pagination: { mode: "off" },
  });

  // Watch form fields
  const purchaseTypeField = Form.useWatch("purchaseType", form) || "";
  const metalPriceValue = Form.useWatch("metalPriceValue", form) || 0;
  const pricingPremium = Form.useWatch("pricingPremium", form) || 0;
  const metalId = Form.useWatch("metalId", form);
  const metalPriceUnitId = Form.useWatch("metalPriceUnitId", form);
  const pricingCurrencyId = Form.useWatch("pricingCurrencyId", form);
  const lines = Form.useWatch("lines", form) || [];

  const { selectProps: materialSelectProps, query: materialsQuery } = useSelect(
    {
      resource: "materials",
      pagination: { mode: "off" },
      filters: [
        {
          field: "metalId",
          operator: "eq",
          value: metalId,
        },
      ],
    },
  );
  const materials = materialsQuery?.data?.data || [];

  // Get all quantity units for conversion
  const { result: quantityUnitsData } = useMany({
    resource: "quantity-units",
    ids: [], // Will fetch all
    queryOptions: {
      enabled: true,
    },
  });
  const quantityUnits = quantityUnitsData?.data || [];

  // Fetch currency details (for code)
  const { result: currency } = useOne({
    resource: "currencies",
    id: pricingCurrencyId,
    queryOptions: { enabled: !!pricingCurrencyId },
  });
  const currencyCode = currency?.data?.code || "USD";

  const currencyFormatter = new CurrencyFormatter("en-US");

  // Get grams equivalent for a unit ID
  const getGramsEquivalent = (unitId: number) => {
    if (!unitId || !quantityUnits.length) return 1; // Default to 1 if not found
    const unit = quantityUnits.find((u: any) => u.id === unitId);
    return unit?.gramsEquivalent || 1;
  };

  // Function to normalize quantity to grams
  const normalizeToGrams = (quantityValue: number, unitId: number) => {
    const gramsEquivalent = getGramsEquivalent(unitId);
    return quantityValue * gramsEquivalent;
  };

  const toPurchaseItemDetails = (line: {
    quantityUnitId: number;
    pricePerGram: number;
    charge: number;
    quantityValue: number;
    amount: number;
  }): PurchaseItemDetails => {
    const unitRecord = quantityUnitsData?.data?.find(
      (unit: any) => unit.id === line?.quantityUnitId,
    );

    const gramsEquivalent = unitRecord ? Number(unitRecord.gramsEquivalent) : 1;

    const itemDetails: PurchaseItemDetails = {
      type: (purchaseTypeField as PurchaseItemType) || PurchaseItemType.USED, // Cast to enum
      pricePerGram: Number(line?.pricePerGram || 0),
      charge: Number(line?.charge || 0),
      quantity: Number(line?.quantityValue || 0),
      quantityInGramsEquivalent: gramsEquivalent,
      amount: Number(line?.amount || 0),
    };
    return itemDetails;
  };

  // Function to calculate total for a single line (now with unit normalization)
  const calculateLineTotal = (line: any) => {
    if (!line) return 0;

    const itemDetails = toPurchaseItemDetails(line);
    const pricePerUnit = unitPriceCalculator(itemDetails);
    return pricePerUnit * Number(line?.quantityValue);
  };

  // Effect to recalculate total when lines change
  useEffect(() => {
    if (!lines.length) {
      setCalculatedTotal(0);
      setPaidTotal(0);
      return;
    }

    const calculatedTotal = totalPriceCalculator(
      lines.map(
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

    const paidTotal: number = lines.reduce(
      (sum: number, line: { amount: any }) => sum + Number(line?.amount),
      0,
    );

    setCalculatedTotal(calculatedTotal);
    setPaidTotal(paidTotal);
  }, [lines, quantityUnits]); // Recalculate when quantityUnits change too

  // Handler for onCalculationUpdate (to update lines with per-line pricePerGram)
  const handleCalculationUpdate = (data: {
    premiumAmount: number;
    effectivePrice: number;
    pricePerGram: number;
  }) => {
    const lines = form.getFieldValue("lines") || [];
    if (!lines.length || !materials.length) return;

    const EPS = 1e-6;
    let needsUpdate = false;

    const newLines = lines.map((line: any) => {
      if (!line) return line;

      const material = materials.find((m: any) => m.id === line.materialId);
      const purity = material?.purity ? Number(material.purity) : 1;
      const newPricePerGram = data.pricePerGram * purity;

      const currentPrice = line.pricePerGram ?? 0;
      if (Math.abs(currentPrice - newPricePerGram) > EPS) {
        needsUpdate = true;
      }

      return { ...line, pricePerGram: newPricePerGram };
    });

    if (needsUpdate) {
      form.setFieldsValue({ lines: newLines });
    }
  };

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form
        {...formProps}
        layout="vertical"
        onFinish={(values) => {
          // Normalize pricingPremium to decimal (e.g., 5 → 0.05)
          if (
            "pricingPremium" in values &&
            typeof values.pricingPremium === "number"
          ) {
            values.pricingPremium /= 100;
          }

          if ("purchaseDate" in values && dayjs.isDayjs(values.purchaseDate)) {
            values.purchaseDate = values.purchaseDate.format("YYYY-MM-DD");
          }

          // Call the original onFinish (submits to API)
          formProps.onFinish?.(values);
        }}
      >
        <Card title="Purchase Order Information" size="small">
          <Row gutter={[16, 24]}>
            <Col span={4}>
              <Form.Item
                label="Purchase Type"
                name="purchaseType"
                initialValue={"USED"}
                rules={[{ required: true }]}
              >
                <Select
                  defaultValue={"USED"}
                  options={PURCHASE_ORDER_TYPE_OPTIONS}
                  style={{ width: 120 }}
                />
              </Form.Item>
              <Form.Item
                label="Purchase Date"
                name="purchaseDate"
                rules={[{ required: true }]}
              >
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Metal"
                    name="metalId"
                    rules={[{ required: true }]}
                  >
                    <Select {...metalSelectProps} placeholder="Select metal" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Metal Price"
                    name="metalPriceValue"
                    rules={[{ required: true }]}
                  >
                    <InputNumber
                      min={0}
                      precision={2}
                      style={{ width: "100%" }}
                      placeholder="0.00"
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item
                label={"Metal Price Unit"}
                name={["metalPriceUnitId"]}
                rules={[{ required: true }]}
              >
                <Select
                  {...quantityUnitSelectProps}
                  placeholder="Select Quantity Unit"
                  defaultValue={metalPriceUnitId}
                />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item
                label="Pricing Premium (%)"
                name="pricingPremium"
                rules={[{ required: true }]}
              >
                <InputNumber
                  min={0}
                  max={100}
                  addonAfter="%"
                  step={0.01}
                  precision={2}
                  placeholder="0.00"
                  style={{ width: "100%" }}
                />
              </Form.Item>
              <Form.Item
                label={"Pricing Currency"}
                name={["pricingCurrencyId"]}
                rules={[{ required: true }]}
              >
                <Select
                  {...currencySelectProps}
                  placeholder="Select currency"
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <Row gutter={[16, 24]}>
            <Col span={12}>
              <Form.Item label="Description" name="description">
                <Input.TextArea rows={4} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Vendor"
                name="vendorId"
                rules={[{ required: true }]}
              >
                <Select {...vendorSelectProps} placeholder="Select vendor" />
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <Row gutter={[16, 24]}>
            <Col span={12}>
              <PricingCalculator
                metalPriceValue={metalPriceValue}
                pricingPremium={pricingPremium / 100}
                pricingCurrency={currencyCode}
                metalQuantityInGrams={normalizeToGrams(1, metalPriceUnitId)}
                onCalculationUpdate={handleCalculationUpdate}
              />
            </Col>
            <Col span={12}>
              <TotalsDisplay
                totalAmountCalculated={calculatedTotal}
                totalAmountPaid={paidTotal}
                numberOfLines={lines.length}
                currencyCode={currencyCode}
              />
            </Col>
          </Row>
        </Card>

        <Divider />

        {/* --- Dynamic Purchase Order Lines Section --- */}
        <Card title="Order Lines Information" size="small">
          <Form.List name="lines">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }, index) => {
                  const line = form.getFieldValue(["lines", name]) || {};
                  const lineTotal = calculateLineTotal(line);
                  const quantityUnitId = line.quantityUnitId;
                  const quantityValue = Number(line.quantityValue) || 0;
                  const normalizedGrams = normalizeToGrams(
                    quantityValue,
                    quantityUnitId,
                  );

                  return (
                    <div
                      key={key}
                      style={{
                        padding: "16px",
                        borderRadius: "4px",
                        marginBottom: "12px",
                      }}
                    >
                      <Row gutter={[15, 25]} align="bottom">
                        <Col span={5}>
                          <Form.Item
                            {...restField}
                            name={[name, "name"]}
                            label="Product Name"
                            rules={[{ required: true }]}
                          >
                            <Input />
                          </Form.Item>
                        </Col>
                        <Col span={5}>
                          <Form.Item
                            {...restField}
                            name={[name, "quantityValue"]}
                            label="Quantity"
                            rules={[{ required: true }]}
                          >
                            <InputNumber
                              min={0}
                              precision={2}
                              style={{ width: "100%" }}
                              placeholder="0.00"
                            />
                          </Form.Item>
                        </Col>
                        <Col span={5}>
                          <Form.Item
                            {...restField}
                            name={[name, "quantityUnitId"]}
                            label="Quantity Unit"
                            rules={[{ required: true }]}
                          >
                            <Select
                              {...quantityUnitSelectProps}
                              placeholder="Select Quantity Unit"
                            />
                          </Form.Item>
                        </Col>
                        <Col span={5}>
                          <Form.Item
                            {...restField}
                            name={[name, "charge"]}
                            label="Charge"
                            rules={[{ required: true }]}
                          >
                            <InputNumber
                              precision={2}
                              style={{ width: "100%" }}
                              placeholder="0.00"
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row gutter={[15, 25]} align="bottom">
                        <Col span={5}>
                          <Form.Item
                            {...restField}
                            name={[name, "colorId"]}
                            label="Color"
                          >
                            <Select
                              {...colorSelectProps}
                              placeholder="Select Color"
                            />
                          </Form.Item>
                        </Col>
                        <Col span={5}>
                          <Form.Item
                            {...restField}
                            name={[name, "materialId"]}
                            label="Material"
                          >
                            <Select
                              {...materialSelectProps}
                              placeholder="Select Material"
                            />
                          </Form.Item>
                        </Col>
                        <Col span={5}>
                          <Form.Item
                            {...restField}
                            name={[name, "amount"]}
                            label="Amount"
                            rules={[{ required: true }]}
                          >
                            <InputNumber
                              min={0}
                              precision={2}
                              style={{ width: "100%" }}
                              placeholder="0.00"
                            />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Row gutter={[15, 25]}>
                        <Col span={10}>
                          <div style={{ padding: "8px 0" }}>
                            <Row gutter={8}>
                              <Col span={12}>
                                <Text type="secondary">Price per Gram:</Text>
                                <br />
                                <Text strong>
                                  {currencyFormatter.format(
                                    Number(line.pricePerGram) || 0,
                                    currencyCode,
                                    {
                                      useSymbol: true,
                                    },
                                  )}
                                </Text>
                                <br />
                                <Text
                                  type="secondary"
                                  style={{ fontSize: "12px" }}
                                >
                                  Normalized: {normalizedGrams.toFixed(2)}g
                                </Text>
                              </Col>
                              {/*<Col span={12}>*/}
                              {/*  <Text type="secondary">Formula:</Text>*/}
                              {/*  <br />*/}
                              {/*  <Text code style={{ fontSize: "12px" }}>*/}
                              {/*    ({(Number(line.pricePerGram) || 0).toFixed(2)}{" "}*/}
                              {/*    + {(Number(line.charge) || 0).toFixed(2)}) ×{" "}*/}
                              {/*    {quantityValue.toFixed(2)} ×{" "}*/}
                              {/*    {getGramsEquivalent(quantityUnitId).toFixed(*/}
                              {/*      4,*/}
                              {/*    )}*/}
                              {/*    g*/}
                              {/*  </Text>*/}
                              {/*  <br />*/}
                              {/*  <Text*/}
                              {/*    type="secondary"*/}
                              {/*    style={{ fontSize: "10px" }}*/}
                              {/*  >*/}
                              {/*    Quantity: {quantityValue} ×{" "}*/}
                              {/*    {getGramsEquivalent(quantityUnitId)}g/unit*/}
                              {/*  </Text>*/}
                              {/*</Col>*/}
                            </Row>
                          </div>
                        </Col>

                        <Col span={5}>
                          <div
                            style={{
                              padding: "8px",
                              // background: "#f9f9f9",
                              // border: "1px solid #d9d9d9",
                              borderRadius: "4px",
                              textAlign: "center",
                            }}
                          >
                            <Text type="secondary">Line Total:</Text>
                            <br />
                            <Text strong>
                              {currencyFormatter.format(
                                lineTotal,
                                currencyCode,
                                {
                                  useSymbol: true,
                                },
                              )}
                            </Text>
                          </div>
                        </Col>

                        <Col span={2}>
                          <Button
                            danger
                            onClick={() => remove(name)}
                            icon={<DeleteOutlined />}
                          />
                        </Col>
                      </Row>

                      {/* Hidden field for pricePerGram (calculated per line) */}
                      <Form.Item
                        {...restField}
                        name={[name, "pricePerGram"]}
                        hidden
                      >
                        <Input type="hidden" />
                      </Form.Item>
                    </div>
                  );
                })}
                <Button
                  type="dashed"
                  onClick={() => add()}
                  block
                  icon={<PlusOutlined />}
                >
                  Add Line Item
                </Button>
              </>
            )}
          </Form.List>
        </Card>
      </Form>
    </Create>
  );
}
