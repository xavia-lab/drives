import React from "react";
import { Tag, Space, Typography } from "antd";

const { Text } = Typography;

interface MetadataTagsProps {
  metadata?: Record<string, any>;
  /** Optional: override specific keys with fixed colors */
  colorOverrides?: Record<string, string>;
}

const PRESET_COLORS = [
  "magenta",
  "red",
  "volcano",
  "orange",
  "gold",
  "lime",
  "green",
  "cyan",
  "blue",
  "geekblue",
  "purple",
];

export const MetadataTags: React.FC<MetadataTagsProps> = ({
  metadata,
  colorOverrides = {},
}) => {
  if (!metadata || Object.keys(metadata).length === 0) {
    return <Text type="secondary">-</Text>;
  }

  const getTagColor = (key: string) => {
    const normalizedKey = key.toLowerCase();
    // 1. Check manual overrides
    if (colorOverrides[normalizedKey]) return colorOverrides[normalizedKey];

    // 2. Fallback to deterministic random color
    const charSum = key
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return PRESET_COLORS[charSum % PRESET_COLORS.length];
  };

  const formatKey = (key: string) => {
    // Converts camelCase or snake_case to "Title Case"
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/_/g, " ")
      .trim()
      .replace(/^\w/, (c) => c.toUpperCase());
  };

  return (
    <Space wrap>
      {Object.entries(metadata).map(([key, value]) => (
        <Tag key={key} color={getTagColor(key)} style={{ borderRadius: "4px" }}>
          <span style={{ fontWeight: 600 }}>{formatKey(key)}:</span>{" "}
          {String(value)}
        </Tag>
      ))}
    </Space>
  );
};
