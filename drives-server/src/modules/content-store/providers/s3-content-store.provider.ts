import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { InternalServerErrorException } from '@nestjs/common';
import {
  ContentStoreObject,
  ContentStoreProvider,
} from '../interfaces/content-store-provider.interface';
import { S3ContentStoreConfig } from '../interfaces/content-store-config.interface';

export class S3ContentStoreProvider implements ContentStoreProvider {
  private client: S3Client;
  private bucket: string;

  // 2. Apply the interface to the constructor parameters
  constructor(config: S3ContentStoreConfig) {
    this.bucket = config.bucket;
    this.client = new S3Client({
      region: config.region,
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.key,
        secretAccessKey: config.secret,
      },
      forcePathStyle: config.forcePathStyle ?? true,
    });
  }

  async put(key: string, body: Buffer, contentType?: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
  }

  async get(key: string): Promise<Buffer> {
    const res = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    );

    if (!res.Body) {
      throw new InternalServerErrorException(
        `S3 Object body is empty for key: ${key}`,
      );
    }

    return Buffer.from(await res.Body.transformToByteArray());
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      return true;
    } catch {
      return false;
    }
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }

  async list(prefix: string): Promise<string[]> {
    return (await this.listDetailed(prefix)).map((object) => object.key);
  }

  async listDetailed(prefix: string): Promise<ContentStoreObject[]> {
    const res = await this.client.send(
      new ListObjectsV2Command({ Bucket: this.bucket, Prefix: prefix }),
    );

    return (res.Contents ?? [])
      .filter((entry): entry is typeof entry & { Key: string } => !!entry.Key)
      .map((entry) => ({
        key: entry.Key,
        lastModified: entry.LastModified ?? null,
      }));
  }
}
