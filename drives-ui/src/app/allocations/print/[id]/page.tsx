"use client";

import { useShow } from "@refinedev/core";
import { Typography, Button, Space, Divider, Breadcrumb } from "antd";
import { useParams } from "next/navigation";
import { QRCodeDisplay } from "@components/qrcode-display";
import { useEffect, useState, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import Link from "next/link";
import { DownloadOutlined, PrinterOutlined } from "@ant-design/icons";
import { useExportProductCSV } from "@allocations/hooks/use-export-products-csv";

const { Title } = Typography;

export default function AllocationPrint() {
  const params = useParams();
  const allocationId = params.id;

  const { exportCSV, isExporting } = useExportProductCSV();
  const [sortedProducts, setSortedProducts] = useState<any[]>([]);

  const { query } = useShow({
    resource: "allocations",
    id: allocationId as string,
  });

  const { data, isLoading } = query;
  const record = data?.data;

  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Labels for Allocation ${record?.id || ""}`,
    pageStyle: `
    @page {
      size: 24mm 22mm;
      margin: 0;
    }
    @media print {
      body {
        margin: 0;
        padding: 0;
      }
      .label-preview {
        border: none !important;
        page-break-after: always;
        width: 24mm !important;
        height: 22mm !important;
        overflow: hidden;
        display: flex !important;
        flex-direction: column !important;
      }
    }
  `,
  });

  useEffect(() => {
    if (record?.products) {
      const sorted = [...record.products].sort(
        (a, b) => a.allocationSequence - b.allocationSequence,
      );
      setSortedProducts(sorted);
    }
  }, [record]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!record) {
    return <div>No allocation found.</div>;
  }

  return (
    <Space
      direction="vertical"
      size="large"
      style={{ width: "100%", padding: "20px" }}
    >
      <Breadcrumb>
        <Breadcrumb.Item>
          <Link href="/">Home</Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <Link href="/allocations">Allocations</Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <Link href={`/allocations/show/${allocationId}`}>
            Allocation #{record.id}
          </Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>Print Labels</Breadcrumb.Item>
      </Breadcrumb>
      <Title level={2}>Print Labels for Allocation {record.id}</Title>
      <Space>
        <Button icon={<PrinterOutlined />} type="primary" onClick={handlePrint}>
          Print Labels
        </Button>

        <Button
          icon={<DownloadOutlined />}
          loading={isExporting}
          onClick={() =>
            exportCSV(sortedProducts, `${record?.alNumber}_product_labels.csv`)
          }
        >
          Export Labels
        </Button>

        <Link href={`/allocations/show/${allocationId}`}>
          <Button>Return to Show</Button>
        </Link>
        <Link href="/allocations">
          <Button>List Allocations</Button>
        </Link>
      </Space>
      <Divider />
      <Title level={4}>Preview</Title>
      <div ref={componentRef}>
        {sortedProducts.map((product: any) => {
          const qrMedia = product.media?.find((m: any) => m.sortOrder === 999);
          const qrFileId = qrMedia?.fileId;
          const labelData = product.labelData;

          return (
            <div
              key={product.id}
              className="label-preview"
              style={{
                width: "24mm",
                height: "22mm",
                border: "1px solid #ddd", // Visible for preview
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "start",
                padding: "1mm",
                marginBottom: "5mm", // Space for preview only
                fontSize: "4pt", // Reduced size to fit tiny label
                fontFamily: "Arial, sans-serif",
                overflow: "hidden",
                boxSizing: "border-box",
                textAlign: "center",
              }}
            >
              {/* Top Half: QR Code */}
              <div
                style={{
                  height: "11mm",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                }}
              >
                {qrFileId && <QRCodeDisplay fileId={qrFileId} size={35} />}
              </div>

              {/* Bottom Half: Text Data */}
              <div
                style={{
                  height: "11mm",
                  width: "100%",
                  lineHeight: "1.2",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <div style={{ overflow: "hidden", whiteSpace: "nowrap" }}>
                  <strong>SKU:</strong> {labelData?.sku}
                </div>
                <div style={{ overflow: "hidden", whiteSpace: "nowrap" }}>
                  <strong>Weight:</strong> {labelData?.weight}{" "}
                  {labelData?.weightUnit}
                </div>
                <div style={{ overflow: "hidden", whiteSpace: "nowrap" }}>
                  <strong>Material:</strong> {labelData?.material}
                  {" | "}
                  {labelData?.moniker}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Space>
  );
}
