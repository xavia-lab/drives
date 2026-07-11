import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { CapacityController } from './capacity.controller';
import { CapacityService } from './capacity.service';
import { Capacity } from './entities/capacity.entity';
import { QueryBuilderService } from '../../common/services/query-builder/query-builder.service';

@Module({
  imports: [SequelizeModule.forFeature([Capacity])],
  controllers: [CapacityController],
  providers: [CapacityService, QueryBuilderService],
  exports: [CapacityService],
})
export class CapacityModule {}
