import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QRCodeGeneratorService } from './qrcode-generator.service';
import { ContentAddressableStorageService } from '../../storage/services/content-addressable-storage.service';
import { QRStorageResult } from '../interfaces/qrcode-interfaces';

@Injectable()
export class QRCodeStorageService {
  constructor(
    private readonly config: ConfigService,
    private readonly generator: QRCodeGeneratorService,
    private readonly cas: ContentAddressableStorageService,
  ) {}

  /**
   * Generates and persists a QR code as an SVG.
   */
  async getOrCreateQRCode(
    url: string,
    extraMetadata: Record<string, any> = {},
  ): Promise<QRStorageResult> {
    // 1. Generate the SVG string using the URL from input
    // Best Practice: Ensure we pass the URL string, not the object
    const { svg, originalContent } = await this.generator.generate(url);

    // 2. Convert SVG string to Buffer for CAS storage
    const buffer = Buffer.from(svg);
    const mimeType = 'image/svg+xml';

    // 3. Upload to CAS with correct MIME type
    const result = await this.cas.upload(buffer, mimeType, {
      ...extraMetadata,
      originalContent: originalContent,
      generatedBy: 'QRCodeStorageService',
      generatedAt: new Date().toISOString(),
      encoding: 'UTF-8',
    });

    return {
      fileId: result.fileId,
      isNew: result.isNew,
      mimeType: mimeType,
      fileExtension: 'svg',
    };
  }
}
