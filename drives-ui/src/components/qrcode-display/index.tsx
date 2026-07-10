import { useQRCode } from "@hooks/use-qrcode";

export const QRCodeDisplay = ({
  fileId,
  size = 150,
}: {
  fileId: string;
  size?: number;
}) => {
  const { qrUrl, isLoading } = useQRCode(fileId);

  if (isLoading) return <span>Loading...</span>;
  if (!qrUrl) return <span>-</span>;

  return (
    <img
      src={qrUrl}
      alt="QR Code"
      style={{
        width: size, // Use the dynamic size
        height: size, // Use the dynamic size
        display: "block",
        objectFit: "contain",
      }}
    />
  );
};
