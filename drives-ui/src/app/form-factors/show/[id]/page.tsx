"use client";

import {
  Show,
  TextField,
  NumberField,
  ListButton,
  EditButton,
  DeleteButton,
} from "@refinedev/antd";
import { useShow } from "@refinedev/core";
import { Card, Space, Typography } from "antd";
import { ProviderTag } from "@components/provider-tag";

const { Title } = Typography;

export default function FormFactorShow() {
  const { result: record, query } = useShow({});
  const { isLoading } = query;

  return (
    <Show isLoading={isLoading}>
      <Space direction="vertical" size="middle" style={{ display: "flex" }}>
        <Card title={"Form Factor Information"}>
          <Title level={5}>{"ID"}</Title>
          <TextField value={record?.id} />
          <Title level={5}>{"Name"}</Title>
          <TextField value={record?.name} />
          <Title level={5}>{"Slot Pitch"}</Title>
          <NumberField
            value={record?.slotPitch}
            options={{
              notation: "compact",
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }}
          />{" "}
          mm
          <Title level={5}>{"Provider"}</Title>
          <ProviderTag managed={record?.managed} />
        </Card>
      </Space>
    </Show>
  );
}
