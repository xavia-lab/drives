"use client";

import { Show, NumberField } from "@refinedev/antd";
import { useOne, useShow } from "@refinedev/core";
import { Card, Descriptions, Space } from "antd";
import { ProviderTag } from "@components/provider-tag";

export default function InterfaceShow() {
  const { result: record, query } = useShow({});
  const { isLoading } = query;

  const {
    result: busProtocol,
    query: { isLoading: busProtocolIsLoading },
  } = useOne({
    resource: "bus-protocols",
    id: record?.busProtocolId || "",
    queryOptions: {
      enabled: !!record,
    },
  });

  return (
    <Show isLoading={isLoading}>
      <Space direction="vertical" size="middle" style={{ display: "flex" }}>
        <Card title={"Interface"}>
          <Card size="small">
            <Descriptions title="Details" bordered column={2}>
              <Descriptions.Item label="ID">{record?.id}</Descriptions.Item>
              <Descriptions.Item label="Name">{record?.name}</Descriptions.Item>
              <Descriptions.Item label="Bus Protocol">
                {busProtocolIsLoading ? (
                  <>Loading...</>
                ) : (
                  <>{busProtocol?.title}</>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Link Generation">
                <NumberField
                  value={record?.linkGeneration}
                  options={{
                    maximumFractionDigits: 2,
                  }}
                />
              </Descriptions.Item>
              <Descriptions.Item label="Throughput (Gbps)">
                <NumberField
                  value={record?.throughput}
                  options={{
                    notation: "compact",
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }}
                />
              </Descriptions.Item>
              <Descriptions.Item label="Provider">
                <ProviderTag managed={record?.managed} />
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Card>
      </Space>
    </Show>
  );
}
