import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { RackController } from './rack.controller';
import { RackService } from './rack.service';
import { Rack } from './entities/rack.entity';
import { Datacenter } from '../datacenter/entities/datacenter.entity';
import { PhysicalServer } from '../physical-server/entities/physical-server.entity';

@Module({
  imports: [SequelizeModule.forFeature([Rack, Datacenter, PhysicalServer])],
  controllers: [RackController],
  providers: [RackService],
  exports: [RackService],
})
export class RackModule {}
