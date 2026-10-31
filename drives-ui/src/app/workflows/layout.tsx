import authOptions from "@app/api/auth/[...nextauth]/options";
import { Header } from "@components/header";
import { ThemedLayout } from "@refinedev/antd";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import React from "react";
import { Footer } from "@components/footer";
import { AppSider } from "@components/app-sider";
import { WorkflowAccessGuard } from "@components/workflow";

export default async function Layout({ children }: React.PropsWithChildren) {
  const data = await getData();

  if (!data.session?.user || data.session.error) {
    return redirect("/login");
  }

  return (
    <ThemedLayout Header={Header} Footer={Footer} Sider={AppSider}>
      <WorkflowAccessGuard>{children}</WorkflowAccessGuard>
    </ThemedLayout>
  );
}

async function getData() {
  const session = await getServerSession(authOptions);
  return {
    session,
  };
}
