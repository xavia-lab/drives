import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as QRCode from 'qrcode';
import { QRGenerationOutput, QROptions } from '../interfaces/qrcode-interfaces';

@Injectable()
export class QRCodeGeneratorService {
  /**
   * Generates a high-quality, scalable SVG string for professional use.
   */
  async generate(
    url: string,
    options?: QROptions,
  ): Promise<QRGenerationOutput> {
    try {
      const svg = await QRCode.toString(url, {
        type: 'svg',
        // 'Q' (25% restoration) is recommended for physical items prone to wear
        errorCorrectionLevel: options?.errorCorrectionLevel || 'Q',
        // Industry standard "Quiet Zone" is 4 modules
        margin: options?.margin ?? 4,
        // Width for SVGs acts as a base viewbox size
        width: options?.width || 300,
        color: {
          dark: options?.darkColor || '#000000',
          light: options?.lightColor || '#ffffff',
        },
      });

      return { svg: svg, originalContent: url };
    } catch (error) {
      throw new InternalServerErrorException(
        `QR SVG generation failed: ${error.message}`,
      );
    }
  }
}
