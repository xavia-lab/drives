import authOptions from "@app/api/auth/[...nextauth]/options";
import { Header } from "@components/header";
import { Footer } from "@components/footer";
import { ThemedLayout } from "@refinedev/antd";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import React from "react";

export default async function Layout({ children }: React.PropsWithChildren) {
  const data = await getData();

  if (!data.session?.user) {
    return redirect("/login");
  }

  return (
    <ThemedLayout Header={Header} Footer={Footer}>
      {children}
    </ThemedLayout>
  );
}

async function getData() {
  const session = await getServerSession(authOptions);
  return {
    session,
  };
}
