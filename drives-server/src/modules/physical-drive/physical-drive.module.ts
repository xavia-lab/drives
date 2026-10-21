import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { PhysicalDriveController } from './physical-drive.controller';
import { PhysicalDriveService } from './physical-drive.service';
import { PhysicalDrive } from './entities/physical-drive.entity';
import { PhysicalDriveLocation } from './entities/physical-drive-location.entity';
import { PhysicalDriveMedia } from './entities/physical-drive-media.entity';
import { DriveModel } from '../drive-model/entities/drive-model.entity';
import { Vendor } from '../vendor/entities/vendor.entity';
import { Currency } from '../currency/entities/currency.entity';
import { Datacenter } from '../datacenter/entities/datacenter.entity';
import { ServerSlotAllocationModule } from '../server-slot-allocation/server-slot-allocation.module';
import { DriveLifecycleEventModule } from '../drive-lifecycle-event/drive-lifecycle-event.module';

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
  ],
  controllers: [PhysicalDriveController],
  providers: [PhysicalDriveService],
  exports: [PhysicalDriveService],
})
export class PhysicalDriveModule {}
