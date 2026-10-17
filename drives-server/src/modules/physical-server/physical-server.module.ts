import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { PhysicalServerController } from './controllers/physical-server.controller';
import { PhysicalServerService } from './services/physical-server.service';
import { ServerSlotService } from './services/server-slot.service';
import { PhysicalServer } from './entities/physical-server.entity';
import { ServerSlot } from './entities/server-slot.entity';
import { CpuModel } from '../cpu-model/entities/cpu-model.entity';
import { OperatingSystem } from '../operating-system/entities/operating-system.entity';
import { Rack } from '../rack/entities/rack.entity';
import { Interface } from '../interface/entities/interface.entity';

@Module({
  imports: [
    SequelizeModule.forFeature([
      PhysicalServer,
      ServerSlot,
      CpuModel,
      OperatingSystem,
      Rack,
      Interface,
    ]),
  ],
  controllers: [PhysicalServerController],
  providers: [PhysicalServerService, ServerSlotService],
  exports: [PhysicalServerService],
})
export class PhysicalServerModule {}
