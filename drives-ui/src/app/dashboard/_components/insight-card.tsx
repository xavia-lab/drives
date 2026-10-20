"use client";

import type { ReactNode } from "react";
import { Card, Space, Typography, theme } from "antd";

const { Text } = Typography;

export interface InsightCardProps {
  title: string;
  subtitle?: string;
  icon: ReactNode;
  extra?: ReactNode;
  children: ReactNode;
}

/**
 * Shared visual shell for the dashboard insight cards. Keeps the header,
 * spacing and rounded/bordered surface consistent with the workflow and
 * distribution cards.
 */
export const InsightCard = ({
  title,
  subtitle,
  icon,
  extra,
  children,
}: InsightCardProps) => {
  const { token } = theme.useToken();

  return (
    <Card
      style={{
        height: "100%",
        borderRadius: token.borderRadiusLG,
        borderColor: token.colorBorderSecondary,
      }}
      styles={{ body: { height: "100%" } }}
      title={
        <Space align="center" size={12}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: token.borderRadiusLG,
              background: token.colorPrimaryBg,
              color: token.colorPrimary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
            }}
          >
            {icon}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.3 }}>
              {title}
            </div>
            {subtitle ? (
              <Text type="secondary" style={{ fontSize: 12, fontWeight: 400 }}>
                {subtitle}
              </Text>
            ) : null}
          </div>
        </Space>
      }
      extra={extra}
    >
      {children}
    </Card>
  );
};
