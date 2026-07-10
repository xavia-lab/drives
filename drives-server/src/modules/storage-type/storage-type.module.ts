import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { StorageTypeController } from './storage-type.controller';
import { StorageTypeService } from './storage-type.service';
import { StorageType } from './entities/storage-type.entity';
import { QueryBuilderService } from '../../common/services/query-builder/query-builder.service';

@Module({
  imports: [SequelizeModule.forFeature([StorageType])],
  controllers: [StorageTypeController],
  providers: [StorageTypeService, QueryBuilderService],
  exports: [StorageTypeService],
})
export class StorageTypeModule {}
