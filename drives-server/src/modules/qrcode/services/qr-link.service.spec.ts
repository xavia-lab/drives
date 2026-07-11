import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { ConfigService } from '@nestjs/config';
import { NotFoundException } from '@nestjs/common';
import { QRLinkService } from './qr-link.service';
import { QRLink } from '../entities/qr-link.entity';

// CRITICAL FIX: Explicitly mock nanoid at the top of the file scope
// This forces Jest to use a simple fallback function and stops it from reading the pure ESM library code
jest.mock('nanoid', () => ({
  nanoid: () => 'mocked-nanoid-id',
}));

describe('QRLinkService', () => {
  let service: QRLinkService;
  let modelMock: any;
  let configServiceMock: any;

  const mockPublicUrl = 'https://myapp.com';

  beforeEach(async () => {
    // 1. Create Mock Objects
    modelMock = {
      create: jest.fn(),
      findOne: jest.fn(),
    };

    configServiceMock = {
      get: jest.fn().mockReturnValue(mockPublicUrl),
    };

    // 2. Build Testing Module
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
  });

  describe('generateShortId', () => {
    it('should create a QR link and return formatted data', async () => {
      const dto = { resourceType: 'product', resourceId: '123' };
      modelMock.create.mockResolvedValue({}); // Simulate successful creation

      const result = await service.generateShortId(
        dto.resourceType,
        dto.resourceId,
      );

      expect(modelMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          resourceType: dto.resourceType,
          resourceId: dto.resourceId,
          shortId: expect.any(String),
        }),
        expect.any(Object),
      );
      expect(result.sourceUrl).toContain(`${mockPublicUrl}qrl/`);
      expect(result.targetUri).toBe('/product/public-show/123');
    });
  });

  describe('resolve', () => {
    it('should return data if record exists', async () => {
      const mockMapping = { resourceType: 'user', resourceId: '456' };
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
      const mockInstance = { destroy: jest.fn() };
      modelMock.findOne.mockResolvedValue(mockInstance);

      await service.remove('type', 'id');

      expect(mockInstance.destroy).toHaveBeenCalled();
    });

    it('should throw NotFoundException if trying to remove non-existent link', async () => {
      modelMock.findOne.mockResolvedValue(null);

      await expect(service.remove('type', 'id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
