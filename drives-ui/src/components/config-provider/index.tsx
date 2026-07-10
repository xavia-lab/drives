"use client";
import { createContext, useContext } from "react";
import { getPublicConfig } from "@utils/config";

const ConfigContext = createContext<ReturnType<typeof getPublicConfig> | null>(
  null,
);

export function ConfigProvider({
  config,
  children,
}: {
  config: any;
  children: React.ReactNode;
}) {
  return (
    <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>
  );
}

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) throw new Error("useConfig must be used within ConfigProvider");
  return context;
};
