import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { ConfigService } from '@nestjs/config';
import { NotFoundException } from '@nestjs/common';
import { QRLinkService } from './qr-link.service';
import { QRLink } from '../entities/qr-link.entity';
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest'; // 🚀 Pure ESM imports from Vitest

// 🚀 Critical Vitest hoisting factory mock for pure ESM libraries like nanoid
vi.mock('nanoid', () => ({
  nanoid: () => 'mocked-nanoid-id',
}));

describe('QRLinkService', () => {
  let service: QRLinkService;

  // 🚀 Explicit Vitest mock types replace legacy configuration definitions
  let modelMock: {
    create: Mock;
    findOne: Mock;
  };
  let configServiceMock: {
    get: Mock;
  };

  const mockPublicUrl = 'https://myapp.com';

  beforeEach(async () => {
    modelMock = {
      create: vi.fn(), // 🚀 Swapped out legacy jest.fn() with vitest vi.fn()
      findOne: vi.fn().mockResolvedValue(null),
    };

    configServiceMock = {
      get: vi.fn().mockReturnValue(mockPublicUrl),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QRLinkService,
        {
          provide: getModelToken(QRLink),
          useValue: modelMock,
        },
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
      ],
    }).compile();

    service = module.get<QRLinkService>(QRLinkService);
    vi.clearAllMocks(); // 🚀 Clean slate context verification
  });

  describe('generateShortId', () => {
    it('should create a QR link and return formatted data', async () => {
      const dto = { resourceType: 'product', resourceId: '123' };
      modelMock.create.mockResolvedValue({});

      const result = await service.generateShortId(
        dto.resourceType,
        dto.resourceId,
      );

      expect(modelMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          resourceType: dto.resourceType,
          resourceId: dto.resourceId,
        }),
        expect.any(Object),
      );
      expect(result.sourceUrl).toContain(`${mockPublicUrl}qrl/`);
      expect(result.targetUri).toBe('/product/public-show/123');
    });
  });

  describe('resolve', () => {
    it('should return data if record exists', async () => {
      const mockMapping = {
        resourceType: 'user',
        resourceId: '456',
      } as unknown as Partial<QRLink>;

      modelMock.findOne.mockResolvedValue(mockMapping);

      const result = await service.resolve('some-id');

      expect(result.resourceId).toBe('456');
      expect(result.targetUri).toBe('/user/public-show/456');
    });

    it('should throw NotFoundException if record is missing', async () => {
      modelMock.findOne.mockResolvedValue(null);

      await expect(service.resolve('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should destroy the mapping if found', async () => {
      const mockDestroySpy = vi.fn();

      modelMock.findOne.mockResolvedValue({
        destroy: mockDestroySpy,
      });

      await service.remove('type', 'id');

      expect(mockDestroySpy).toHaveBeenCalled();
    });

    it('should throw NotFoundException if trying to remove non-existent link', async () => {
      modelMock.findOne.mockResolvedValue(null);

      await expect(service.remove('type', 'id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
