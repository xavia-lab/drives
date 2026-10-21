import { Header } from "@components/header";
import { ThemedLayout } from "@refinedev/antd";
import React from "react";
import { Footer } from "@components/footer";
import { ResourceRouteGuard } from "@components/resource-route-guard";

export default function Layout({ children }: React.PropsWithChildren) {
  return (
    <ThemedLayout Header={Header} Footer={Footer}>
      <ResourceRouteGuard>{children}</ResourceRouteGuard>
    </ThemedLayout>
  );
}
