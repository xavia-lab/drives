import { SequelizeModule } from '@nestjs/sequelize';
import { Module } from '@nestjs/common';
import { VirtualServer } from './entities/virtual-server.entity';
import { PassthroughSlot } from './entities/passthrough-slot.entity';
import { VirtualServerService } from './virtual-server.service';
import { PassthroughSlotService } from './passthrough-slot.service';
import { VirtualServerController } from './virtual-server.controller';
import { PhysicalServer } from '../physical-server/entities/physical-server.entity';
import { ServerSlot } from '../physical-server/entities/server-slot.entity';
import { OperatingSystem } from '../operating-system/entities/operating-system.entity';
import { PhysicalCpu } from '../physical-cpu/entities/physical-cpu.entity';
import { CpuModel } from '../cpu-model/entities/cpu-model.entity';

@Module({
  imports: [
    SequelizeModule.forFeature([
      VirtualServer,
      PassthroughSlot,
      PhysicalServer,
      ServerSlot,
      OperatingSystem,
      PhysicalCpu,
      CpuModel,
    ]),
  ],
  controllers: [VirtualServerController],
  providers: [VirtualServerService, PassthroughSlotService],
  exports: [VirtualServerService],
})
export class VirtualServerModule {}
