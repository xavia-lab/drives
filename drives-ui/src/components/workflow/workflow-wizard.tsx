"use client";

import { App, Button, Card, Form, Space, Steps, Typography, theme } from "antd";
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CheckOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { FormInstance } from "antd";
import type { WorkflowStep, WorkflowValues } from "./types";

const { Text, Title } = Typography;

export interface WorkflowWizardProps {
  title: string;
  subtitle?: string;
  /** Icon shown in the header tile. */
  icon?: ReactNode;
  steps: WorkflowStep[];
  form: FormInstance;
  initialValues?: WorkflowValues;
  submitLabel?: string;
  submittingLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  onFinish: (values: WorkflowValues) => Promise<void>;
}

/**
 * A theme-aware, reusable multi-step workflow shell.
 *
 * All steps stay mounted (inactive ones are hidden) so antd keeps their form
 * values and validation rules registered. The footer validates only the current
 * step before advancing and the whole form before submitting.
 */
export const WorkflowWizard = ({
  title,
  subtitle,
  icon,
  steps,
  form,
  initialValues,
  submitLabel = "Complete",
  submittingLabel = "Submitting...",
  cancelLabel = "Cancel",
  onCancel,
  onFinish,
}: WorkflowWizardProps) => {
  const { token } = theme.useToken();
  const { message } = App.useApp();
  const [current, setCurrent] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const watched = Form.useWatch([], form);
  const values = useMemo(() => (watched ?? {}) as WorkflowValues, [watched]);

  const isLastStep = current === steps.length - 1;

  const handleNext = async () => {
    try {
      await form.validateFields(steps[current].fields);
    } catch {
      return;
    }
    setCurrent((index) => Math.min(index + 1, steps.length - 1));
  };

  const handleSubmit = async () => {
    try {
      await form.validateFields();
    } catch {
      return;
    }

    setSubmitting(true);
    try {
      await onFinish(form.getFieldsValue(true) as WorkflowValues);
    } catch (error) {
      const detail = (error as { message?: string | string[] })?.message;
      message.error(
        Array.isArray(detail)
          ? detail.join(", ")
          : (detail ?? "Could not complete the workflow. Please try again."),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const stepItems = steps.map((step) => ({
    key: step.key,
    title: step.title,
    description: step.description,
    icon: step.icon,
  }));

  return (
    <Space direction="vertical" size="large" style={{ display: "flex" }}>
      <Card
        styles={{ body: { padding: 0 } }}
        style={{
          overflow: "hidden",
          borderRadius: token.borderRadiusLG,
          borderColor: token.colorBorderSecondary,
        }}
      >
        <div
          style={{
            padding: "20px 24px",
            background: `linear-gradient(135deg, ${token.colorPrimaryBg} 0%, ${token.colorBgContainer} 100%)`,
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <Space align="start" size={16}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: token.borderRadiusLG,
                background: token.colorPrimary,
                color: token.colorTextLightSolid,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                flex: "0 0 auto",
              }}
            >
              {icon}
            </div>
            <div>
              <Title level={4} style={{ margin: 0 }}>
                {title}
              </Title>
              {subtitle ? (
                <Text type="secondary" style={{ fontSize: 13 }}>
                  {subtitle}
                </Text>
              ) : null}
            </div>
          </Space>
        </div>
        <div style={{ padding: "20px 24px 0" }}>
          <Steps
            current={current}
            items={stepItems}
            onChange={(next) => {
              // Free navigation backwards; forward movement is validated.
              if (next < current) setCurrent(next);
            }}
          />
        </div>
      </Card>

      <Card
        style={{
          borderRadius: token.borderRadiusLG,
          borderColor: token.colorBorderSecondary,
        }}
        styles={{ body: { padding: 24 } }}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={initialValues}
          scrollToFirstError
        >
          {steps.map((step, index) => (
            <div
              key={step.key}
              style={{ display: index === current ? "block" : "none" }}
            >
              {step.content({ form, values })}
            </div>
          ))}
        </Form>
      </Card>

      <Card
        style={{
          position: "sticky",
          bottom: 16,
          zIndex: 10,
          borderRadius: token.borderRadiusLG,
          borderColor: token.colorBorderSecondary,
          boxShadow: token.boxShadowSecondary,
        }}
        styles={{ body: { padding: "12px 24px" } }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <Text type="secondary" style={{ fontSize: 13 }}>
            Step {current + 1} of {steps.length}
          </Text>
          <Space wrap>
            {onCancel ? (
              <Button icon={<CloseOutlined />} onClick={onCancel}>
                {cancelLabel}
              </Button>
            ) : null}
            <Button
              icon={<ArrowLeftOutlined />}
              disabled={current === 0 || submitting}
              onClick={() => setCurrent((index) => Math.max(index - 1, 0))}
            >
              Back
            </Button>
            {isLastStep ? (
              <Button
                type="primary"
                icon={<CheckOutlined />}
                loading={submitting}
                onClick={handleSubmit}
              >
                {submitting ? submittingLabel : submitLabel}
              </Button>
            ) : (
              <Button
                type="primary"
                icon={<ArrowRightOutlined />}
                iconPosition="end"
                onClick={handleNext}
              >
                Next
              </Button>
            )}
          </Space>
        </div>
      </Card>
    </Space>
  );
};
