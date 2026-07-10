import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  NotFoundException,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { QRLinkService } from '../services/qr-link.service';
import { Public } from '../../../common/decorators/public.decorator';
import { QrLinkResponseDto } from '../dto/response/qr-link-response.dto';
import { Serialize } from '../../../common/interceptors/serialize.interceptor';
import { LookupQrLinkDto } from '../dto/lookup-qr-link.dto';

@Controller('qr-resolver')
export class QrController {
  constructor(private readonly qrLinkService: QRLinkService) {}

  /**
   * Get shortId given resourceType and resourceId
   * GET /qr-resolver/lookup?resourceType=products&resourceId=123
   */
  @Get('lookup')
  @Serialize(QrLinkResponseDto)
  async lookup(
    @Query(ValidationPipe) query: LookupQrLinkDto,
  ): Promise<QrLinkResponseDto> {
    const { resourceType, resourceId } = query;
    console.log(`Query: ${JSON.stringify(query)}`);
    const mapping = await this.qrLinkService.findByResource(
      resourceType,
      resourceId,
    );

    if (!mapping) {
      throw new NotFoundException(
        `No QR link found for ${resourceType} ID ${resourceId}`,
      );
    }

    return mapping;
  }

  /**
   * Endpoint for Next.js Middleware to resolve a Short ID.
   * GET /qr-resolver/:shortId
   */
  @Public()
  @Get(':shortId')
  @Serialize(QrLinkResponseDto)
  async resolve(@Param('shortId') shortId: string): Promise<QrLinkResponseDto> {
    const mapping = await this.qrLinkService.resolve(shortId);

    if (!mapping) {
      throw new NotFoundException('Invalid QR code');
    }

    return mapping;
  }

  /**
   * Endpoint to create a new QR mapping for a resource.
   * POST /qr-resolver/generate
   */
  @Post('generate')
  @Serialize(QrLinkResponseDto)
  async generate(
    @Body() body: { resourceType: string; resourceId: string },
  ): Promise<QrLinkResponseDto> {
    return await this.qrLinkService.generateShortId(
      body.resourceType,
      body.resourceId,
    );
  }
}
