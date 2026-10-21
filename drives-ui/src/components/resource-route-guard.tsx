"use client";

import type { ReactNode } from "react";
import { useCan } from "@refinedev/core";
import { Result, Spin } from "antd";
import { usePathname } from "next/navigation";

const ADMIN_ONLY_PREFIXES = ["/system/tasks"];
const PUBLIC_PREFIXES = ["/system/status"];

const GuardedContent = ({
  children,
  pathname,
}: {
  children: ReactNode;
  pathname: string;
}) => {
  const segments = pathname.split("/").filter(Boolean);

  let resource = segments[0] ?? "dashboard";
  if (ADMIN_ONLY_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    resource = "tasks";
  } else if (pathname.startsWith("/system/status")) {
    resource = "status";
  }

  const sub = segments[1];
  const action =
    sub === "create"
      ? "create"
      : sub === "edit"
        ? "edit"
        : sub === "show"
          ? "show"
          : "list";

  const { data, isLoading } = useCan({ resource, action });

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
        subTitle="You do not have permission to view this page."
      />
    );
  }

  return <>{children}</>;
};

/**
 * Guards direct navigation to resource pages. List/show remain available to
 * every role, while create/edit routes (and the admin-only system pages) are
 * blocked unless Cerbos allows the matching action. This complements the
 * hidden action buttons: a user cannot reach a form by typing its URL.
 *
 * The system status page is intentionally public and bypasses the permission
 * check so it stays reachable without a session.
 */
export const ResourceRouteGuard = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname() ?? "/";

  if (PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return <>{children}</>;
  }

  return <GuardedContent pathname={pathname}>{children}</GuardedContent>;
};
