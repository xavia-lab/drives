import {
  Controller,
  Get,
  Param,
  NotFoundException,
  StreamableFile,
  Header,
  Res,
} from '@nestjs/common';
import { ContentAddressableStorageService } from '../services/content-addressable-storage.service';
import { Public } from '../../../common/decorators/public.decorator';

@Controller('files')
export class FileController {
  constructor(private readonly cas: ContentAddressableStorageService) {}

  @Public()
  @Get(':fileId')
  @Header('Cache-Control', 'public, max-age=31536000, immutable')
  @Header('Cross-Origin-Resource-Policy', 'cross-origin')
  async getFile(
    @Param('fileId') fileId: string,
    @Res({ passthrough: true }) res: any, // Change 'Response' to 'any' or an abstract object record to sever the express link
  ): Promise<StreamableFile> {
    try {
      const metadata = await this.cas.getMetadata(fileId);
      if (!metadata) {
        throw new NotFoundException('File metadata not found');
      }

      const buffer = await this.cas.getFileBuffer(fileId);

      // Determine the filename from metadata
      const displayName = metadata.originalName || metadata.fileName || fileId;

      // Platform-agnostic manual resolution header maps
      if (typeof res.setHeader === 'function') {
        res.setHeader(
          'Content-Type',
          metadata.mimetype || 'application/octet-stream',
        );
        res.setHeader(
          'Content-Disposition',
          `inline; filename="${encodeURIComponent(displayName)}"`,
        );
      } else if (typeof res.set === 'function') {
        res.set({
          'Content-Type': metadata.mimetype || 'application/octet-stream',
          'Content-Disposition': `inline; filename="${encodeURIComponent(displayName)}"`,
        });
      }

      return new StreamableFile(buffer);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new NotFoundException(
        `File with ID ${fileId} could not be retrieved`,
      );
    }
  }
}
