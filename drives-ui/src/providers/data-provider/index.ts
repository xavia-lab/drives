"use client";

import { CustomResponse, CustomParams } from "@refinedev/core";
import type { DataProvider } from "@refinedev/core";
import { getSession } from "next-auth/react";

const API_URL = "/api/proxy";

// Helper function to get auth headers
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

/**
 * Variable to hold the current refresh promise.
 * If multiple requests fail, they will all wait for this single promise.
 */
let refreshPromise: Promise<any> | null = null;

const authenticatedFetch = async (
  url: string,
  options: RequestInit = {},
  isRetry = false,
): Promise<Response> => {
  // Get fresh headers (this should fetch the latest token from storage/session)
  const authHeaders = await getAuthHeaders();

  console.log(`Fetching ${url} with body:`, options.body);
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json", // Default
      ...options.headers, // Custom headers from provider
      ...authHeaders, // Auth headers (Force overwrite with latest token)
    },
  });

  if ((response.status === 401 || response.status === 403) && !isRetry) {
    if (!refreshPromise) {
      refreshPromise = getSession().finally(() => {
        refreshPromise = null;
      });
    }

    const session = await refreshPromise;

    if (session?.accessToken) {
      // IMPORTANT: We do NOT pass the original headers in options here
      // because they contain the old Authorization string.
      // We let the next recursive call fetch the NEW headers.
      return authenticatedFetch(url, options, true);
    }
  }

  return response;
};

export const dataProvider: DataProvider = {
  getOne: async ({ resource, id, meta }) => {
    const response = await authenticatedFetch(`${API_URL}/${resource}/${id}`);

    if (response.status < 200 || response.status > 299) throw response;

    const responseJson = await response.json();

    return { data: responseJson };
  },

  getMany: async ({ resource, ids, meta }) => {
    const params = new URLSearchParams();

    if (ids) {
      ids.forEach((id) => params.append("id", String(id)));
    }

    const response = await authenticatedFetch(
      `${API_URL}/${resource}?${params.toString()}`,
    );

    if (response.status < 200 || response.status > 299) throw response;

    const responseJson = await response.json();

    return { data: responseJson.data };
  },

  update: async ({ resource, id, variables, meta }) => {
    const response = await authenticatedFetch(`${API_URL}/${resource}/${id}`, {
      method: "PUT",
      body: JSON.stringify(variables),
    });

    if (response.status < 200 || response.status > 299) throw response;

    const data = await response.json();

    return { data };
  },

  getList: async ({ resource, pagination, filters, sorters, meta }) => {
    const params = new URLSearchParams();

    console.log(
      `Resource: ${resource}; Pagination parameters: ${JSON.stringify(
        pagination,
      )}`,
    );
    console.log(
      `Resource: ${resource}; Filter parameters: ${JSON.stringify(filters)}`,
    );

    if (pagination && pagination.mode === "server") {
      params.append("pageNumber", String(pagination.currentPage));
      params.append("pageSize", String(pagination.pageSize));
    }

    if (sorters && sorters.length > 0) {
      params.append(
        "sortField",
        sorters.map((sorter) => sorter.field).join(","),
      );
      params.append(
        "sortOrder",
        sorters.map((sorter) => sorter.order).join(","),
      );
    }

    if (filters && filters.length > 0) {
      filters
        .filter(
          (filter): filter is any => "field" in filter && "operator" in filter,
        )
        .forEach((filter) => {
          // Use a constant and handle the array-to-comma logic inline
          const value = Array.isArray(filter.value)
            ? filter.value.join(",")
            : String(filter.value);

          params.append("filterField", filter.field);
          params.append("filterOperator", filter.operator);
          params.append("filterValue", value);
        });
    }

    const response = await authenticatedFetch(
      `${API_URL}/${resource}?${params.toString()}`,
    );

    if (response.status < 200 || response.status > 299) throw response;

    const responseJson = await response.json();

    const total = responseJson.meta?.totalItems ?? responseJson.total ?? 0;

    return {
      data: responseJson.data,
      total: total || responseJson.total || responseJson.data?.length || 0,
    };
  },

  create: async ({ resource, variables }) => {
    const response = await authenticatedFetch(`${API_URL}/${resource}`, {
      method: "POST",
      body: JSON.stringify(variables),
    });

    if (response.status < 200 || response.status > 299) throw response;

    const data = await response.json();

    return { data };
  },

  deleteOne: async ({ resource, id, variables, meta }) => {
    const response = await authenticatedFetch(`${API_URL}/${resource}/${id}`, {
      method: "DELETE",
    });

    if (response.status < 200 || response.status > 299) throw response;

    const data = await response.json();

    return { data };
  },

  getApiUrl: () => API_URL,

  // Optional methods with authentication
  createMany: async ({ resource, variables }) => {
    const response = await authenticatedFetch(`${API_URL}/${resource}/batch`, {
      method: "POST",
      body: JSON.stringify(variables),
    });

    if (response.status < 200 || response.status > 299) throw response;

    const data = await response.json();

    return { data };
  },

  updateMany: async ({ resource, ids, variables }) => {
    const response = await authenticatedFetch(`${API_URL}/${resource}/batch`, {
      method: "PUT",
      body: JSON.stringify({ ids, ...variables }),
    });

    if (response.status < 200 || response.status > 299) throw response;

    const data = await response.json();

    return { data };
  },

  deleteMany: async ({ resource, ids }) => {
    const params = new URLSearchParams();
    ids.forEach((id) => params.append("ids", String(id)));

    const response = await authenticatedFetch(
      `${API_URL}/${resource}?${params.toString()}`,
      {
        method: "DELETE",
      },
    );

    if (response.status < 200 || response.status > 299) throw response;

    const data = await response.json();

    return { data };
  },
  custom: async <TData = any, TQuery = any, TPayload = any>({
    url,
    method,
    payload, // Used by useCustom
    values, // Used by useCustomMutation
    query,
    headers,
  }: CustomParams<TQuery, TPayload> & { values?: TPayload }): Promise<
    CustomResponse<TData>
  > => {
    // Refine's mutation hooks pass data as 'values', while queries use 'payload'.
    // We consolidate them here to ensure the body is never undefined.
    const requestPayload = values || payload;

    console.log(`Custom call to: ${url} [${method.toUpperCase()}]`);
    if (requestPayload)
      console.log("Payload/Values:", JSON.stringify(requestPayload));

    // FIX: Provide window.location.origin as the second argument.
    // This allows the constructor to handle relative paths like "/api/proxy/..."
    // and ensures the fetch hits your Next.js server so the proxy.ts can intercept it.
    const requestUrl = new URL(url, window.location.origin);

    // Safely append query parameters
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          requestUrl.searchParams.append(key, String(value));
        }
      });
    }

    const response = await authenticatedFetch(requestUrl.toString(), {
      method: method.toUpperCase(),
      headers: {
        "Content-Type": "application/json",
        ...headers,
      } as Record<string, string>,
      // Only attach body if it's not a GET request
      body:
        requestPayload && method.toLowerCase() !== "get"
          ? JSON.stringify(requestPayload)
          : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: response.statusText,
      }));
      throw error;
    }

    const data = await response.json();

    return { data };
  },
};
