"use client";

import { Breadcrumb } from "antd";
import { HomeOutlined } from "@ant-design/icons";
import Link from "next/link";
import { ProgressWarrantyClaimWorkflow } from "./_components/progress-warranty-claim-workflow";

export default function ProgressWarrantyClaimPage() {
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
          { title: "Progress Warranty Claim" },
        ]}
      />
      <ProgressWarrantyClaimWorkflow />
    </div>
  );
}
