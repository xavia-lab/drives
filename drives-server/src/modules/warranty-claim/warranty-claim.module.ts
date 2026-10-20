import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { WarrantyClaimController } from './warranty-claim.controller';
import { WarrantyClaimEventController } from './warranty-claim-event.controller';
import { WarrantyClaimTrackingController } from './warranty-claim-tracking.controller';
import { WarrantyClaimService } from './warranty-claim.service';
import { WarrantyClaimEventService } from './warranty-claim-event.service';
import { WarrantyClaim } from './entities/warranty-claim.entity';
import { WarrantyClaimEvent } from './entities/warranty-claim-event.entity';
import { PhysicalDrive } from '../physical-drive/entities/physical-drive.entity';
import { PhysicalDriveLocation } from '../physical-drive/entities/physical-drive-location.entity';
import { DriveLifecycleEvent } from '../drive-lifecycle-event/entities/drive-lifecycle-event.entity';
import { DriveLifecycleEventModule } from '../drive-lifecycle-event/drive-lifecycle-event.module';
import { ServerSlotAllocationModule } from '../server-slot-allocation/server-slot-allocation.module';
import { Vendor } from '../vendor/entities/vendor.entity';
import { User } from '../user/entities/user.entity';

@Module({
  imports: [
    SequelizeModule.forFeature([
      WarrantyClaim,
      WarrantyClaimEvent,
      PhysicalDrive,
      PhysicalDriveLocation,
      DriveLifecycleEvent,
      Vendor,
      User,
    ]),
    DriveLifecycleEventModule,
    ServerSlotAllocationModule,
  ],
  controllers: [
    WarrantyClaimController,
    WarrantyClaimEventController,
    WarrantyClaimTrackingController,
  ],
  providers: [WarrantyClaimService, WarrantyClaimEventService],
  exports: [WarrantyClaimService, WarrantyClaimEventService],
})
export class WarrantyClaimModule {}
