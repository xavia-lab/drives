"use client";

import { Breadcrumb } from "antd";
import { HomeOutlined } from "@ant-design/icons";
import Link from "next/link";
import { DriveMediaManagementWorkflow } from "./_components/drive-media-management-workflow";

export default function DriveMediaManagementPage() {
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
          { title: "Drive Media Management" },
        ]}
      />
      <DriveMediaManagementWorkflow />
    </div>
  );
}
