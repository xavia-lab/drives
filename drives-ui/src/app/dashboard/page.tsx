"use client";

import { Space } from "antd";
import { WorkflowLauncher } from "@components/workflow";
import { WORKFLOWS } from "@workflows/registry";
import { DashboardInsights } from "./_components/dashboard-insights";
import { StorageTopologyVisualizer } from "./_components/storage-topology-visualizer";

export default function DashboardMainPage() {
  return (
    <div style={{ padding: "24px" }}>
      <Space direction="vertical" size="large" style={{ display: "flex" }}>
        <WorkflowLauncher workflows={WORKFLOWS} />
        <StorageTopologyVisualizer />
        <DashboardInsights />
      </Space>
    </div>
  );
}
