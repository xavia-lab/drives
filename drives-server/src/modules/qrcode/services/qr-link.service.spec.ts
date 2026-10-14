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

  // Strongly type the mock handlers to match strict parameter passing bounds from the start
  let modelMock: {
    create: jest.Mock<Promise<Partial<QRLink>>, [any?, any?]>;
    findOne: jest.Mock<Promise<Partial<QRLink> | null>, [any?]>;
  };
  let configServiceMock: {
    get: jest.Mock<string | undefined, [string]>;
  };

  const mockPublicUrl = 'https://myapp.com';

  beforeEach(async () => {
    modelMock = {
      create: jest.fn<Promise<Partial<QRLink>>, [any?, any?]>(),
      findOne: jest
        .fn<Promise<Partial<QRLink> | null>, [any?]>()
        .mockResolvedValue(null),
    };

    configServiceMock = {
      get: jest
        .fn<string | undefined, [string]>()
        .mockReturnValue(mockPublicUrl),
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
      (modelMock.create as jest.Mock).mockResolvedValue({}); // Simulate successful creation

      const result = await service.generateShortId(
        dto.resourceType,
        dto.resourceId,
      );

      expect(modelMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          resourceType: dto.resourceType,
          resourceId: dto.resourceId,
          // shortId: expect.any(String),
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

      // Fixed: Cast findOne as a raw jest.Mock to prevent internal tuple mappings from degrading to any on line 75
      (modelMock.findOne as jest.Mock).mockResolvedValue(mockMapping);

      const result = await service.resolve('some-id');

      expect(result.resourceId).toBe('456');
      expect(result.targetUri).toBe('/user/public-show/456');
    });

    it('should throw NotFoundException if record is missing', async () => {
      (modelMock.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.resolve('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should destroy the mapping if found', async () => {
      const mockDestroySpy = jest.fn<Promise<void>, []>();

      // Fixed: Cast findOne as a raw jest.Mock here as well to isolate object resolution parameters safely
      (modelMock.findOne as jest.Mock).mockResolvedValue({
        destroy: mockDestroySpy,
      });

      await service.remove('type', 'id');

      expect(mockDestroySpy).toHaveBeenCalled();
    });

    it('should throw NotFoundException if trying to remove non-existent link', async () => {
      (modelMock.findOne as jest.Mock).mockResolvedValue(null);

      await expect(service.remove('type', 'id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
