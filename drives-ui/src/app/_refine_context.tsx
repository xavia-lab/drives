"use client";

import { App as AntdApp } from "antd";
import { useNotificationProvider } from "@refinedev/antd";
import { Refine } from "@refinedev/core";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";
import { SessionProvider, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import React from "react";
import { Gem } from "lucide-react";

import routerProvider from "@refinedev/nextjs-router";

import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ColorModeContextProvider } from "@contexts/color-mode";
import { dataProvider } from "@providers/data-provider";
import "@refinedev/antd/dist/reset.css";
import {
  AccountBookOutlined,
  AlignCenterOutlined,
  BarChartOutlined,
  BookOutlined,
  BoxPlotOutlined,
  CheckCircleOutlined,
  CloudSyncOutlined,
  DashboardOutlined,
  DashboardTwoTone,
  DatabaseOutlined,
  DeploymentUnitOutlined,
  GlobalOutlined,
  GoldOutlined,
  HomeOutlined,
  PoundOutlined,
  ProductOutlined,
  ReadOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { createAuthProvider } from "@providers/auth-provider";
import { createAccessControlProvider } from "@providers/access-control-provider";

type RefineContextProps = {
  defaultMode?: string;
};

const EmeraldLogo = () => (
  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
    <Gem size={24} color="#50C878" fill="#50C878" fillOpacity={0.2} />
  </div>
);

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

  const defaultMode = props?.defaultMode;

  return (
    <>
      <RefineKbarProvider>
        <AntdRegistry>
          <ColorModeContextProvider defaultMode={defaultMode}>
            <Refine
              routerProvider={routerProvider}
              dataProvider={dataProvider}
              notificationProvider={useNotificationProvider}
              authProvider={authProvider}
              accessControlProvider={accessControlProvider}
              resources={[
                {
                  name: "dashboard",
                  meta: {
                    label: "Dashboard",
                    icon: <DashboardTwoTone />,
                  },
                },
                {
                  name: "dashboard-main",
                  list: "/dashboard-main",
                  meta: {
                    label: "Main",
                    parent: "dashboard",
                    icon: <DashboardOutlined />,
                  },
                },
                {
                  name: "inventory",
                  meta: {
                    label: "Inventory",
                    icon: <BarChartOutlined />,
                  },
                },
                {
                  name: "products",
                  list: "/products",
                  create: "/products/create",
                  edit: "/products/edit/:id",
                  show: "/products/show/:id",
                  meta: {
                    canDelete: true,
                    label: "Products",
                    parent: "inventory",
                    icon: <ProductOutlined />,
                    publicShow: "/products/public-show/:id",
                  },
                },
                {
                  name: "infrastructure",
                  meta: {
                    label: "Infrastructure",
                    icon: <AccountBookOutlined />,
                  },
                },
                {
                  name: "physical",
                  meta: {
                    label: "Physical",
                    parent: "infrastructure",
                    icon: <AccountBookOutlined />,
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
                    label: "Physical Servers",
                    parent: "physical",
                    icon: <AlignCenterOutlined />,
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
                    icon: <AlignCenterOutlined />,
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
                    icon: <AlignCenterOutlined />,
                  },
                },
                {
                  name: "software",
                  meta: {
                    label: "Software",
                    icon: <SettingOutlined />,
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
                    icon: <GlobalOutlined />,
                  },
                },
                {
                  name: "hardware",
                  meta: {
                    label: "Hardware",
                    icon: <SettingOutlined />,
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
                    icon: <DeploymentUnitOutlined />,
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
                    parent: "hardware",
                    icon: <DeploymentUnitOutlined />,
                  },
                },
                {
                  name: "storage",
                  meta: {
                    label: "Storage",
                    icon: <SettingOutlined />,
                  },
                },
                {
                  name: "storage-models",
                  list: "/storage-models",
                  create: "/storage-models/create",
                  edit: "/storage-models/edit/:id",
                  show: "/storage-models/show/:id",
                  meta: {
                    canDelete: true,
                    label: "Storage Models",
                    parent: "storage",
                    icon: <BarChartOutlined />,
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
                    parent: "storage",
                    icon: <BarChartOutlined />,
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
                    parent: "storage",
                    icon: <CloudSyncOutlined />,
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
                    parent: "storage",
                    icon: <GoldOutlined />,
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
                    parent: "storage",
                    icon: <ReadOutlined />,
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
                    parent: "storage",
                    icon: <BoxPlotOutlined />,
                  },
                },
                {
                  name: "general",
                  meta: {
                    label: "General",
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
                    parent: "general",
                    icon: <GlobalOutlined />,
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
                    parent: "general",
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
                    parent: "general",
                    icon: <PoundOutlined />,
                  },
                },
                {
                  name: "system",
                  meta: {
                    label: "System",
                    icon: <GlobalOutlined />,
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
              ]}
              options={{
                syncWithLocation: true,
                warnWhenUnsavedChanges: true,
                title: {
                  icon: <EmeraldLogo />,
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
