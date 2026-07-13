import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { RackController } from './rack.controller';
import { RackService } from './rack.service';
import { Rack } from './entities/rack.entity';
import { Datacenter } from '../datacenter/entities/datacenter.entity';
import { Server } from '../server/entities/server.entity';

@Module({
  imports: [SequelizeModule.forFeature([Rack, Datacenter, Server])],
  controllers: [RackController],
  providers: [RackService],
  exports: [RackService], // Allows downstream inventory or network modules to inject RackService
})
export class RackModule {}
