import {
  Injectable,
  Inject,
  InternalServerErrorException,
} from '@nestjs/common';
import { createHash } from 'crypto';
import { type IStorageProvider } from '../interfaces/storage-provider.interface';

@Injectable()
export class ContentAddressableStorageService {
  private readonly prefix = 'objects/';

  constructor(
    @Inject('STORAGE_PROVIDER') private readonly storage: IStorageProvider,
  ) {}

  async uploadFile(
    file: Express.Multer.File,
    extraMetadata: Record<string, unknown> = {}, // Fixed: Changed 'any' to 'unknown'
  ) {
    return this.upload(file.buffer, file.mimetype, {
      ...extraMetadata, // Merge custom metadata first
      originalName: file.originalname,
      size: file.size,
    });
  }

  async upload(
    buffer: Buffer,
    mimetype: string,
    metadata: Record<string, unknown> = {}, // Fixed: Changed 'any' to 'unknown'
  ) {
    const fileId = createHash('sha256').update(buffer).digest('hex');
    const path = `${this.prefix}${fileId}`;
    const metaPath = `${path}.json`;

    if (await this.storage.exists(path)) return { fileId, isNew: false };

    try {
      await this.storage.put(path, buffer, mimetype);
      // Store the mimetype and timestamps in the sidecar
      const sidecar = JSON.stringify({
        ...metadata,
        mimetype,
        updatedAt: new Date(),
      });
      await this.storage.put(
        metaPath,
        Buffer.from(sidecar),
        'application/json',
      );
      return { fileId, isNew: true };
    } catch (e) {
      const err = e as Error; // Fixed: Explicitly typed 'err'
      throw new InternalServerErrorException(`Upload failed: ${err.message}`);
    }
  }

  /**
   * Retrieves the raw file bytes
   */
  async getFileBuffer(fileId: string): Promise<Buffer> {
    return this.storage.get(`${this.prefix}${fileId}`);
  }

  /**
   * Retrieves and parses the sidecar .json metadata file
   */
  async getMetadata(fileId: string): Promise<Record<string, unknown> | null> {
    // Fixed: Changed 'any' to 'unknown'
    try {
      const metaBuffer = await this.storage.get(`${this.prefix}${fileId}.json`);
      // Fixed: Cast the JSON output to avoid implicit 'any' return types
      return JSON.parse(metaBuffer.toString()) as Record<string, unknown>;
    } catch {
      // Fixed: Removed the unused variable identifier 'e'
      // Return null if metadata doesn't exist to allow the controller to handle 404
      return null;
    }
  }

  async delete(fileId: string) {
    await this.storage.delete(`${this.prefix}${fileId}`);
    await this.storage.delete(`${this.prefix}${fileId}.json`);
  }

  async listHashes(): Promise<string[]> {
    const files = await this.storage.list(this.prefix);
    return files
      .filter((f) => !f.endsWith('.json'))
      .map((f) => f.replace(this.prefix, ''));
  }
}
