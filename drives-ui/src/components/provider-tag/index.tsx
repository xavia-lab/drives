import { EnumTag } from "@components/enum-tag";

const PROVIDER_OPTIONS = [
  { label: "System", value: "system" },
  { label: "User", value: "user" },
];

const providerColorMap = {
  system: "blue",
  user: "green",
};

export const ProviderTag = ({ managed }: { managed?: boolean }) => {
  // Convert boolean to a string value that matches our options
  const providerValue = managed ? "system" : "user";

  return (
    <EnumTag
      value={providerValue}
      options={PROVIDER_OPTIONS}
      colorMap={providerColorMap}
      tooltipPrefix="Provider"
    />
  );
};
