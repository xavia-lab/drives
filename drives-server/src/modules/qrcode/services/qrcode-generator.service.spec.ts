import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import * as QRCode from 'qrcode';
import { QRCodeGeneratorService } from './qrcode-generator.service';

// Mock the entire qrcode library
jest.mock('qrcode');

describe('QRCodeGeneratorService', () => {
  let service: QRCodeGeneratorService;
  const mockUrl = 'https://mywebsite.com';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QRCodeGeneratorService],
    }).compile();

    service = module.get<QRCodeGeneratorService>(QRCodeGeneratorService);
    jest.clearAllMocks(); // Ensure a clean slate for each test
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generate', () => {
    it('should successfully generate an SVG with default options', async () => {
      const mockSvg = '<svg>...</svg>';
      // Mock the toString implementation to return our mock SVG
      (QRCode.toString as jest.Mock).mockResolvedValue(mockSvg);

      const result = await service.generate(mockUrl);

      expect(result).toEqual({ svg: mockSvg, originalContent: mockUrl });
      expect(QRCode.toString).toHaveBeenCalledWith(
        mockUrl,
        expect.objectContaining({
          type: 'svg',
          errorCorrectionLevel: 'Q',
          margin: 4,
          width: 300,
        }),
      );
    });

    it('should respect custom options when provided', async () => {
      (QRCode.toString as jest.Mock).mockResolvedValue('<svg></svg>');

      const customOptions = {
        errorCorrectionLevel: 'H' as const,
        margin: 10,
        width: 500,
        darkColor: '#FF0000',
        lightColor: '#000000',
      };

      await service.generate(mockUrl, customOptions);

      expect(QRCode.toString).toHaveBeenCalledWith(
        mockUrl,
        expect.objectContaining({
          errorCorrectionLevel: 'H',
          margin: 10,
          width: 500,
          color: { dark: '#FF0000', light: '#000000' },
        }),
      );
    });

    it('should throw InternalServerErrorException if qrcode library fails', async () => {
      const errorMessage = 'Library Error';
      (QRCode.toString as jest.Mock).mockRejectedValue(new Error(errorMessage));

      await expect(service.generate(mockUrl)).rejects.toThrow(
        new InternalServerErrorException(
          `QR SVG generation failed: ${errorMessage}`,
        ),
      );
    });
  });
});
