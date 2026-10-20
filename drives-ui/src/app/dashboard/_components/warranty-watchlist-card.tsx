"use client";

import Link from "next/link";
import { Col, Row, Space, Statistic, Tag, Typography, theme } from "antd";
import { FileProtectOutlined } from "@ant-design/icons";
import { InsightCard } from "./insight-card";
import type { WarrantyWatchlist } from "./types";

const { Text } = Typography;

export const WarrantyWatchlistCard = ({
  watchlist,
}: {
  watchlist: WarrantyWatchlist;
}) => {
  const { token } = theme.useToken();

  const metrics = [
    {
      title: "Within 30 days",
      value: watchlist.within30Days,
      color: token.colorWarning,
    },
    {
      title: "Within 60 days",
      value: watchlist.within60Days,
      color: token.colorWarning,
    },
    {
      title: "Within 90 days",
      value: watchlist.within90Days,
      color: token.colorInfo,
    },
    {
      title: "Expired",
      value: watchlist.expiredWarranties,
      color:
        watchlist.expiredWarranties > 0
          ? token.colorError
          : token.colorTextSecondary,
    },
    {
      title: "Open claims",
      value: watchlist.openClaims,
      color: watchlist.openClaims > 0 ? token.colorWarning : token.colorSuccess,
    },
  ];

  return (
    <InsightCard
      title="Warranty Watchlist"
      subtitle="Expiring coverage and open RMA claims"
      icon={<FileProtectOutlined />}
      extra={<Link href="/warranty-claims">Claims</Link>}
    >
      <Space direction="vertical" size={16} style={{ display: "flex" }}>
        <Row gutter={[8, 8]}>
          {metrics.map((metric) => (
            <Col key={metric.title} flex="1 1 100px">
              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: token.borderRadiusLG,
                  background: token.colorFillQuaternary,
                }}
              >
                <Statistic
                  title={<span style={{ fontSize: 12 }}>{metric.title}</span>}
                  value={metric.value}
                  valueStyle={{
                    fontSize: 22,
                    fontWeight: 600,
                    color: metric.color,
                  }}
                />
              </div>
            </Col>
          ))}
        </Row>

        {watchlist.openClaims > 0 ? (
          <Text type="secondary" style={{ fontSize: 12 }}>
            {watchlist.oldestOpenClaimDays !== null
              ? `Oldest open claim: ${watchlist.oldestOpenClaimDays} day${
                  watchlist.oldestOpenClaimDays === 1 ? "" : "s"
                }`
              : `${watchlist.openClaims} claim${
                  watchlist.openClaims === 1 ? "" : "s"
                } still open`}
          </Text>
        ) : null}

        <div>
          <Text
            type="secondary"
            style={{
              display: "block",
              fontSize: 11,
              letterSpacing: 1.1,
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Next expirations
          </Text>

          {watchlist.nextExpirations.length === 0 ? (
            <Text type="secondary">
              No upcoming warranty expirations in this fleet.
            </Text>
          ) : (
            <Space direction="vertical" size={8} style={{ display: "flex" }}>
              {watchlist.nextExpirations.map((expiration) => {
                const tagColor =
                  expiration.daysRemaining <= 30
                    ? "red"
                    : expiration.daysRemaining <= 90
                      ? "orange"
                      : "blue";

                return (
                  <Link
                    key={expiration.driveId}
                    href={`/physical-drives/show/${expiration.driveId}`}
                    style={{ color: "inherit" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        padding: "8px 10px",
                        borderRadius: token.borderRadiusLG,
                        border: `1px solid ${token.colorBorderSecondary}`,
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <Text strong ellipsis style={{ display: "block" }}>
                          {expiration.serialNumber}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {expiration.datacenterCode ?? "Unassigned"}
                        </Text>
                      </div>
                      <div style={{ textAlign: "right", flex: "0 0 auto" }}>
                        <Tag color={tagColor} style={{ marginInlineEnd: 0 }}>
                          {expiration.daysRemaining}d
                        </Tag>
                        <Text
                          type="secondary"
                          style={{ display: "block", fontSize: 11 }}
                        >
                          {expiration.warrantyExpiryDate}
                        </Text>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </Space>
          )}
        </div>
      </Space>
    </InsightCard>
  );
};
