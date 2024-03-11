import { DevtoolsProvider } from "@providers/devtools";
import { Refine } from "@refinedev/core";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";
import { RefineSnackbarProvider, notificationProvider } from "@refinedev/mui";
import routerProvider from "@refinedev/nextjs-router";
import { Metadata } from "next";
import { cookies } from "next/headers";
import React, { Suspense } from "react";

import { ColorModeContextProvider } from "@contexts/color-mode";
import { authProvider } from "@providers/auth-provider";
import { dataProvider } from "@providers/data-provider";

export const metadata: Metadata = {
  title: "Drives",
  description: "An inventory of all storage drives in your care",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = cookies();
  const theme = cookieStore.get("theme");
  const defaultMode = theme?.value === "dark" ? "dark" : "light";

  return (
    <html lang="en">
      <body>
        <Suspense>
          <RefineKbarProvider>
            <ColorModeContextProvider defaultMode={defaultMode}>
              <RefineSnackbarProvider>
                <DevtoolsProvider>
                  <Refine
                    routerProvider={routerProvider}
                    dataProvider={dataProvider}
                    notificationProvider={notificationProvider}
                    authProvider={authProvider}
                    resources={[
                      {
                        name: "drives",
                        list: "/drives",
                        create: "/drives/create",
                        edit: "/drives/edit/:id",
                        show: "/drives/show/:id",
                        meta: {
                          canDelete: true,
                        },
                      },
                      {
                        name: "models",
                        list: "/models",
                        create: "/models/create",
                        edit: "/models/edit/:id",
                        show: "/models/show/:id",
                        meta: {
                          canDelete: true,
                        },
                      },
                      {
                        name: "retailers",
                        list: "/retailers",
                        create: "/retailers/create",
                        edit: "/retailers/edit/:id",
                        show: "/retailers/show/:id",
                        meta: {
                          canDelete: true,
                        },
                      },
                      {
                        name: "manufacturers",
                        list: "/manufacturers",
                        create: "/manufacturers/create",
                        edit: "/manufacturers/edit/:id",
                        show: "/manufacturers/show/:id",
                        meta: {
                          canDelete: true,
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
                        },
                      },
                      {
                        name: "storageTypes",
                        list: "/storage-types",
                        create: "/storage-types/create",
                        edit: "/storage-types/edit/:id",
                        show: "/storage-types/show/:id",
                        meta: {
                          canDelete: true,
                        },
                      },
                    ]}
                    options={{
                      syncWithLocation: true,
                      warnWhenUnsavedChanges: true,
                      useNewQueryKeys: true,
                      projectId: "jqvtYi-SUFuft-9xwusI",
                    }}
                  >
                    {children}
                    <RefineKbar />
                  </Refine>
                </DevtoolsProvider>
              </RefineSnackbarProvider>
            </ColorModeContextProvider>
          </RefineKbarProvider>
        </Suspense>
      </body>
    </html>
  );
}
