import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { CapacityController } from './capacity.controller';
import { CapacityService } from './capacity.service';
import { Capacity } from './entities/capacity.entity';

@Module({
  imports: [SequelizeModule.forFeature([Capacity])],
  controllers: [CapacityController],
  providers: [CapacityService],
  exports: [CapacityService],
})
export class CapacityModule {}
