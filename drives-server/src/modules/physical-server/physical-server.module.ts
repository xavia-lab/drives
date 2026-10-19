import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { PhysicalServerController } from './controllers/physical-server.controller';
import { PhysicalServerService } from './services/physical-server.service';
import { ServerSlotService } from './services/server-slot.service';
import { PhysicalServer } from './entities/physical-server.entity';
import { ServerSlot } from './entities/server-slot.entity';
import { PhysicalCpu } from '../physical-cpu/entities/physical-cpu.entity';
import { OperatingSystem } from '../operating-system/entities/operating-system.entity';
import { Rack } from '../rack/entities/rack.entity';
import { Interface } from '../interface/entities/interface.entity';

@Module({
  imports: [
    SequelizeModule.forFeature([
      PhysicalServer,
      ServerSlot,
      PhysicalCpu,
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
