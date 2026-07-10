"use client";

import React from "react";
import {
  Form,
  Input,
  Button,
  Space,
  Card,
  Select,
  InputNumber,
  Switch,
} from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";

interface MetadataEditorProps {
  name?: string | (string | number)[];
  label?: string;
}

type MetadataType = "string" | "number" | "boolean";

interface MetadataItem {
  key: string;
  value: any;
  type: MetadataType;
}

export const MetadataEditor: React.FC<MetadataEditorProps> = ({
  name = "metadata",
  label = "Metadata",
}) => {
  return (
    <Card size="small" title={label} style={{ marginBottom: "1rem" }}>
      {/*
        Step 1: Parent Form.Item handles the logic of
        converting Object {} <-> Array []
      */}
      <Form.Item
        name={name}
        /** API JSON (Object) -> UI Array */
        getValueProps={(value) => {
          if (!value || typeof value !== "object") return { value: [] };

          const entries = Object.entries(value).map(([k, v]) => {
            let type: MetadataType = "string";
            if (typeof v === "number") type = "number";
            if (typeof v === "boolean") type = "boolean";
            return { key: k, value: v, type };
          });

          // Form.List expects the array inside the 'value' prop
          return { value: entries };
        }}
        /** UI Array -> API JSON (Object) */
        getValueFromEvent={(e) => {
          // If the event is from Form.List, 'e' is the array of items
          if (!Array.isArray(e)) return e;

          return e.reduce(
            (acc, item: MetadataItem) => {
              if (item?.key) {
                let finalValue = item.value;
                if (item.type === "number")
                  finalValue = Number(item.value ?? 0);
                if (item.type === "boolean") finalValue = !!item.value;
                if (item.type === "string")
                  finalValue = String(item.value ?? "");

                acc[item.key] = finalValue;
              }
              return acc;
            },
            {} as Record<string, any>,
          );
        }}
      >
        {/* Step 2: Form.List only handles the UI rendering */}
        <Form.List name={name}>
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name: fieldName, ...restField }) => (
                <Space
                  key={key}
                  style={{ display: "flex", marginBottom: 8 }}
                  align="baseline"
                >
                  {/* 1. Key Input */}
                  <Form.Item
                    {...restField}
                    name={[fieldName, "key"]}
                    rules={[{ required: true, message: "Key required" }]}
                  >
                    <Input placeholder="Key" style={{ width: 120 }} />
                  </Form.Item>

                  {/* 2. Type Selector */}
                  <Form.Item
                    {...restField}
                    name={[fieldName, "type"]}
                    initialValue="string"
                  >
                    <Select style={{ width: 100 }}>
                      <Select.Option value="string">String</Select.Option>
                      <Select.Option value="number">Number</Select.Option>
                      <Select.Option value="boolean">Boolean</Select.Option>
                    </Select>
                  </Form.Item>

                  {/* 3. Conditional Value Input */}
                  <Form.Item
                    noStyle
                    shouldUpdate={(prevValues, curValues) => {
                      // Logic to check if the specific type field changed
                      const getV = (vals: any) =>
                        Array.isArray(name) ? vals[name[0]] : vals[name];
                      return (
                        getV(prevValues)?.[fieldName]?.type !==
                        getV(curValues)?.[fieldName]?.type
                      );
                    }}
                  >
                    {({ getFieldValue }) => {
                      const type = getFieldValue([
                        ...(Array.isArray(name) ? name : [name]),
                        fieldName,
                        "type",
                      ]);

                      return (
                        <Form.Item {...restField} name={[fieldName, "value"]}>
                          {type === "number" ? (
                            <InputNumber
                              placeholder="0"
                              style={{ width: 150 }}
                            />
                          ) : type === "boolean" ? (
                            <Switch
                              checkedChildren="true"
                              unCheckedChildren="false"
                            />
                          ) : (
                            <Input placeholder="Value" style={{ width: 150 }} />
                          )}
                        </Form.Item>
                      );
                    }}
                  </Form.Item>

                  <DeleteOutlined
                    onClick={() => remove(fieldName)}
                    style={{ color: "red", cursor: "pointer" }}
                  />
                </Space>
              ))}

              <Button
                type="dashed"
                onClick={() => add({ type: "string", key: "", value: "" })}
                block
                icon={<PlusOutlined />}
              >
                Add Metadata Field
              </Button>
            </>
          )}
        </Form.List>
      </Form.Item>
    </Card>
  );
};
