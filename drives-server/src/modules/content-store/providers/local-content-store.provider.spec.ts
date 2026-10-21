import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LocalContentStoreProvider } from './local-content-store.provider';

describe('LocalContentStoreProvider', () => {
  let root: string;
  let provider: LocalContentStoreProvider;

  beforeEach(async () => {
    root = await fs.mkdtemp(join(tmpdir(), 'drives-content-store-'));
    provider = new LocalContentStoreProvider(root);
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  it('writes, reads, checks and deletes an object', async () => {
    const body = Buffer.from('hello content store');

    await provider.put('objects/abc123', body, 'text/plain');

    await expect(provider.exists('objects/abc123')).resolves.toBe(true);
    await expect(provider.get('objects/abc123')).resolves.toEqual(body);

    await provider.delete('objects/abc123');
    await expect(provider.exists('objects/abc123')).resolves.toBe(false);
  });

  it('supports nested keys and lists only the requested prefix', async () => {
    await provider.put('objects/a', Buffer.from('a'));
    await provider.put('objects/nested/b', Buffer.from('b'));
    await provider.put('other/c', Buffer.from('c'));

    await expect(provider.list('objects/')).resolves.toEqual([
      'objects/a',
      'objects/nested/b',
    ]);
  });

  it('reports content objects with their modification time', async () => {
    await provider.put('objects/with-time', Buffer.from('data'));

    const objects = await provider.listDetailed('objects/');

    expect(objects).toHaveLength(1);
    expect(objects[0].key).toBe('objects/with-time');
    expect(objects[0].lastModified).toBeInstanceOf(Date);
  });

  it('returns an empty list for a missing prefix', async () => {
    await expect(provider.list('does-not-exist/')).resolves.toEqual([]);
  });

  it('treats delete of a missing object as a no-op', async () => {
    await expect(provider.delete('objects/missing')).resolves.toBeUndefined();
  });

  it('rejects keys that escape the storage root', async () => {
    await expect(provider.put('../escape', Buffer.from('x'))).rejects.toThrow(
      /path traversal/i,
    );
    await expect(provider.get('/etc/passwd')).rejects.toThrow(
      /absolute paths/i,
    );
    await expect(
      provider.put('objects/../../escape', Buffer.from('x')),
    ).rejects.toThrow(/path traversal/i);
  });

  it('rejects malformed separators and empty segments', async () => {
    await expect(provider.put('objects//a', Buffer.from('x'))).rejects.toThrow(
      /path traversal|Invalid content-store key/i,
    );
    await expect(provider.put('objects/./a', Buffer.from('x'))).rejects.toThrow(
      /path traversal|Invalid content-store key/i,
    );
  });

  it('does not leave temporary files behind after a write', async () => {
    await provider.put('objects/atomic', Buffer.from('data'));

    const objectEntries = await fs.readdir(join(root, 'objects'));
    const temporaryEntries = await fs.readdir(join(root, '.tmp'));
    expect(objectEntries.filter((entry) => entry.endsWith('.tmp'))).toEqual([]);
    expect(temporaryEntries).toEqual([]);
  });

  it('removes stale staging files without touching active ones', async () => {
    const temporaryDirectory = join(root, '.tmp');
    const stale = join(temporaryDirectory, 'stale.tmp');
    const active = join(temporaryDirectory, 'active.tmp');
    await fs.mkdir(temporaryDirectory, { recursive: true });
    await fs.writeFile(stale, 'stale');
    await fs.writeFile(active, 'active');

    const old = new Date(Date.now() - 2 * 60 * 60 * 1000);
    await fs.utimes(stale, old, old);

    const removed = await provider.cleanupIncompleteUploads(60 * 60 * 1000);

    expect(removed).toBe(1);
    await expect(fs.access(stale)).rejects.toThrow();
    await expect(fs.access(active)).resolves.toBeUndefined();
  });

  it('returns zero when the staging directory does not exist', async () => {
    await expect(
      provider.cleanupIncompleteUploads(60 * 60 * 1000),
    ).resolves.toBe(0);
  });
});
