"use client";

import { useApiUrl, useCustom } from "@refinedev/core";
import { Alert, Button, Card, Col, Row, Skeleton, Space } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { PhysicalDriveDistribution } from "./physical-drive-distribution";
import { WarrantyWatchlistCard } from "./warranty-watchlist-card";
import { LifecycleHealthCard } from "./lifecycle-health-card";
import { SlotUtilizationCard } from "./slot-utilization-card";
import { DatacenterHealthCard } from "./datacenter-health-card";
import { CapitalAgeCard } from "./capital-age-card";
import { RecentActivityCard } from "./recent-activity-card";
import { RmaPipelineCard } from "./rma-pipeline-card";
import { OldestInUseCard } from "./oldest-in-use-card";
import type { DashboardSummary } from "./types";

/**
 * Loads the cross-cutting dashboard snapshot once and renders the insight
 * cards. Individual cards stay presentational so this is the only request the
 * lower dashboard makes for these sections.
 */
export const DashboardInsights = () => {
  const apiUrl = useApiUrl();
  const { query, result } = useCustom({
    url: `${apiUrl}/dashboard/summary`,
    method: "get",
  });

  // Refine returns a frozen EMPTY_OBJECT while loading; validate the shape
  // before treating it as a summary.
  const raw = result?.data as Partial<DashboardSummary> | undefined;
  const summary =
    raw?.driveDistribution &&
    raw.warrantyWatchlist &&
    raw.lifecycleHealth &&
    raw.slotUtilization &&
    raw.datacenterHealth &&
    raw.capitalAge &&
    raw.rmaPipeline &&
    Array.isArray(raw.recentActivity)
      ? (raw as DashboardSummary)
      : undefined;

  if (query.isLoading) {
    return (
      <Card>
        <Skeleton active paragraph={{ rows: 12 }} />
      </Card>
    );
  }

  if (query.isError || !summary) {
    return (
      <Alert
        type="error"
        showIcon
        message="Could not load fleet insights"
        description="The dashboard summary request failed. Check the API and try again."
        action={
          <Button
            size="small"
            icon={<ReloadOutlined />}
            onClick={() => query.refetch()}
          >
            Retry
          </Button>
        }
      />
    );
  }

  return (
    <Space direction="vertical" size={16} style={{ display: "flex" }}>
      <PhysicalDriveDistribution distribution={summary.driveDistribution} />

      <Row gutter={[16, 16]} align="stretch">
        <Col xs={24} xl={12}>
          <WarrantyWatchlistCard watchlist={summary.warrantyWatchlist} />
        </Col>
        <Col xs={24} xl={12}>
          <LifecycleHealthCard health={summary.lifecycleHealth} />
        </Col>
      </Row>

      <Row gutter={[16, 16]} align="stretch">
        <Col xs={24} lg={12} xl={8}>
          <SlotUtilizationCard utilization={summary.slotUtilization} />
        </Col>
        <Col xs={24} lg={12} xl={8}>
          <RmaPipelineCard pipeline={summary.rmaPipeline} />
        </Col>
        <Col xs={24} xl={8}>
          <CapitalAgeCard capital={summary.capitalAge} />
        </Col>
      </Row>

      <Row gutter={[16, 16]} align="stretch">
        <Col xs={24} xl={14}>
          <DatacenterHealthCard health={summary.datacenterHealth} />
        </Col>
        <Col xs={24} xl={10}>
          <OldestInUseCard drives={summary.capitalAge.oldestInUseDrives} />
        </Col>
      </Row>

      <Row gutter={[16, 16]} align="stretch">
        <Col span={24}>
          <RecentActivityCard activity={summary.recentActivity} />
        </Col>
      </Row>
    </Space>
  );
};
