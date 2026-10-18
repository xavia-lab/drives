"use client";

import { LookupSelect } from "@components/lookup-select";
import {
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Row,
  Space,
} from "antd";
import type { FormProps } from "antd";
import dayjs from "dayjs";

const SERIAL_NUMBER_RULES = [
  { required: true, message: "Serial number is required" },
  { max: 64, message: "Serial number cannot exceed 64 characters" },
];

const WWN_RULES = [{ max: 32, message: "WWN cannot exceed 32 characters" }];

const STORAGE_MODEL_RULES = [
  { required: true, message: "Storage model is required" },
];

const RETAILER_RULES = [{ required: true, message: "Retailer is required" }];

const CURRENCY_RULES = [{ required: true, message: "Currency is required" }];

const ACQUISITION_COST_RULES = [
  { required: true, message: "Acquisition cost is required" },
  { type: "number" as const, min: 0, message: "Must be a positive number" },
];

const PURCHASE_DATE_RULES = [
  { required: true, message: "Purchase date is required" },
];

const WARRANTY_RULES = [
  { required: true, message: "Warranty expiry date is required" },
];

export const PhysicalDriveForm = ({ formProps }: { formProps: FormProps }) => (
  <Space direction="vertical" size="middle" style={{ display: "flex" }}>
    <Card title={"Physical Drive Information"}>
      <Form {...formProps} layout="vertical">
        <Row gutter={[16, 24]}>
          <Col span={12}>
            <Form.Item
              label={"Serial Number"}
              name={["serialNumber"]}
              rules={SERIAL_NUMBER_RULES}
            >
              <Input maxLength={64} placeholder="e.g. PHG2134001A87" />
            </Form.Item>
            <Form.Item
              label={"Drive Model"}
              name={["driveModelId"]}
              rules={STORAGE_MODEL_RULES}
            >
              <LookupSelect
                resource="drive-models"
                optionLabel="title"
                placeholder="Select storage model"
              />
            </Form.Item>
            <Form.Item
              label={"Retailer"}
              name={["retailerVendorId"]}
              rules={RETAILER_RULES}
            >
              <LookupSelect resource="vendors" placeholder="Select retailer" />
            </Form.Item>
            <Form.Item
              label={"Currency"}
              name={["currencyId"]}
              rules={CURRENCY_RULES}
            >
              <LookupSelect
                resource="currencies"
                placeholder="Select currency"
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label={"Worldwide Name (WWN)"}
              name={["worldwideNameWwn"]}
              rules={WWN_RULES}
            >
              <Input maxLength={32} placeholder="e.g. eui.00253811110023c4" />
            </Form.Item>
            <Form.Item
              label={"Acquisition Cost"}
              name={["acquisitionCost"]}
              rules={ACQUISITION_COST_RULES}
            >
              <InputNumber
                min={0}
                precision={2}
                style={{ width: "100%" }}
                placeholder="e.g. 849.50"
              />
            </Form.Item>
            <Form.Item
              label={"Purchase Date"}
              name={["purchaseDate"]}
              rules={PURCHASE_DATE_RULES}
              getValueProps={(value) => ({
                value: value ? dayjs(value) : undefined,
              })}
              normalize={(value) =>
                value ? dayjs(value).format("YYYY-MM-DD") : undefined
              }
            >
              <DatePicker
                style={{ width: "100%" }}
                placeholder="Select purchase date"
              />
            </Form.Item>
            <Form.Item
              label={"Warranty Expiry Date"}
              name={["warrantyExpiryDate"]}
              rules={WARRANTY_RULES}
              getValueProps={(value) => ({
                value: value ? dayjs(value) : undefined,
              })}
              normalize={(value) =>
                value ? dayjs(value).format("YYYY-MM-DD") : undefined
              }
            >
              <DatePicker
                style={{ width: "100%" }}
                placeholder="Select warranty expiry date"
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Card>
  </Space>
);
