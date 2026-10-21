"use client";

import { useApiUrl, useCustom } from "@refinedev/core";
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Row,
  Space,
  Spin,
  Tag,
  Typography,
  theme,
} from "antd";
import {
  PaperClipOutlined,
  ReloadOutlined,
  StarFilled,
} from "@ant-design/icons";
import { MediaDisplay } from "@components/media-display";

const { Text } = Typography;

type DriveMedia = {
  id: string;
  displayKey: number;
  attachmentType: string;
  isPrimary: boolean;
  sortOrder: number;
  notes: string | null;
  mediaId: string;
  media?: {
    id: string;
    fileId: string;
    fileName: string | null;
    mimeType: string | null;
    fileSize: number | null;
    mediaType: string;
  } | null;
};

const ATTACHMENT_COLORS: Record<string, string> = {
  PICTURE: "blue",
  INVOICE: "gold",
  DOCUMENT: "geekblue",
  CERTIFICATE: "purple",
  OTHER: "default",
};

const formatFileSize = (bytes?: number | null): string => {
  if (!bytes) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const PhysicalDriveMediaCard = ({ driveId }: { driveId?: string }) => {
  const { token } = theme.useToken();
  const apiUrl = useApiUrl();
  const { query, result } = useCustom({
    url: `${apiUrl}/physical-drives/${driveId}/media`,
    method: "get",
    queryOptions: { enabled: Boolean(driveId) },
  });

  const attachments = Array.isArray(result?.data)
    ? (result.data as DriveMedia[])
    : [];

  return (
    <Card
      title={
        <Space>
          <PaperClipOutlined />
          <span>Media & Documents</span>
          {attachments.length > 0 ? (
            <Tag style={{ marginInlineStart: 4 }}>{attachments.length}</Tag>
          ) : null}
        </Space>
      }
      extra={
        query.isError ? (
          <Button
            size="small"
            icon={<ReloadOutlined />}
            onClick={() => query.refetch()}
          >
            Retry
          </Button>
        ) : undefined
      }
      style={{
        borderRadius: token.borderRadiusLG,
        borderColor: token.colorBorderSecondary,
      }}
    >
      {query.isLoading ? (
        <Spin />
      ) : query.isError ? (
        <Alert
          type="error"
          showIcon
          message="Could not load attached media"
          description="The drive media request failed. Check the API and try again."
        />
      ) : attachments.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No files attached to this drive"
        />
      ) : (
        <Row gutter={[16, 16]}>
          {attachments.map((attachment) => (
            <Col xs={24} md={12} xl={8} key={attachment.id}>
              <Card
                size="small"
                style={{ height: "100%" }}
                cover={
                  attachment.media?.fileId ? (
                    <div
                      style={{
                        height: 180,
                        overflow: "hidden",
                        background: token.colorFillQuaternary,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <MediaDisplay
                        fileId={attachment.media.fileId}
                        width="100%"
                        height={180}
                      />
                    </div>
                  ) : (
                    <div
                      style={{
                        height: 180,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: token.colorFillQuaternary,
                      }}
                    >
                      <Text type="secondary">Media unavailable</Text>
                    </div>
                  )
                }
              >
                <Space direction="vertical" size={6} style={{ display: "flex" }}>
                  <Space size={6} wrap>
                    <Tag
                      color={
                        ATTACHMENT_COLORS[attachment.attachmentType] ?? "default"
                      }
                    >
                      {attachment.attachmentType}
                    </Tag>
                    {attachment.isPrimary ? (
                      <Tag color="gold" icon={<StarFilled />}>
                        Primary
                      </Tag>
                    ) : null}
                  </Space>
                  <Text strong ellipsis>
                    {attachment.media?.fileName ??
                      attachment.media?.fileId ??
                      "Unknown file"}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {attachment.media?.mimeType ?? "Unknown type"} ·{" "}
                    {formatFileSize(attachment.media?.fileSize)}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {attachment.notes || "No notes"}
                  </Text>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Card>
  );
};
