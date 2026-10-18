import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { PhysicalDriveController } from './physical-drive.controller';
import { PhysicalDriveService } from './physical-drive.service';
import { PhysicalDrive } from './entities/physical-drive.entity';
import { DriveModel } from '../drive-model/entities/drive-model.entity';
import { Vendor } from '../vendor/entities/vendor.entity';
import { Currency } from '../currency/entities/currency.entity';

@Module({
  imports: [
    SequelizeModule.forFeature([PhysicalDrive, DriveModel, Vendor, Currency]),
  ],
  controllers: [PhysicalDriveController],
  providers: [PhysicalDriveService],
  exports: [PhysicalDriveService],
})
export class PhysicalDriveModule {}
