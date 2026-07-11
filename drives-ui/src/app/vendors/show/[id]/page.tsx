"use client";

import {
  DeleteButton,
  EditButton,
  ListButton,
  Show,
  TextField,
} from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Card, Descriptions, Space, Typography } from "antd";

const { Title } = Typography;

export default function VendorShow() {
  const { result: record, query } = useShow({});
  const { isLoading } = query;

  return (
    <Show isLoading={isLoading}>
      <Space direction="vertical" size="middle" style={{ display: "flex" }}>
        <Card title={"Vendor Information"}>
          <Space direction="vertical" size="middle" style={{ display: "flex" }}>
            {/* General Info */}
            <Card title="General Information">
              <Title level={5}>Name</Title>
              <TextField value={record?.name} />
            </Card>

            {/* Render Address Card only if the address object exists */}
            {record?.address && (
              <Card title="Address Details">
                <Descriptions column={1}>
                  <Descriptions.Item label="Firm">
                    {record.address.firmName}
                  </Descriptions.Item>
                  <Descriptions.Item label="Recipient">
                    {record.address.recipientName}
                  </Descriptions.Item>
                  <Descriptions.Item label="Street">
                    {record.address.addressLine1} {record.address.addressLine2}
                  </Descriptions.Item>
                  <Descriptions.Item label="Location">
                    {`${record.address.city}, ${record.address.state} ${record.address.zipCode}`}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            )}

            {/* Render Contact Card only if the contact object exists */}
            {record?.contact && (
              <Card title="Contact Information">
                <Descriptions column={1}>
                  <Descriptions.Item label="Title">
                    {record.contact.title}
                  </Descriptions.Item>
                  <Descriptions.Item label="Phone Number">
                    {record.contact.phone}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            )}
          </Space>
        </Card>
      </Space>
    </Show>
  );
}
