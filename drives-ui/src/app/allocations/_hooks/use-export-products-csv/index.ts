import { useState } from "react";
import { useDataProvider } from "@refinedev/core";
import { App } from "antd";

export const useExportProductCSV = () => {
  const [isExporting, setIsExporting] = useState(false);
  const dataProvider = useDataProvider();
  const API_URL = dataProvider().getApiUrl?.() || "";

  // Use Ant Design App hook for context-aware messages
  const { message } = App.useApp();

  const exportCSV = async (
    products: any[],
    fileName: string = "export.csv",
  ) => {
    if (!products?.length) {
      message.warning("No products to export");
      return;
    }

    setIsExporting(true);
    try {
      const csvRows = [];
      const headers = [
        "Sequence",
        "SKU",
        "Weight",
        "Unit",
        "Size",
        "Material",
        "Moniker",
        "Source URL",
      ];
      csvRows.push(headers.join(","));

      // Fetch sourceUrls in parallel using the dataProvider's custom method
      const rowPromises = products.map(async (product) => {
        const { data } = await dataProvider().custom!({
          url: `${API_URL}/qr-resolver/lookup`,
          method: "get",
          query: {
            resourceType: "products",
            resourceId: product.id,
          },
        });

        const label = product.labelData;
        return [
          `"${product?.allocationSequence ?? ""}"`,
          `"${label?.sku ?? ""}"`,
          `"${label?.weight != null ? Number(label.weight).toFixed(2) : ""}"`,
          `"${label?.weightUnit ?? ""}"`,
          `"${label?.size ?? 0}"`,
          `"${label?.material ?? ""}"`,
          `"${label?.moniker ?? ""}"`,
          `"${data?.sourceUrl ?? ""}"`,
        ].join(",");
      });

      const rows = await Promise.all(rowPromises);
      const csvContent = csvRows.concat(rows).join("\n");

      // Trigger Download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      message.success("CSV Exported successfully");
    } catch (error) {
      console.error("Export error:", error);
      message.error("Failed to generate CSV");
    } finally {
      setIsExporting(false);
    }
  };

  return { exportCSV, isExporting };
};
