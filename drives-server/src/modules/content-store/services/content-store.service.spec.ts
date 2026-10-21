import { Test, TestingModule } from '@nestjs/testing';
import { ContentStoreService } from './content-store.service';
import { InternalServerErrorException } from '@nestjs/common';
import {
  CONTENT_STORE_PROVIDER,
  type ContentStoreProvider,
} from '../interfaces/content-store-provider.interface';
import { describe, it, expect, beforeEach, vi, type Mocked } from 'vitest'; // 🚀 Pure ESM imports from Vitest

describe('ContentStoreService', () => {
  let service: ContentStoreService;
  let storageMock: Mocked<ContentStoreProvider>; // 🚀 Swapped out legacy jest.Mocked mapping for Vitest Mocked utility

  const testBuffer = Buffer.from('nest-storage-test');
  // SHA-256 for "nest-storage-test"
  const expectedHash =
    'dccb57bb4f96b6cc895393303ebf09f8fdd3fcfa3e3889975fb5e977e81cfca2';
  const prefix = 'objects/';

  beforeEach(async () => {
    storageMock = {
      put: vi.fn(), // 🚀 Using Vitest vi.fn() mock engine trackers
      get: vi.fn(),
      exists: vi.fn(),
      delete: vi.fn(),
      list: vi.fn(),
      listDetailed: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContentStoreService,
        {
          provide: CONTENT_STORE_PROVIDER,
          useValue: storageMock,
        },
      ],
    }).compile();

    service = module.get<ContentStoreService>(ContentStoreService);
  });

  describe('upload', () => {
    it('should return existing fileId and skip upload if hash already exists', async () => {
      storageMock.exists.mockResolvedValue(true);

      const result = await service.upload(testBuffer, 'image/png');

      expect(result).toEqual({ fileId: expectedHash, isNew: false });
      expect(storageMock.put).not.toHaveBeenCalled();
    });

    it('should upload both data and sidecar json if file is new', async () => {
      storageMock.exists.mockResolvedValue(false);
      storageMock.put.mockResolvedValue(undefined);

      const metadata = { customField: 'test' };
      const result = await service.upload(testBuffer, 'image/png', metadata);

      expect(result).toEqual({ fileId: expectedHash, isNew: true });

      // Check data upload
      expect(storageMock.put).toHaveBeenCalledWith(
        `${prefix}${expectedHash}`,
        testBuffer,
        'image/png',
      );

      // Check metadata sidecar upload
      expect(storageMock.put).toHaveBeenCalledWith(
        `${prefix}${expectedHash}.json`,
        expect.any(Buffer),
        'application/json',
      );
    });

    it('should throw InternalServerErrorException on storage failure', async () => {
      storageMock.exists.mockResolvedValue(false);
      storageMock.put.mockRejectedValue(new Error('S3 Down'));

      await expect(service.upload(testBuffer, 'image/png')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('getFileBuffer', () => {
    it('should retrieve the raw buffer from storage', async () => {
      storageMock.get.mockResolvedValue(testBuffer);

      const result = await service.getFileBuffer(expectedHash);

      expect(result).toEqual(testBuffer);
      expect(storageMock.get).toHaveBeenCalledWith(`${prefix}${expectedHash}`);
    });
  });

  describe('getMetadata', () => {
    it('should return parsed JSON object if sidecar exists', async () => {
      const mockMeta = {
        mimetype: 'image/png',
        updatedAt: new Date().toISOString(),
      };
      storageMock.get.mockResolvedValue(Buffer.from(JSON.stringify(mockMeta)));

      const result = await service.getMetadata(expectedHash);

      expect(result).toEqual(mockMeta);
      expect(storageMock.get).toHaveBeenCalledWith(
        `${prefix}${expectedHash}.json`,
      );
    });

    it('should return null if sidecar does not exist or fails to parse', async () => {
      storageMock.get.mockRejectedValue(new Error('Not Found'));

      const result = await service.getMetadata('invalid-id');

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete both the object and its metadata sidecar', async () => {
      storageMock.delete.mockResolvedValue(undefined);

      await service.delete(expectedHash);

      expect(storageMock.delete).toHaveBeenCalledWith(
        `${prefix}${expectedHash}`,
      );
      expect(storageMock.delete).toHaveBeenCalledWith(
        `${prefix}${expectedHash}.json`,
      );
    });
  });

  describe('listHashes', () => {
    it('should filter out .json files and return only hashes', async () => {
      const first = 'a'.repeat(64);
      const second = 'b'.repeat(64);
      const mockObjects = [
        { key: `${prefix}${first}`, lastModified: new Date() },
        { key: `${prefix}${first}.json`, lastModified: new Date() },
        { key: `${prefix}${second}`, lastModified: new Date() },
        { key: `${prefix}${second}.json`, lastModified: new Date() },
        { key: `${prefix}not-a-hash`, lastModified: new Date() },
      ];
      storageMock.listDetailed.mockResolvedValue(mockObjects);

      const result = await service.listHashes();

      expect(result).toEqual([first, second]);
    });
  });
});
