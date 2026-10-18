import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { DriveModelController } from './drive-model.controller';
import { DriveModelService } from './drive-model.service';
import { DriveModel } from './entities/drive-model.entity';
import { Capacity } from '../capacity/entities/capacity.entity';
import { FormFactor } from '../form-factor/entities/form-factor.entity';
import { Interface } from '../interface/entities/interface.entity';
import { StorageType } from '../storage-type/entities/storage-type.entity';
import { Vendor } from '../vendor/entities/vendor.entity';

@Module({
  imports: [
    SequelizeModule.forFeature([
      DriveModel,
      Capacity,
      FormFactor,
      Interface,
      StorageType,
      Vendor,
    ]),
  ],
  controllers: [DriveModelController],
  providers: [DriveModelService],
  exports: [DriveModelService],
})
export class DriveModelModule {}
