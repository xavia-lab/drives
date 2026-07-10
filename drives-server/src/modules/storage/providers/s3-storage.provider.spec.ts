import { S3StorageProvider } from './s3-storage.provider';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { InternalServerErrorException } from '@nestjs/common';
import { mockClient } from 'aws-sdk-client-mock';
import 'aws-sdk-client-mock-jest';

describe('S3StorageProvider', () => {
  let provider: S3StorageProvider;
  const s3Mock = mockClient(S3Client);

  const config = {
    bucket: 'test-bucket',
    region: 'us-east-1',
    key: 'access-key',
    secret: 'secret-key',
    endpoint: 'http://localhost:4566',
  };

  beforeEach(async () => {
    s3Mock.reset();
    provider = new S3StorageProvider(config);
  });

  describe('put', () => {
    it('should successfully upload a file', async () => {
      s3Mock.on(PutObjectCommand).resolves({});

      const buffer = Buffer.from('test data');
      await provider.put('test-key', buffer, 'text/plain');

      expect(s3Mock).toHaveReceivedCommandWith(PutObjectCommand, {
        Bucket: config.bucket,
        Key: 'test-key',
        Body: buffer,
        ContentType: 'text/plain',
      });
    });
  });

  describe('get', () => {
    it('should return a buffer when file exists', async () => {
      const mockStream = {
        transformToByteArray: jest
          .fn()
          .mockResolvedValue(new Uint8Array([1, 2, 3])),
      };

      s3Mock.on(GetObjectCommand).resolves({
        Body: mockStream as any,
      });

      const result = await provider.get('test-key');

      expect(result).toEqual(Buffer.from([1, 2, 3]));
      expect(s3Mock).toHaveReceivedCommandWith(GetObjectCommand, {
        Bucket: config.bucket,
        Key: 'test-key',
      });
    });

    it('should throw InternalServerErrorException if Body is missing', async () => {
      s3Mock.on(GetObjectCommand).resolves({ Body: undefined });

      await expect(provider.get('test-key')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('exists', () => {
    it('should return true if file exists', async () => {
      s3Mock.on(HeadObjectCommand).resolves({});

      const result = await provider.exists('test-key');

      expect(result).toBe(true);
    });

    it('should return false if file does not exist', async () => {
      s3Mock.on(HeadObjectCommand).rejects(new Error('NotFound'));

      const result = await provider.exists('test-key');

      expect(result).toBe(false);
    });
  });

  describe('delete', () => {
    it('should successfully delete a file', async () => {
      s3Mock.on(DeleteObjectCommand).resolves({});

      await provider.delete('test-key');

      expect(s3Mock).toHaveReceivedCommandWith(DeleteObjectCommand, {
        Bucket: config.bucket,
        Key: 'test-key',
      });
    });
  });

  describe('list', () => {
    it('should return a list of keys', async () => {
      s3Mock.on(ListObjectsV2Command).resolves({
        Contents: [
          { Key: 'key1' },
          { Key: 'key2' },
          { Key: undefined }, // Should be filtered out
        ],
      });

      const result = await provider.list('prefix/');

      expect(result).toEqual(['key1', 'key2']);
      expect(s3Mock).toHaveReceivedCommandWith(ListObjectsV2Command, {
        Bucket: config.bucket,
        Prefix: 'prefix/',
      });
    });

    it('should return empty array if no contents', async () => {
      s3Mock.on(ListObjectsV2Command).resolves({ Contents: undefined });

      const result = await provider.list('prefix/');

      expect(result).toEqual([]);
    });
  });
});
