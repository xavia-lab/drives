import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { nanoid } from 'nanoid';
import { QRLink } from '../entities/qr-link.entity';
import { Transaction } from 'sequelize';
import { QRCodeLinkData } from '../interfaces/qrcode-interfaces';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class QRLinkService {
  constructor(
    @InjectModel(QRLink)
    private qrLinkRepository: typeof QRLink, // Inject the model directly
    private configService: ConfigService,
  ) {}

  private readonly logger = new Logger(QRLinkService.name);

  async generateShortId(
    resourceType: string,
    resourceId: string,
    transaction?: Transaction,
  ): Promise<QRCodeLinkData> {
    const shortId = nanoid(21);
    await this.qrLinkRepository.create(
      { shortId, resourceType, resourceId },
      { transaction },
    );
    return {
      shortId: shortId,
      resourceType: resourceType,
      resourceId: resourceId,
      targetUri: `/${resourceType}/public-show/${resourceId}`,
      sourceUrl: `${this.getPublicAppURL()}qrl/${shortId}`,
    };
  }

  async resolve(shortId: string): Promise<QRCodeLinkData> {
    const mapping = await this.qrLinkRepository.findOne({ where: { shortId } });
    if (!mapping) throw new NotFoundException('QR Code Link not found');
    return this.buildResponse(shortId, mapping);
  }

  async findByResource(
    resourceType: string,
    resourceId: string,
  ): Promise<QRCodeLinkData> {
    const mapping = await this.qrLinkRepository.findOne({
      where: {
        resourceType: resourceType,
        resourceId: resourceId,
      },
    });

    if (!mapping) {
      const msg = `No QR link found for (resourceType: ${resourceType}, resourceId: ${resourceId})`;
      this.logger.log(msg);
      throw new NotFoundException(msg);
    }
    return this.buildResponse(mapping.shortId, mapping);
  }

  private buildResponse(shortId: string, mapping: QRLink) {
    return {
      shortId: shortId,
      resourceType: mapping.resourceType,
      resourceId: mapping.resourceId,
      targetUri: `/${mapping.resourceType}/public-show/${mapping.resourceId}`,
      sourceUrl: `${this.getPublicAppURL()}qrl/${shortId}`,
    };
  }

  private getPublicAppURL() {
    return this.configService.get<string>('app.publicUrl');
  }

  async remove(
    resourceType: string,
    resourceId: string,
    transaction?: Transaction,
  ): Promise<void> {
    const mapping = await this.qrLinkRepository.findOne({
      where: { resourceType: resourceType, resourceId: resourceId },
    });

    if (!mapping) throw new NotFoundException('QR Code Link not found');

    await mapping.destroy({ transaction: transaction });
  }
}
