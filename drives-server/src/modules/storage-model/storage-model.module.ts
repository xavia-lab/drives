import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { StorageModelController } from './storage-model.controller';
import { StorageModelService } from './storage-model.service';
import { StorageModel } from './entities/storage-model.entity';
import { Capacity } from '../capacity/entities/capacity.entity';
import { FormFactor } from '../form-factor/entities/form-factor.entity';
import { Interface } from '../interface/entities/interface.entity';
import { StorageType } from '../storage-type/entities/storage-type.entity';
import { Vendor } from '../vendor/entities/vendor.entity';

@Module({
  imports: [
    SequelizeModule.forFeature([
      StorageModel,
      Capacity,
      FormFactor,
      Interface,
      StorageType,
      Vendor,
    ]),
  ],
  controllers: [StorageModelController],
  providers: [StorageModelService],
  exports: [StorageModelService],
})
export class StorageModelModule {}
