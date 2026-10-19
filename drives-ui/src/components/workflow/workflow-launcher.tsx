"use client";

import { Card, Col, Row, Space, Tag, Typography, theme } from "antd";
import { ArrowRightOutlined, ThunderboltOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import type { WorkflowDefinition } from "./types";

const { Text, Title } = Typography;

export interface WorkflowLauncherProps {
  workflows: WorkflowDefinition[];
  title?: string;
  description?: string;
}

/**
 * Dashboard entry point for guided workflows. Cards are data-driven so new
 * workflows only need to be appended to the registry.
 */
export const WorkflowLauncher = ({
  workflows,
  title = "Workflows",
  description = "Guided, validated multi-step tasks for common operations.",
}: WorkflowLauncherProps) => {
  const { token } = theme.useToken();
  const router = useRouter();

  return (
    <Card
      title={
        <Space>
          <ThunderboltOutlined style={{ color: token.colorPrimary }} />
          <span>{title}</span>
        </Space>
      }
      extra={
        <Text type="secondary" style={{ fontSize: 13 }}>
          {description}
        </Text>
      }
      style={{
        borderRadius: token.borderRadiusLG,
        borderColor: token.colorBorderSecondary,
      }}
    >
      <Row gutter={[16, 16]}>
        {workflows.map((workflow) => (
          <Col xs={24} md={12} xl={8} key={workflow.key}>
            <Card
              hoverable
              onClick={() => router.push(workflow.href)}
              style={{
                height: "100%",
                borderRadius: token.borderRadiusLG,
                borderColor: token.colorBorderSecondary,
                background: `linear-gradient(135deg, ${token.colorFillAlter} 0%, ${token.colorBgContainer} 100%)`,
                cursor: "pointer",
              }}
              styles={{ body: { padding: 20 } }}
            >
              <Space
                direction="vertical"
                size="middle"
                style={{ width: "100%" }}
              >
                <Space align="start" size={14} style={{ width: "100%" }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: token.borderRadiusLG,
                      background: token.colorPrimaryBg,
                      color: token.colorPrimary,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 18,
                      flex: "0 0 auto",
                    }}
                  >
                    {workflow.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <Space size={8} wrap>
                      <Title level={5} style={{ margin: 0 }}>
                        {workflow.title}
                      </Title>
                      {workflow.category ? (
                        <Tag color="processing" style={{ marginInlineEnd: 0 }}>
                          {workflow.category}
                        </Tag>
                      ) : null}
                    </Space>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      {workflow.description}
                    </Text>
                  </div>
                </Space>
                <Text
                  strong
                  style={{ color: token.colorPrimary, fontSize: 13 }}
                >
                  Start workflow <ArrowRightOutlined />
                </Text>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>
    </Card>
  );
};
