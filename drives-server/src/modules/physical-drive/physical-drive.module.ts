import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { PhysicalDriveController } from './physical-drive.controller';
import { PhysicalDriveService } from './physical-drive.service';
import { PhysicalDrive } from './entities/physical-drive.entity';
import { PhysicalDriveLocation } from './entities/physical-drive-location.entity';
import { DriveModel } from '../drive-model/entities/drive-model.entity';
import { Vendor } from '../vendor/entities/vendor.entity';
import { Currency } from '../currency/entities/currency.entity';
import { Datacenter } from '../datacenter/entities/datacenter.entity';
import { ServerSlotAllocationModule } from '../server-slot-allocation/server-slot-allocation.module';

@Module({
  imports: [
    SequelizeModule.forFeature([
      PhysicalDrive,
      PhysicalDriveLocation,
      DriveModel,
      Vendor,
      Currency,
      Datacenter,
    ]),
    ServerSlotAllocationModule,
  ],
  controllers: [PhysicalDriveController],
  providers: [PhysicalDriveService],
  exports: [PhysicalDriveService],
})
export class PhysicalDriveModule {}
