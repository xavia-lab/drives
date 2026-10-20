/**
 * Shared cache tags. Keep these stable: changing a tag name implicitly
 * invalidates all existing entries (they simply stop being read).
 */
export const CACHE_TAGS = {
  CURRENCIES: 'currencies',
  DASHBOARD: 'dashboard',
  PHYSICAL_DRIVES: 'physical-drives',
} as const;
