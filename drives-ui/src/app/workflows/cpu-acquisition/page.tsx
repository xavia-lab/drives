"use client";

import { Breadcrumb } from "antd";
import { HomeOutlined } from "@ant-design/icons";
import Link from "next/link";
import { CpuAcquisitionWorkflow } from "./_components/cpu-acquisition-workflow";

export default function CpuAcquisitionPage() {
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
          { title: "New CPU Acquisition" },
        ]}
      />
      <CpuAcquisitionWorkflow />
    </div>
  );
}
