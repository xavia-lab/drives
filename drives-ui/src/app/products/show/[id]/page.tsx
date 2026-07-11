"use client";

import { DateField, ListButton, Show } from "@refinedev/antd";

import { useGo, useOne, useShow } from "@refinedev/core";
import {
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Flex,
  Row,
  Space,
  Typography,
} from "antd";
import { MetadataTags } from "@components/metadata-tags";
import { QRCodeDisplay } from "@components/qrcode-display";
import { MediaManager } from "@components/media-manager";
import { EyeOutlined } from "@ant-design/icons";

const { Title } = Typography;

export default function ProductShow() {
  const { result: record, query } = useShow({});
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

  // Find the QR code fileId from the record's media array
  const qrFileId = record?.media?.find((m: any) => m.sortOrder === 999)?.fileId;

  const go = useGo();

  return (
    <Show
      isLoading={isLoading}
      // 2. Customize header buttons based on record data
      headerButtons={({
        editButtonProps,
        deleteButtonProps,
        listButtonProps,
      }) => (
        <>
          {listButtonProps && <ListButton {...listButtonProps} />}

          <Button
            icon={<EyeOutlined />}
            onClick={() => {
              go({
                to: `/products/public-show/${record?.id}`,
                type: "push",
              });
            }}
          >
            Public View
          </Button>

          {/*{editButtonProps && (*/}
          {/*  <EditButton*/}
          {/*    {...editButtonProps}*/}
          {/*    // Disable if 'managed' field is true*/}
          {/*    disabled={record?.managed}*/}
          {/*  />*/}
          {/*)}*/}
          {/*{deleteButtonProps && (*/}
          {/*  <DeleteButton*/}
          {/*    {...deleteButtonProps}*/}
          {/*    // Disable if 'managed' field is true*/}
          {/*    disabled={record?.managed}*/}
          {/*  />*/}
          {/*)}*/}
        </>
      )}
    >
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
                      <>{weightUnit?.title}</>
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
                        {record?.sku}
                      </div>
                    </div>
                  )}
                </Flex>

                {/*White Background*/}
                {/*<Flex justify="space-between" align="start">*/}
                {/*  <Typography.Title level={3}>{record?.name}</Typography.Title>*/}
                {/*  {!isLoading && qrFileId && (*/}
                {/*    <div*/}
                {/*      style={{*/}
                {/*        border: "1px solid #f0f0f0",*/}
                {/*        padding: "12px",*/}
                {/*        borderRadius: "12px",*/}
                {/*        backgroundColor: "#fff",*/}
                {/*        boxShadow: "0 2px 8px rgba(0,0,0,0.05)", // Optional: make it pop*/}
                {/*      }}*/}
                {/*    >*/}
                {/*      /!* Set the size here *!/*/}
                {/*      <QRCodeDisplay fileId={qrFileId} size={200} />*/}

                {/*      <div*/}
                {/*        style={{*/}
                {/*          fontSize: "12px",*/}
                {/*          textAlign: "center",*/}
                {/*          marginTop: "8px",*/}
                {/*          fontWeight: 600,*/}
                {/*          color: "#666",*/}
                {/*        }}*/}
                {/*      >*/}
                {/*        {record?.sku}*/}
                {/*      </div>*/}
                {/*    </div>*/}
                {/*  )}*/}
                {/*</Flex>*/}
              </Card>
            </Col>
          </Row>

          <Divider />

          <MediaManager
            productId={Number(record?.id)}
            media={record?.media || []}
            onRefresh={() => query.refetch()}
          />

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
        </Card>
      </Space>
    </Show>
  );
}
