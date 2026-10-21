import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { QRCodeStorageService } from './qrcode-storage.service';
import { QRCodeGeneratorService } from './qrcode-generator.service';
import { ContentStoreService } from '../../content-store/services/content-store.service';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'; // 🚀 Pure ESM imports from Vitest

describe('QRCodeStorageService', () => {
  let service: QRCodeStorageService;
  let generator: QRCodeGeneratorService;
  let cas: ContentStoreService;

  const mockUrl = 'https://mywebsite.com';
  const mockSvg = '<svg>mock</svg>';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QRCodeStorageService,
        {
          provide: ConfigService,
          useValue: { get: vi.fn() }, // 🚀 Using Vitest vi.fn() mock engine trackers
        },
        {
          provide: QRCodeGeneratorService,
          useValue: { generate: vi.fn() },
        },
        {
          provide: ContentStoreService,
          useValue: { upload: vi.fn() },
        },
      ],
    }).compile();

    service = module.get<QRCodeStorageService>(QRCodeStorageService);
    generator = module.get<QRCodeGeneratorService>(QRCodeGeneratorService);
    cas = module.get<ContentStoreService>(ContentStoreService);

    // 🚀 Mocking Date to ensure metadata consistency across Vitest execution contexts
    vi.useFakeTimers().setSystemTime(new Date('2024-01-01'));
  });

  afterEach(() => {
    vi.useRealTimers(); // 🚀 Safely restoring system clock timelines post-evaluation
  });

  it('should generate an SVG, convert to buffer, and upload to CAS', async () => {
    // 1. Setup Mocks using vi.mocked for robust type safety
    vi.mocked(generator.generate).mockResolvedValue({
      svg: mockSvg,
      originalContent: mockUrl,
    });

    vi.mocked(cas.upload).mockResolvedValue({
      fileId: 'sha256-hash',
      isNew: true,
    });

    // 2. Execute
    const result = await service.getOrCreateQRCode(mockUrl, {
      userId: 'user-1',
    });

    // 3. Assertions
    expect(generator.generate).toHaveBeenCalledWith(mockUrl);

    // Verify Buffer conversion
    const expectedBuffer = Buffer.from(mockSvg);
    expect(cas.upload).toHaveBeenCalledWith(
      expectedBuffer,
      'image/svg+xml',
      expect.objectContaining({
        userId: 'user-1',
        originalContent: mockUrl,
        generatedBy: 'QRCodeStorageService',
        generatedAt: '2024-01-01T00:00:00.000Z',
      }),
    );

    // Verify Output
    expect(result).toEqual({
      fileId: 'sha256-hash',
      isNew: true,
      mimeType: 'image/svg+xml',
      fileExtension: 'svg',
    });
  });

  it('should propagate errors from the generator service', async () => {
    vi.mocked(generator.generate).mockRejectedValue(new Error('Gen Error'));

    await expect(service.getOrCreateQRCode(mockUrl)).rejects.toThrow(
      'Gen Error',
    );
    expect(cas.upload).not.toHaveBeenCalled();
  });
});
