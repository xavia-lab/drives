import { Image } from "antd";
import { useMedia } from "@hooks/use-media";

interface MediaDisplayProps {
  fileId: string;
  width?: number | string;
  height?: number | string;
  controls?: boolean; // For videos
}

export const MediaDisplay = ({
  fileId,
  width = "100%",
  height = "auto",
  controls = true,
}: MediaDisplayProps) => {
  const { url, mimeType, isLoading, isError } = useMedia(fileId);

  if (isLoading) return <span>Loading media...</span>;
  if (isError || !url) return <span>Error loading media</span>;

  // 1. Handle Images with Lightbox
  if (mimeType?.startsWith("image/")) {
    return (
      <Image
        src={url}
        alt="Media Content"
        width={width}
        height={height}
        style={{ objectFit: "contain", display: "block" }}
        // The preview prop enables the lightbox/modal feature
        preview={{
          mask: <div style={{ fontSize: "12px" }}>Click to Preview</div>,
        }}
      />
    );
  }

  // 2. Handle Videos (Videos don't natively use AntD Lightbox,
  // they usually play in-place or require a custom Modal)
  if (mimeType?.startsWith("video/")) {
    return (
      <video
        src={url}
        controls={controls}
        style={{ width, height, display: "block" }}
      >
        Your browser does not support the video tag.
      </video>
    );
  }

  return (
    <a href={url} target="_blank" rel="noreferrer">
      View File ({mimeType || "Unknown Type"})
    </a>
  );
};
