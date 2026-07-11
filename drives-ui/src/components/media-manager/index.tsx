import React from "react";
import { Upload, Button, Image, App } from "antd";
import { PlusOutlined, StarFilled, StarOutlined } from "@ant-design/icons";
import { BinaryService } from "@providers/binary-data-provider";
import { MediaDisplay } from "@components/media-display";
import { useDataProvider } from "@refinedev/core";
import { UploadFileStatus } from "antd/lib/upload/interface";

interface MediaManagerProps {
  productId: number;
  media: any[];
  onRefresh: () => void;
}

interface AntDOriginNode extends React.ReactElement {
  props: {
    children: any[];
    [key: string]: any;
  };
}

export const MediaManager: React.FC<MediaManagerProps> = ({
  productId,
  media,
  onRefresh,
}) => {
  const { message } = App.useApp();

  const dataProvider = useDataProvider();
  const apiUrl = dataProvider().getApiUrl?.() || "";

  // Map backend media to AntD Upload file format
  const fileList = media?.map((m) => ({
    uid: String(m.id),
    id: m.id,
    name: m.fileName,
    status: "done" as UploadFileStatus,
    isPrimary: m.isPrimary,
    fileId: m.fileId,
  }));

  const handleUpload = async ({ file, onSuccess, onError }: any) => {
    try {
      await BinaryService.upload(`${apiUrl}/products/${productId}/media`, [
        file,
      ]);
      message.success("Upload successful");
      onSuccess?.("ok");
      onRefresh();
    } catch (err) {
      message.error("Upload failed");
      onError?.(err);
    }
  };

  const handleRemove = async (file: any) => {
    try {
      await BinaryService.delete(`${apiUrl}/products/media/${file.id}`);
      message.success("Media removed");
      onRefresh();
    } catch (err) {
      message.error("Delete failed");
    }
  };

  const handleSetPrimary = async (e: React.MouseEvent, mediaId: number) => {
    e.stopPropagation();
    try {
      await BinaryService.setPrimary(
        `${apiUrl}/products/${productId}/media/${mediaId}/primary`,
      );
      message.success("Primary image updated");
      onRefresh();
    } catch (err) {
      message.error("Failed to set primary");
    }
  };

  return (
    <Image.PreviewGroup>
      <Upload
        listType="picture-card"
        multiple={true}
        fileList={fileList}
        customRequest={handleUpload}
        onRemove={handleRemove}
        itemRender={(originNode, file: any) => {
          if (file.status !== "done") return originNode;

          const originElement = originNode as AntDOriginNode;
          // Extract original mask (Eye/Trash icons)
          const actions = originElement.props.children?.find((c: any) =>
            c?.props?.className?.includes("actions"),
          );

          return (
            <div
              className="ant-upload-list-item-container"
              style={{ position: "relative" }}
            >
              <Button
                size="small"
                shape="circle"
                type={file.isPrimary ? "primary" : "default"}
                icon={file.isPrimary ? <StarFilled /> : <StarOutlined />}
                style={{
                  position: "absolute",
                  top: 8,
                  left: 8,
                  zIndex: 10,
                  boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                }}
                onClick={(e) => handleSetPrimary(e, file.id)}
              />
              <div className="ant-upload-list-item ant-upload-list-item-done">
                <div
                  style={{ width: "100%", height: "100%", overflow: "hidden" }}
                >
                  <MediaDisplay
                    fileId={file.fileId}
                    width="100%"
                    height="100%"
                  />
                </div>
                <span className="ant-upload-list-item-actions">{actions}</span>
              </div>
            </div>
          );
        }}
      >
        <div>
          <PlusOutlined />
          <div style={{ marginTop: 8 }}>Upload</div>
        </div>
      </Upload>
    </Image.PreviewGroup>
  );
};
