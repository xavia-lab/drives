import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ContentStoreService } from './content-store.service';
import { LocalContentStoreProvider } from '../providers/local-content-store.provider';

describe('ContentStoreService with local provider', () => {
  let root: string;
  let service: ContentStoreService;

  beforeEach(async () => {
    root = await fs.mkdtemp(join(tmpdir(), 'drives-cas-local-'));
    service = new ContentStoreService(new LocalContentStoreProvider(root));
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  it('stores content by hash, deduplicates and persists metadata', async () => {
    const buffer = Buffer.from('content-addressable-local-test');

    const first = await service.upload(buffer, 'image/png', {
      originalName: 'test.png',
    });
    const second = await service.upload(buffer, 'image/png');

    expect(first.isNew).toBe(true);
    expect(second).toEqual({ fileId: first.fileId, isNew: false });
    await expect(service.getFileBuffer(first.fileId)).resolves.toEqual(buffer);

    const metadata = await service.getMetadata(first.fileId);
    expect(metadata).toMatchObject({
      originalName: 'test.png',
      mimetype: 'image/png',
    });
  });

  it('lists and deletes both the object and its sidecar', async () => {
    const { fileId } = await service.upload(
      Buffer.from('delete-me'),
      'text/plain',
    );

    await expect(service.listHashes()).resolves.toEqual([fileId]);

    await service.delete(fileId);

    await expect(service.listHashes()).resolves.toEqual([]);
    await expect(service.getMetadata(fileId)).resolves.toBeNull();
  });
});
