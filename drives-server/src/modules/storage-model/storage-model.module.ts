import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { StorageModelController } from './storage-model.controller';
import { StorageModelService } from './storage-model.service';
import { StorageModel } from './entities/storage-model.entity';
import { QueryBuilderService } from '../../common/services/query-builder/query-builder.service';

@Module({
  imports: [SequelizeModule.forFeature([StorageModel])],
  controllers: [StorageModelController],
  providers: [StorageModelService, QueryBuilderService],
  exports: [StorageModelService],
})
export class StorageModelModule {}
