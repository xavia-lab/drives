import { promises as fs } from 'fs';
import type { Dirent } from 'fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'path';
import { ContentStoreProvider } from '../interfaces/content-store-provider.interface';

/**
 * Filesystem-backed content store for single-node / small deployments.
 *
 * Keys are resolved beneath `root`; absolute paths, `..` segments and empty
 * key components are rejected so a malformed key can never escape the mounted
 * directory. Writes go through a temporary file in the destination directory
 * followed by an atomic rename.
 */
export class LocalContentStoreProvider implements ContentStoreProvider {
  private readonly root: string;
  private readonly temporaryDirectory: string;

  constructor(root: string) {
    this.root = resolve(root);
    this.temporaryDirectory = join(this.root, '.tmp');
  }

  async put(key: string, body: Buffer): Promise<void> {
    const target = this.resolveKey(key);
    const directory = dirname(target);
    await Promise.all([
      fs.mkdir(directory, { recursive: true }),
      fs.mkdir(this.temporaryDirectory, { recursive: true, mode: 0o700 }),
    ]);

    // Keep the temp file under the same storage root so rename() is atomic on
    // the same filesystem, while a single hidden directory can be swept on
    // startup/periodically after a crashed upload.
    const temporary = join(
      this.temporaryDirectory,
      `${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}.tmp`,
    );

    try {
      await fs.writeFile(temporary, body);
      await fs.rename(temporary, target);
    } catch (error) {
      await fs.unlink(temporary).catch(() => undefined);
      throw error;
    }
  }

  async get(key: string): Promise<Buffer> {
    return fs.readFile(this.resolveKey(key));
  }

  async exists(key: string): Promise<boolean> {
    try {
      await fs.access(this.resolveKey(key));
      return true;
    } catch {
      return false;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await fs.unlink(this.resolveKey(key));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  async cleanupIncompleteUploads(maxAgeMs: number): Promise<number> {
    let entries: Dirent[];

    try {
      entries = await fs.readdir(this.temporaryDirectory, {
        withFileTypes: true,
      });
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === 'ENOENT' || code === 'ENOTDIR') return 0;
      throw error;
    }

    const cutoff = Date.now() - maxAgeMs;
    let removed = 0;

    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.tmp')) continue;

      const path = join(this.temporaryDirectory, entry.name);
      try {
        const stat = await fs.stat(path);
        if (stat.mtimeMs < cutoff) {
          await fs.unlink(path);
          removed += 1;
        }
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          throw error;
        }
      }
    }

    return removed;
  }

  async list(prefix: string): Promise<string[]> {
    const start = this.resolvePrefix(prefix);
    const result: string[] = [];

    const walk = async (directory: string): Promise<void> => {
      let entries: Dirent[];
      try {
        entries = await fs.readdir(directory, { withFileTypes: true });
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') return;
        throw error;
      }

      for (const entry of entries) {
        const fullPath = join(directory, entry.name);
        if (entry.isDirectory()) {
          await walk(fullPath);
        } else if (entry.isFile() && !entry.name.endsWith('.tmp')) {
          result.push(this.toKey(fullPath));
        }
      }
    };

    await walk(start);
    return result.sort();
  }

  private resolveKey(key: string): string {
    if (!key || key.includes('\0')) {
      throw new Error('Invalid content-store key');
    }

    const normalized = key.replace(/\\/g, '/');
    if (normalized.startsWith('/')) {
      throw new Error(
        'Invalid content-store key: absolute paths are not allowed',
      );
    }

    const segments = normalized.split('/');
    if (
      segments.some(
        (segment) => segment === '' || segment === '.' || segment === '..',
      )
    ) {
      throw new Error(
        'Invalid content-store key: path traversal is not allowed',
      );
    }

    const target = resolve(this.root, ...segments);
    const relativePath = relative(this.root, target);
    if (
      relativePath === '' ||
      relativePath === '..' ||
      relativePath.startsWith(`..${sep}`) ||
      isAbsolute(relativePath)
    ) {
      throw new Error('Invalid content-store key: outside storage root');
    }

    return target;
  }

  private resolvePrefix(prefix: string): string {
    const trimmed = prefix.replace(/\/+$/, '');
    if (!trimmed) return this.root;

    const target = this.resolveKey(trimmed);
    return target;
  }

  private toKey(fullPath: string): string {
    return relative(this.root, fullPath).split(sep).join('/');
  }
}
