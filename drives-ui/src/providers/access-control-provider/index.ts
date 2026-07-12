import { AccessControlProvider, CanParams } from "@refinedev/core";
import { dataProvider } from "@providers/data-provider";

// Define which resources have the 'managed' attribute logic
const MANAGED_RESOURCES = [
  "currencies",
  "countries",
  "storage-types",
  "form-factors",
  "bus-protocols",
  "interfaces",
  "capacities",
];

export const createAccessControlProvider = (): AccessControlProvider => ({
  can: async ({ resource, action, params }: CanParams) => {
    if (!resource) {
      return { can: false };
    }

    // 1. Calculate attributes here (browser has access to dataProvider)
    const attributes = await getResourceAttributes(resource, params);

    try {
      // 2. Proxy the request to your server
      const response = await fetch("/api/permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resource,
          action,
          params: {
            id: params?.id,
            attributes, // Pass the pre-calculated attributes
          },
        }),
      });

      if (!response.ok) return { can: false };

      const data = await response.json();
      return { can: data.can };
    } catch (error) {
      console.error("AccessControl Proxy Error:", error);
      return { can: false };
    }
  },
});

/**
 * Separate helper to handle data fetching for specific resources
 */
async function getResourceAttributes(resource: string, params: any) {
  // If resource doesn't care about 'managed', return empty
  if (!MANAGED_RESOURCES.includes(resource)) {
    return {};
  }

  // Use provided data if available (e.g. from a table row)
  if (params?.data?.managed !== undefined) {
    return { managed: !!params.data.managed };
  }

  // Fetch from API if we have an ID but no data
  if (params?.id) {
    try {
      const { data } = await dataProvider.getOne({ resource, id: params.id });
      return { managed: !!data?.managed };
    } catch (error) {
      console.error(
        `AccessControl: Failed to fetch ${resource}/${params.id}`,
        error,
      );
    }
  }

  // Default for 'create' or unknown states
  return { managed: false };
}
