import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { PhysicalServerController } from './physical-server.controller';
import { PhysicalServerService } from './physical-server.service';
import { PhysicalServer } from './entities/physical-server.entity';
import { CpuModel } from '../cpu-model/entities/cpu-model.entity';
import { OperatingSystem } from '../operating-system/entities/operating-system.entity';
import { Rack } from '../rack/entities/rack.entity';

@Module({
  imports: [
    SequelizeModule.forFeature([
      PhysicalServer,
      CpuModel,
      OperatingSystem,
      Rack,
    ]),
  ],
  controllers: [PhysicalServerController],
  providers: [PhysicalServerService],
  exports: [PhysicalServerService],
})
export class PhysicalServerModule {}
