"use client";

import type { AuditLogProvider, LogParams } from "@refinedev/core";
import { getSession } from "next-auth/react";

const API_URL = "/api/proxy";

/**
 * The backend `audit_logs` table stores an aggregate `payload` ({ previous, current })
 * and a federated Keycloak `userId`, while Refine's Audit Log Provider speaks in
 * terms of `data` / `previousData` / `author` / `meta.id`. This provider is the
 * adapter between the two contracts so CRUD operations are logged automatically.
 */

const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const session = await getSession();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (session?.accessToken) {
    headers["Authorization"] = `Bearer ${session.accessToken}`;
  }

  return headers;
};

// Refine emits "createMany" / "updateMany" / "deleteMany" from the bulk hooks;
// the backend enum only accepts the four singular verbs.
const normalizeAction = (action: string): string => {
  if (action === "createMany") return "create";
  if (action === "updateMany") return "update";
  if (action === "deleteMany") return "delete";
  return action;
};

export interface AuditLogRecord {
  id: string;
  action: string;
  resource: string;
  resourceId: string;
  payload: {
    previous?: Record<string, unknown> | null;
    current?: Record<string, unknown> | null;
  } | null;
  timestamp: string;
  createdAt: string;
  userId: string | null;
  userName?: string | null;
}

const resolveResourceId = (meta: LogParams["meta"], data: unknown): string => {
  const asString = (value: unknown): string | undefined =>
    value === undefined || value === null ? undefined : String(value);

  const metaId = asString(meta?.id);
  if (metaId) return metaId;

  const metaIds = meta?.ids;
  if (Array.isArray(metaIds) && metaIds.length > 0) {
    return asString(metaIds[0]) ?? "";
  }

  const dataId =
    data && typeof data === "object"
      ? asString((data as Record<string, unknown>).id)
      : undefined;

  return dataId ?? "";
};

export const toRefineLog = (log: AuditLogRecord) => ({
  id: log.id,
  action: log.action,
  resource: log.resource,
  resourceId: log.resourceId,
  author: log.userId
    ? { id: log.userId, name: log.userName ?? undefined }
    : undefined,
  data: log.payload?.current ?? null,
  previousData: log.payload?.previous ?? null,
  meta: { id: log.resourceId },
  createdAt: log.timestamp ?? log.createdAt,
});

export type RefineAuditLog = ReturnType<typeof toRefineLog>;

export const auditLogProvider: AuditLogProvider = {
  create: async ({ resource, action, data, previousData, meta }) => {
    const resourceId = resolveResourceId(meta, data);

    // An audit entry without a target record id cannot be attributed, skip it.
    if (!resourceId) return { skipped: true };

    // The acting operator is resolved server-side from the validated access
    // token, so no userId is sent from the client.
    const body = {
      action: normalizeAction(action),
      resource,
      resourceId,
      payload: {
        previous: previousData ?? null,
        current: data ?? null,
      },
    };

    try {
      const response = await fetch(`${API_URL}/audit-logs`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify(body),
      });

      if (!response.ok) throw response;

      return await response.json();
    } catch (error) {
      // Audit logging is best-effort: it must never break the primary mutation.
      console.error("Failed to persist audit log", error);
      return { success: false };
    }
  },

  get: async ({ resource, action, meta }) => {
    const params = new URLSearchParams();

    if (resource) params.append("resource", resource);
    if (action) params.append("action", normalizeAction(action));

    const passthroughKeys = [
      "pageNumber",
      "pageSize",
      "resourceId",
      "userId",
      "id",
      "sortField",
      "sortOrder",
    ] as const;

    passthroughKeys.forEach((key) => {
      const value = meta?.[key];
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, String(value));
      }
    });

    const response = await fetch(`${API_URL}/audit-logs?${params.toString()}`, {
      headers: await getAuthHeaders(),
    });

    if (!response.ok) throw response;

    const responseJson = (await response.json()) as {
      data?: AuditLogRecord[];
    };

    return (responseJson.data ?? []).map(toRefineLog);
  },

  update: async () => {
    // Audit entries are append-only and intentionally cannot be renamed.
    throw new Error("Audit logs are immutable and cannot be modified");
  },
};
