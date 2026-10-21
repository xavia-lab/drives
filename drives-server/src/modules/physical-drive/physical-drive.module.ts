import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { PhysicalDriveController } from './physical-drive.controller';
import { PhysicalDriveMediaController } from './physical-drive-media.controller';
import { PhysicalDriveService } from './physical-drive.service';
import { PhysicalDriveMediaService } from './physical-drive-media.service';
import { PhysicalDrive } from './entities/physical-drive.entity';
import { PhysicalDriveLocation } from './entities/physical-drive-location.entity';
import { PhysicalDriveMedia } from './entities/physical-drive-media.entity';
import { DriveModel } from '../drive-model/entities/drive-model.entity';
import { Vendor } from '../vendor/entities/vendor.entity';
import { Currency } from '../currency/entities/currency.entity';
import { Datacenter } from '../datacenter/entities/datacenter.entity';
import { ServerSlotAllocationModule } from '../server-slot-allocation/server-slot-allocation.module';
import { DriveLifecycleEventModule } from '../drive-lifecycle-event/drive-lifecycle-event.module';
import { MediaModule } from '../media/media.module';

@Module({
  imports: [
    SequelizeModule.forFeature([
      PhysicalDrive,
      PhysicalDriveLocation,
      PhysicalDriveMedia,
      DriveModel,
      Vendor,
      Currency,
      Datacenter,
    ]),
    ServerSlotAllocationModule,
    DriveLifecycleEventModule,
    MediaModule,
  ],
  controllers: [PhysicalDriveController, PhysicalDriveMediaController],
  providers: [PhysicalDriveService, PhysicalDriveMediaService],
  exports: [PhysicalDriveService],
})
export class PhysicalDriveModule {}
