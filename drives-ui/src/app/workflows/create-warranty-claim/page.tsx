"use client";

import { Breadcrumb } from "antd";
import { HomeOutlined } from "@ant-design/icons";
import Link from "next/link";
import { CreateWarrantyClaimWorkflow } from "./_components/create-warranty-claim-workflow";

export default function CreateWarrantyClaimPage() {
  return (
    <div>
      <Breadcrumb
        style={{ marginBottom: 16 }}
        items={[
          {
            title: (
              <Link href="/">
                <HomeOutlined />
              </Link>
            ),
          },
          { title: <Link href="/dashboard">Dashboard</Link> },
          { title: "Create Warranty Claim" },
        ]}
      />
      <CreateWarrantyClaimWorkflow />
    </div>
  );
}
