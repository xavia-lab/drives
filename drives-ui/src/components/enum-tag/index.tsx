import { Tag, Tooltip } from "antd";

interface EnumTagProps<T extends string> {
  value: T;
  options: { label: string; value: T }[];
  colorMap: Record<T | string, string>;
  tooltipPrefix?: string;
}

export const EnumTag = <T extends string>({
  value,
  options,
  colorMap,
  tooltipPrefix = "Type",
}: EnumTagProps<T>) => {
  const item = options.find((opt) => opt.value === value);
  const label = item ? item.label : value;
  const color = colorMap[value] || "default";

  return (
    <Tooltip title={`${tooltipPrefix}: ${label}`}>
      <Tag color={color} style={{ cursor: "pointer" }}>
        {label}
      </Tag>
    </Tooltip>
  );
};
