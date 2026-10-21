"use client";

import type { ReactNode } from "react";
import { useCan } from "@refinedev/core";
import { Button, Result, Spin } from "antd";
import { useRouter } from "next/navigation";

/**
 * Route-level guard for the workflow pages. The same `workflows:run`
 * permission gates the dashboard launcher, so viewers cannot launch or deep-link
 * into a workflow.
 */
export const WorkflowAccessGuard = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const { data, isLoading } = useCan({
    resource: "workflows",
    action: "run",
  });

  if (isLoading) {
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: 320 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!data?.can) {
    return (
      <Result
        status="403"
        title="Access denied"
        subTitle="You do not have permission to use workflows. Ask an administrator for access."
        extra={
          <Button type="primary" onClick={() => router.push("/dashboard")}>
            Back to dashboard
          </Button>
        }
      />
    );
  }

  return <>{children}</>;
};
