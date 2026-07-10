import { Module } from '@nestjs/common';
import { QRCodeGeneratorService } from './services/qrcode-generator.service';
import { QRCodeStorageService } from './services/qrcode-storage.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { QRLink } from './entities/qr-link.entity';
import { QRLinkService } from './services/qr-link.service';
import { QrController } from './controllers/qr.controller';

@Module({
  imports: [SequelizeModule.forFeature([QRLink])],
  providers: [QRCodeGeneratorService, QRCodeStorageService, QRLinkService],
  controllers: [QrController],
  exports: [QRCodeGeneratorService, QRCodeStorageService, QRLinkService],
})
export class QRCodeModule {}
