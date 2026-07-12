import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { WarrantyClaimController } from './warranty-claim.controller';
import { WarrantyClaimService } from './warranty-claim.service';
import { WarrantyClaim } from './entities/warranty-claim.entity';
import { PhysicalDrive } from '../physical-drive/entities/physical-drive.entity';
import { DriveLifecycleEvent } from '../drive-lifecycle-event/entities/drive-lifecycle-event.entity';
import { Vendor } from '../vendor/entities/vendor.entity';

@Module({
  imports: [
    SequelizeModule.forFeature([
      WarrantyClaim,
      PhysicalDrive,
      DriveLifecycleEvent,
      Vendor,
    ]),
  ],
  controllers: [WarrantyClaimController],
  providers: [WarrantyClaimService],
  exports: [WarrantyClaimService],
})
export class WarrantyClaimModule {}
