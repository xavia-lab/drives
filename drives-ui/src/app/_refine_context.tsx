"use client";

import { App as AntdApp, theme } from "antd";
import { useNotificationProvider } from "@refinedev/antd";
import { Refine } from "@refinedev/core";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";
import { SessionProvider, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import React from "react";
import { HardDrive } from "lucide-react";

import routerProvider from "@refinedev/nextjs-router";

import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ColorModeContextProvider } from "@contexts/color-mode";
import { dataProvider } from "@providers/data-provider";
import { auditLogProvider } from "@providers/audit-log-provider";
import "@refinedev/antd/dist/reset.css";
import {
  ApiOutlined,
  AppstoreOutlined,
  ApartmentOutlined,
  BankOutlined,
  BookOutlined,
  BorderOutlined,
  BoxPlotOutlined,
  CheckCircleOutlined,
  CloudOutlined,
  CloudServerOutlined,
  ClusterOutlined,
  CodeOutlined,
  ContainerOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  DeploymentUnitOutlined,
  DesktopOutlined,
  FileProtectOutlined,
  FolderOutlined,
  GlobalOutlined,
  GoldOutlined,
  HddOutlined,
  HistoryOutlined,
  LayoutOutlined,
  LinkOutlined,
  MonitorOutlined,
  NumberOutlined,
  PoundOutlined,
  ProjectOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  ShopOutlined,
  TagsOutlined,
  ThunderboltOutlined,
  ToolOutlined,
} from "@ant-design/icons";
import { createAuthProvider } from "@providers/auth-provider";
import { createAccessControlProvider } from "@providers/access-control-provider";

const { useToken } = theme;

type RefineContextProps = {
  defaultMode?: string;
  defaultPrimaryColor?: string;
};

const AppLogo = () => {
  const { token } = useToken();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <HardDrive size={24} color={token.colorPrimary} strokeWidth={2} />
    </div>
  );
};

export const RefineContext = (
  props: React.PropsWithChildren<RefineContextProps>,
) => {
  return (
    <SessionProvider>
      <AntdApp>
        <App {...props} />
      </AntdApp>
    </SessionProvider>
  );
};

type AppProps = {
  defaultMode?: string;
  defaultPrimaryColor?: string;
};

const App = (props: React.PropsWithChildren<AppProps>) => {
  const { data, status } = useSession();
  const to = usePathname();

  if (status === "loading") {
    return <span>loading...</span>;
  }

  // Create providers with current state
  const authProvider = createAuthProvider(to);
  const accessControlProvider = createAccessControlProvider();

  const { defaultMode, defaultPrimaryColor } = props;

  return (
    <>
      <RefineKbarProvider>
        <AntdRegistry>
          <ColorModeContextProvider
            defaultMode={defaultMode}
            defaultPrimaryColor={defaultPrimaryColor}
          >
            <Refine
              routerProvider={routerProvider}
              dataProvider={dataProvider}
              notificationProvider={useNotificationProvider}
              authProvider={authProvider}
              accessControlProvider={accessControlProvider}
              auditLogProvider={auditLogProvider}
              resources={[
                {
                  name: "dashboard",
                  list: "/dashboard",
                  meta: {
                    label: "Dashboard",
                    icon: <DashboardOutlined />,
                  },
                },
                {
                  name: "warranty",
                  meta: {
                    label: "Warranty",
                    icon: <SafetyCertificateOutlined />,
                  },
                },
                {
                  name: "warranty-claims",
                  list: "/warranty-claims",
                  create: "/warranty-claims/create",
                  edit: "/warranty-claims/edit/:id",
                  show: "/warranty-claims/show/:id",
                  meta: {
                    canDelete: true,
                    label: "Claims",
                    parent: "warranty",
                    icon: <FileProtectOutlined />,
                  },
                },
                {
                  name: "storage",
                  meta: {
                    label: "Storage",
                    icon: <AppstoreOutlined />,
                  },
                },
                {
                  name: "storage-pools",
                  list: "/storage-pools",
                  create: "/storage-pools/create",
                  edit: "/storage-pools/edit/:id",
                  show: "/storage-pools/show/:id",
                  meta: {
                    canDelete: true,
                    label: "Storage Pools",
                    parent: "storage",
                    icon: <ContainerOutlined />,
                  },
                },
                {
                  name: "pool-types",
                  list: "/pool-types",
                  create: "/pool-types/create",
                  edit: "/pool-types/edit/:id",
                  show: "/pool-types/show/:id",
                  meta: {
                    canDelete: true,
                    label: "Pool Types",
                    parent: "storage",
                    icon: <TagsOutlined />,
                  },
                },
                {
                  name: "infrastructure",
                  meta: {
                    label: "Infrastructure",
                    icon: <ClusterOutlined />,
                  },
                },
                {
                  name: "virtual",
                  meta: {
                    label: "Virtual",
                    parent: "infrastructure",
                    icon: <CloudOutlined />,
                  },
                },
                {
                  name: "virtual-servers",
                  list: "/virtual-servers",
                  create: "/virtual-servers/create",
                  edit: "/virtual-servers/edit/:id",
                  show: "/virtual-servers/show/:id",
                  meta: {
                    canDelete: true,
                    label: "Servers",
                    parent: "virtual",
                    icon: <CloudServerOutlined />,
                  },
                },
                {
                  name: "physical",
                  meta: {
                    label: "Physical",
                    parent: "infrastructure",
                    icon: <ApartmentOutlined />,
                  },
                },
                {
                  name: "physical-servers",
                  list: "/physical-servers",
                  create: "/physical-servers/create",
                  edit: "/physical-servers/edit/:id",
                  show: "/physical-servers/show/:id",
                  meta: {
                    canDelete: true,
                    label: "Servers",
                    parent: "physical",
                    icon: <DatabaseOutlined />,
                  },
                },
                {
                  name: "racks",
                  list: "/racks",
                  create: "/racks/create",
                  edit: "/racks/edit/:id",
                  show: "/racks/show/:id",
                  meta: {
                    canDelete: true,
                    label: "Racks",
                    parent: "physical",
                    icon: <LayoutOutlined />,
                  },
                },
                {
                  name: "datacenters",
                  list: "/datacenters",
                  create: "/datacenters/create",
                  edit: "/datacenters/edit/:id",
                  show: "/datacenters/show/:id",
                  meta: {
                    canDelete: true,
                    label: "Datacenters",
                    parent: "physical",
                    icon: <BankOutlined />,
                  },
                },
                {
                  name: "software",
                  meta: {
                    label: "Software",
                    icon: <CodeOutlined />,
                  },
                },
                {
                  name: "operating-systems",
                  list: "/operating-systems",
                  create: "/operating-systems/create",
                  edit: "/operating-systems/edit/:id",
                  show: "/operating-systems/show/:id",
                  meta: {
                    canDelete: true,
                    label: "Operating Systems",
                    parent: "software",
                    icon: <DesktopOutlined />,
                  },
                },
                {
                  name: "hardware",
                  meta: {
                    label: "Hardware",
                    icon: <ToolOutlined />,
                  },
                },
                {
                  name: "physical-drives",
                  list: "/physical-drives",
                  create: "/physical-drives/create",
                  edit: "/physical-drives/edit/:id",
                  show: "/physical-drives/show/:id",
                  meta: {
                    canDelete: true,
                    label: "Physical Drives",
                    parent: "hardware",
                    icon: <HddOutlined />,
                  },
                },
                {
                  name: "physical-cpus",
                  list: "/physical-cpus",
                  create: "/physical-cpus/create",
                  edit: "/physical-cpus/edit/:id",
                  show: "/physical-cpus/show/:id",
                  meta: {
                    canDelete: true,
                    label: "Physical CPUs",
                    parent: "hardware",
                    icon: <DeploymentUnitOutlined />,
                  },
                },
                {
                  name: "reference",
                  meta: {
                    label: "Reference",
                    icon: <BookOutlined />,
                  },
                },
                {
                  name: "reference-hardware",
                  meta: {
                    label: "Hardware",
                    parent: "reference",
                    icon: <ProjectOutlined />,
                  },
                },
                {
                  name: "cpu-models",
                  list: "/cpu-models",
                  create: "/cpu-models/create",
                  edit: "/cpu-models/edit/:id",
                  show: "/cpu-models/show/:id",
                  meta: {
                    canDelete: true,
                    label: "CPU Models",
                    parent: "reference-hardware",
                    icon: <ThunderboltOutlined />,
                  },
                },
                {
                  name: "reference-storage",
                  meta: {
                    label: "Storage",
                    parent: "reference",
                    icon: <FolderOutlined />,
                  },
                },
                {
                  name: "drive-models",
                  list: "/drive-models",
                  create: "/drive-models/create",
                  edit: "/drive-models/edit/:id",
                  show: "/drive-models/show/:id",
                  meta: {
                    canDelete: true,
                    label: "Drive Models",
                    parent: "reference-storage",
                    icon: <GoldOutlined />,
                  },
                },
                {
                  name: "capacities",
                  list: "/capacities",
                  create: "/capacities/create",
                  edit: "/capacities/edit/:id",
                  show: "/capacities/show/:id",
                  meta: {
                    canDelete: true,
                    parent: "reference-storage",
                    icon: <NumberOutlined />,
                  },
                },
                {
                  name: "interfaces",
                  list: "/interfaces",
                  create: "/interfaces/create",
                  edit: "/interfaces/edit/:id",
                  show: "/interfaces/show/:id",
                  meta: {
                    canDelete: true,
                    parent: "reference-storage",
                    icon: <ApiOutlined />,
                  },
                },
                {
                  name: "form-factors",
                  list: "/form-factors",
                  create: "/form-factors/create",
                  edit: "/form-factors/edit/:id",
                  show: "/form-factors/show/:id",
                  meta: {
                    canDelete: true,
                    label: "Form Factors",
                    parent: "reference-storage",
                    icon: <BorderOutlined />,
                  },
                },
                {
                  name: "bus-protocols",
                  list: "/bus-protocols",
                  create: "/bus-protocols/create",
                  edit: "/bus-protocols/edit/:id",
                  show: "/bus-protocols/show/:id",
                  meta: {
                    canDelete: true,
                    label: "Bus Protocols",
                    parent: "reference-storage",
                    icon: <LinkOutlined />,
                  },
                },
                {
                  name: "storage-types",
                  list: "/storage-types",
                  create: "/storage-types/create",
                  edit: "/storage-types/edit/:id",
                  show: "/storage-types/show/:id",
                  meta: {
                    canDelete: true,
                    label: "Storage Types",
                    parent: "reference-storage",
                    icon: <BoxPlotOutlined />,
                  },
                },
                {
                  name: "reference-general",
                  meta: {
                    label: "General",
                    parent: "reference",
                    icon: <SettingOutlined />,
                  },
                },
                {
                  name: "vendors",
                  list: "/vendors",
                  create: "/vendors/create",
                  edit: "/vendors/edit/:id",
                  show: "/vendors/show/:id",
                  meta: {
                    canDelete: true,
                    parent: "reference-general",
                    icon: <ShopOutlined />,
                  },
                },
                {
                  name: "countries",
                  list: "/countries",
                  create: "/countries/create",
                  edit: "/countries/edit/:id",
                  show: "/countries/show/:id",
                  meta: {
                    canDelete: true,
                    label: "Countries",
                    parent: "reference-general",
                    icon: <GlobalOutlined />,
                  },
                },
                {
                  name: "currencies",
                  list: "/currencies",
                  create: "/currencies/create",
                  edit: "/currencies/edit/:id",
                  show: "/currencies/show/:id",
                  meta: {
                    canDelete: true,
                    parent: "reference-general",
                    icon: <PoundOutlined />,
                  },
                },
                {
                  name: "system",
                  meta: {
                    label: "System",
                    icon: <MonitorOutlined />,
                  },
                },
                {
                  name: "status",
                  list: "/system/status", // This matches the folder path we created
                  meta: {
                    label: "Status",
                    parent: "system", // Nest it under Admin or remove to keep it top-level
                    icon: <CheckCircleOutlined />,
                  },
                },
                {
                  name: "audit-logs",
                  list: "/audit-logs",
                  meta: {
                    label: "Audit Logs",
                    parent: "system",
                    icon: <HistoryOutlined />,
                  },
                },
              ]}
              options={{
                syncWithLocation: true,
                warnWhenUnsavedChanges: true,
                title: {
                  icon: <AppLogo />,
                  text: "Drives System",
                },
                disableTelemetry: true,
              }}
            >
              {props.children}
              <RefineKbar />
            </Refine>
          </ColorModeContextProvider>
        </AntdRegistry>
      </RefineKbarProvider>
    </>
  );
};
