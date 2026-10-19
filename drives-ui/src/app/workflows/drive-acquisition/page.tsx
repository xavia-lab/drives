"use client";

import { Breadcrumb } from "antd";
import { HomeOutlined } from "@ant-design/icons";
import Link from "next/link";
import { DriveAcquisitionWorkflow } from "./_components/drive-acquisition-workflow";

export default function DriveAcquisitionPage() {
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
          { title: "New Drive Acquisition" },
        ]}
      />
      <DriveAcquisitionWorkflow />
    </div>
  );
}
