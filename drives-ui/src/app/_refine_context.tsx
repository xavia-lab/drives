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
                  name: "procurement",
                  meta: {
                    label: "Procurement",
                    icon: <AccountBookOutlined />,
                  },
                },
                {
                  name: "allocations",
                  list: "/allocations",
                  create: "/allocations/create",
                  edit: "/allocations/edit/:id",
                  show: "/allocations/show/:id",
                  meta: {
                    canDelete: true,
                    label: "Allocations",
                    parent: "procurement",
                    icon: <AlignCenterOutlined />,
                  },
                },
                {
                  name: "purchase-orders",
                  list: "/purchase-orders",
                  create: "/purchase-orders/create",
                  edit: "/purchase-orders/edit/:id",
                  show: "/purchase-orders/show/:id",
                  meta: {
                    canDelete: true,
                    label: "Purchase Orders",
                    parent: "procurement",
                    icon: <BookOutlined />,
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
                    parent: "procurement",
                    icon: <GlobalOutlined />,
                  },
                },
                {
                  name: "stores",
                  meta: {
                    label: "Stores",
                    icon: <DatabaseOutlined />,
                  },
                },
                {
                  name: "locations",
                  list: "/locations",
                  create: "/locations/create",
                  edit: "/locations/edit/:id",
                  show: "/locations/show/:id",
                  meta: {
                    canDelete: true,
                    parent: "stores",
                    icon: <HomeOutlined />,
                  },
                },
                {
                  name: "administration",
                  meta: {
                    label: "Admin", // Optional label for the parent item
                    icon: <SettingOutlined />,
                  },
                },
                {
                  name: "storage",
                  meta: {
                    label: "Storage",
                    parent: "administration",
                    icon: <SettingOutlined />,
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
                    parent: "administration",
                    icon: <SettingOutlined />,
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
                  text: "Emerald System",
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
