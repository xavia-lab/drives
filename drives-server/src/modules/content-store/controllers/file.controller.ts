import {
  Controller,
  Get,
  Param,
  NotFoundException,
  StreamableFile,
  Header,
  Res,
} from '@nestjs/common';
import { ContentStoreService } from '../services/content-store.service';
import { Public } from '../../../common/decorators/public.decorator';

// Define a safe platform-agnostic interface layout for the response parameter
interface PlatformResponse {
  setHeader?: (name: string, value: string) => void;
  set?: (headers: Record<string, string>) => void;
}

@Controller('files')
export class FileController {
  constructor(private readonly cas: ContentStoreService) {}

  @Public()
  @Get(':fileId')
  @Header('Cache-Control', 'public, max-age=31536000, immutable')
  @Header('Cross-Origin-Resource-Policy', 'cross-origin')
  async getFile(
    @Param('fileId') fileId: string,
    // Fixed: Swapped out 'any' for the clear structural layout template interface
    @Res({ passthrough: true }) res: PlatformResponse,
  ): Promise<StreamableFile> {
    try {
      const metadata = await this.cas.getMetadata(fileId);
      if (!metadata) {
        throw new NotFoundException('File metadata not found');
      }

      const buffer = await this.cas.getFileBuffer(fileId);

      const originalName =
        typeof metadata.originalName === 'string'
          ? metadata.originalName
          : null;
      const fileName =
        typeof metadata.fileName === 'string' ? metadata.fileName : null;

      const displayName = originalName || fileName || fileId;

      // Safe conditional checking against our structural type definitions
      if (res.setHeader) {
        res.setHeader(
          'Content-Type',
          (metadata.mimetype as string) || 'application/octet-stream',
        );
        res.setHeader(
          'Content-Disposition',
          `inline; filename="${encodeURIComponent(displayName)}"`,
        );
      } else if (res.set) {
        res.set({
          'Content-Type':
            (metadata.mimetype as string) || 'application/octet-stream',
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
