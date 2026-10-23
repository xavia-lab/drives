import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { StoragePoolHost } from '../storage-pool/entities/storage-pool-host.entity';
import { PhysicalServer } from '../physical-server/entities/physical-server.entity';
import { VirtualServer } from '../virtual-server/entities/virtual-server.entity';
import { PassthroughSlot } from '../virtual-server/entities/passthrough-slot.entity';
import { ServerSlotAllocationModule } from '../server-slot-allocation/server-slot-allocation.module';
import { StorageTopologyService } from './storage-topology.service';

@Module({
  imports: [
    SequelizeModule.forFeature([
      StoragePoolHost,
      PhysicalServer,
      VirtualServer,
      PassthroughSlot,
    ]),
    ServerSlotAllocationModule,
  ],
  providers: [StorageTopologyService],
  exports: [StorageTopologyService],
})
export class StorageTopologyModule {}
