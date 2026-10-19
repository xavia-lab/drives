"use client";

import { Breadcrumb } from "antd";
import { HomeOutlined } from "@ant-design/icons";
import Link from "next/link";
import { RelocateDriveWorkflow } from "./_components/relocate-drive-workflow";

export default function DriveRelocationPage() {
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
          { title: "Relocate Drive" },
        ]}
      />
      <RelocateDriveWorkflow />
    </div>
  );
}
