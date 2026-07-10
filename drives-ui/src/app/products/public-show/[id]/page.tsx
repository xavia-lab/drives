"use client";

import { useOne, useShow } from "@refinedev/core";
import {
  Card,
  Descriptions,
  Spin,
  Typography,
  Divider,
  Space,
  Row,
  Col,
  Flex,
} from "antd";
import { MetadataTags } from "@components/metadata-tags";
import { MediaManager } from "@components/media-manager";
import { useParams } from "next/navigation";
import { QRCodeDisplay } from "@components/qrcode-display";
import { DateField } from "@refinedev/antd";

const { Title } = Typography;

export default function ProductPublicShow() {
  const params = useParams();
  const id = params?.id;

  const { result: record, query } = useShow({
    resource: "products",
    id: id as string, // Explicitly pass the ID if not using default show
  });
  const { isLoading } = query;

  const {
    result: color,
    query: { isLoading: colorIsLoading },
  } = useOne({
    resource: "colors",
    id: record?.colorId || "",
    queryOptions: {
      enabled: !!record,
    },
  });

  const {
    result: category,
    query: { isLoading: categoryIsLoading },
  } = useOne({
    resource: "categories",
    id: record?.categoryId || "",
    queryOptions: {
      enabled: !!record,
    },
  });

  const {
    result: material,
    query: { isLoading: materialIsLoading },
  } = useOne({
    resource: "materials",
    id: record?.materialId || "",
    queryOptions: {
      enabled: !!record,
    },
  });

  const {
    result: weightUnit,
    query: { isLoading: weightUnitIsLoading },
  } = useOne({
    resource: "quantity-units",
    id: record?.weightUnitId || "0",
    queryOptions: {
      enabled: !!record,
    },
  });

  if (isLoading)
    return (
      <Spin
        size="large"
        style={{ display: "grid", placeItems: "center", height: "100vh" }}
      />
    );

  return (
    <div style={{ padding: "16px", maxWidth: "800px", margin: "0 auto" }}>
      <Space direction="vertical" size="middle" style={{ display: "flex" }}>
        <Card title="Product">
          <Row gutter={16} style={{ display: "flex" }}>
            {/* First column: takes remaining space */}
            <Col flex="auto">
              <Card size="small">
                <Descriptions title="Details" bordered column={2}>
                  <Descriptions.Item label="SKU">
                    {record?.sku}
                  </Descriptions.Item>
                  <Descriptions.Item label="Name">
                    {record?.name}
                  </Descriptions.Item>
                  <Descriptions.Item label="Weight">
                    {record?.weight != null
                      ? Number(record.weight).toFixed(2)
                      : "0.00"}{" "}
                    {weightUnitIsLoading ? (
                      <>Loading...</>
                    ) : (
                      <>{weightUnit?.symbol}</>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="Color">
                    {colorIsLoading ? <>Loading...</> : <>{color?.title}</>}
                  </Descriptions.Item>
                  <Descriptions.Item label="Material">
                    {materialIsLoading ? (
                      <>Loading...</>
                    ) : (
                      <>{material?.title}</>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="Category">
                    {categoryIsLoading ? (
                      <>Loading...</>
                    ) : (
                      <>{category?.title}</>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="Metadata">
                    <MetadataTags
                      metadata={record?.attributes}
                      colorOverrides={{
                        location: "green",
                        batch: "gold",
                      }}
                    />
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>
          </Row>
        </Card>
      </Space>
    </div>
  );
}
