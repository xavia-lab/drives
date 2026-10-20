"use client";

import { Breadcrumb } from "antd";
import { HomeOutlined } from "@ant-design/icons";
import Link from "next/link";
import { DriveAllocationWorkflow } from "./_components/drive-allocation-workflow";

export default function DriveAllocationPage() {
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
          { title: "Drive Allocation" },
        ]}
      />
      <DriveAllocationWorkflow />
    </div>
  );
}
