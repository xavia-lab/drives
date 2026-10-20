"use client";

import { Space } from "antd";
import { WorkflowLauncher } from "@components/workflow";
import { WORKFLOWS } from "@workflows/registry";
import { PhysicalDriveDistribution } from "./_components/physical-drive-distribution";

export default function DashboardMainPage() {
  return (
    <div style={{ padding: "24px" }}>
      <Space direction="vertical" size="large" style={{ display: "flex" }}>
        <WorkflowLauncher workflows={WORKFLOWS} />
        <PhysicalDriveDistribution />
      </Space>
    </div>
  );
}
