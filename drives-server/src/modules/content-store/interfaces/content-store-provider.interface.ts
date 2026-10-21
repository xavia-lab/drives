/**
 * Storage-agnostic content store used by the content-addressable service.
 * Implementations must treat keys as opaque, slash-separated object names and
 * reject keys that escape their own storage root.
 */
export interface ContentStoreObject {
  key: string;
  lastModified: Date | null;
}

export interface ContentStoreProvider {
  put(key: string, body: Buffer, contentType?: string): Promise<void>;
  get(key: string): Promise<Buffer>;
  exists(key: string): Promise<boolean>;
  delete(key: string): Promise<void>;
  list(prefix: string): Promise<string[]>;
  listDetailed(prefix: string): Promise<ContentStoreObject[]>;
  /**
   * Optional maintenance hook for providers that stage writes locally.
   * Implementations should remove incomplete uploads older than `maxAgeMs`.
   */
  cleanupIncompleteUploads?(maxAgeMs: number): Promise<number>;
}

export const CONTENT_STORE_PROVIDER = 'CONTENT_STORE_PROVIDER';
