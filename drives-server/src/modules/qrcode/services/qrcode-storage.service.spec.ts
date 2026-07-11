import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { QRCodeStorageService } from './qrcode-storage.service';
import { QRCodeGeneratorService } from './qrcode-generator.service';
import { ContentAddressableStorageService } from '../../storage/services/content-addressable-storage.service';

describe('QRCodeStorageService', () => {
  let service: QRCodeStorageService;
  let generator: QRCodeGeneratorService;
  let cas: ContentAddressableStorageService;

  const mockUrl = 'https://mywebsite.com';
  const mockSvg = '<svg>mock</svg>';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QRCodeStorageService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn() },
        },
        {
          provide: QRCodeGeneratorService,
          useValue: { generate: jest.fn() },
        },
        {
          provide: ContentAddressableStorageService,
          useValue: { upload: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<QRCodeStorageService>(QRCodeStorageService);
    generator = module.get<QRCodeGeneratorService>(QRCodeGeneratorService);
    cas = module.get<ContentAddressableStorageService>(
      ContentAddressableStorageService,
    );

    // Mocking Date to ensure metadata consistency in tests
    jest.useFakeTimers().setSystemTime(new Date('2024-01-01'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should generate an SVG, convert to buffer, and upload to CAS', async () => {
    // 1. Setup Mocks
    (generator.generate as jest.Mock).mockResolvedValue({
      svg: mockSvg,
      originalContent: mockUrl,
    });

    (cas.upload as jest.Mock).mockResolvedValue({
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
    (generator.generate as jest.Mock).mockRejectedValue(new Error('Gen Error'));

    await expect(service.getOrCreateQRCode(mockUrl)).rejects.toThrow(
      'Gen Error',
    );
    expect(cas.upload).not.toHaveBeenCalled();
  });
});
