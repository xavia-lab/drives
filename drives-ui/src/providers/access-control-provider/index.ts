import { AccessControlProvider, CanParams } from "@refinedev/core";
import { dataProvider } from "@providers/data-provider";

const API_URL = "/api/proxy";

/**
 * The set of resources that carry a `managed` attribute is owned by the backend
 * (derived from the Sequelize models) and fetched once, instead of duplicating
 * a hardcoded list here. `null` means "unavailable" — callers then fall back to
 * treating the resource as managed so access decisions stay conservative.
 */
let managedResourcesCache: Promise<Set<string> | null> | null = null;

const loadManagedResources = (): Promise<Set<string> | null> => {
  if (!managedResourcesCache) {
    managedResourcesCache = fetch(`${API_URL}/metadata/managed-resources`, {
      headers: { "Content-Type": "application/json" },
    })
      .then(async (response) => {
        if (!response.ok) throw response;
        const json = (await response.json()) as { resources?: string[] };
        return new Set<string>(json.resources ?? []);
      })
      .catch((error) => {
        console.error("Failed to load managed resources", error);
        // Reset so a later call can retry.
        managedResourcesCache = null;
        return null;
      });
  }

  return managedResourcesCache;
};

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
  const managedResources = await loadManagedResources();

  // If the list is unavailable, assume the resource is managed (fetch + pass the
  // real flag) rather than silently skipping the check.
  const isManaged =
    managedResources === null ? true : managedResources.has(resource);

  if (!isManaged) {
    return {};
  }

  // Use provided data if available (e.g. from a table row)
  if (params?.data?.managed !== undefined) {
    return { managed: !!params.data.managed };
  }

  // Fetch from API if we have an ID but no data. A missing record is not an
  // error here: lists can outlive a deleted/reseeded row, and the fetch is only
  // used to decide whether the row is managed. Fail closed so a transient 404
  // cannot expose edit/delete actions on a managed row.
  if (params?.id) {
    try {
      const { data } = await dataProvider.getOne({ resource, id: params.id });
      return { managed: !!data?.managed };
    } catch {
      return { managed: true };
    }
  }

  // Default for 'create' or unknown states
  return { managed: false };
}
