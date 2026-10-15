import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import * as QRCode from 'qrcode';
import { QRCodeGeneratorService } from './qrcode-generator.service';
import { describe, it, expect, beforeEach, vi } from 'vitest'; // 🚀 Pure ESM imports from Vitest

// 🚀 Mock the entire qrcode library using Vitest module tracking factory architecture
vi.mock('qrcode', () => {
  return {
    toString: vi.fn(),
  };
});

describe('QRCodeGeneratorService', () => {
  let service: QRCodeGeneratorService;
  const mockUrl = 'https://mywebsite.com';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QRCodeGeneratorService],
    }).compile();

    service = module.get<QRCodeGeneratorService>(QRCodeGeneratorService);
    vi.clearAllMocks(); // 🚀 Clean slate tracking verification using Vitest loop context
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generate', () => {
    it('should successfully generate an SVG with default options', async () => {
      const mockSvg = '<svg>...</svg>';
      // 🚀 Using vi.mocked utility for type-safe assertion casting
      vi.mocked(QRCode.toString).mockResolvedValue(mockSvg);

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
      vi.mocked(QRCode.toString).mockResolvedValue('<svg></svg>');

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
      vi.mocked(QRCode.toString).mockRejectedValue(new Error(errorMessage));

      await expect(service.generate(mockUrl)).rejects.toThrow(
        new InternalServerErrorException(
          `QR SVG generation failed: ${errorMessage}`,
        ),
      );
    });
  });
});
