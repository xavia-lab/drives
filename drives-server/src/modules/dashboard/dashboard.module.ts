import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { PhysicalDrive } from '../physical-drive/entities/physical-drive.entity';
import { PhysicalServer } from '../physical-server/entities/physical-server.entity';
import { ServerSlot } from '../physical-server/entities/server-slot.entity';
import { Rack } from '../rack/entities/rack.entity';
import { Datacenter } from '../datacenter/entities/datacenter.entity';
import { Currency } from '../currency/entities/currency.entity';
import { WarrantyClaim } from '../warranty-claim/entities/warranty-claim.entity';
import { WarrantyClaimEvent } from '../warranty-claim/entities/warranty-claim-event.entity';
import { DriveLifecycleEvent } from '../drive-lifecycle-event/entities/drive-lifecycle-event.entity';
import { PhysicalDriveModule } from '../physical-drive/physical-drive.module';
import { DriveLifecycleEventModule } from '../drive-lifecycle-event/drive-lifecycle-event.module';
import { WarrantyClaimModule } from '../warranty-claim/warranty-claim.module';
import { ServerSlotAllocationModule } from '../server-slot-allocation/server-slot-allocation.module';
import { ExchangeRateModule } from '../exchange-rate/exchange-rate.module';
import { StoragePoolModule } from '../storage-pool/storage-pool.module';
import { LogicalVdevModule } from '../logical-vdev/logical-vdev.module';
import { StorageTopologyVisualizationService } from './storage-topology-visualization.service';
import { VirtualServer } from '../virtual-server/entities/virtual-server.entity';
import { PassthroughSlot } from '../virtual-server/entities/passthrough-slot.entity';
import { Interface } from '../interface/entities/interface.entity';
import { PoolType } from '../pool-type/entities/pool-type.entity';

@Module({
  imports: [
    SequelizeModule.forFeature([
      PhysicalDrive,
      PhysicalServer,
      ServerSlot,
      Rack,
      Datacenter,
      Currency,
      WarrantyClaim,
      WarrantyClaimEvent,
      DriveLifecycleEvent,
      VirtualServer,
      PassthroughSlot,
      Interface,
      PoolType,
    ]),
    PhysicalDriveModule,
    DriveLifecycleEventModule,
    WarrantyClaimModule,
    ServerSlotAllocationModule,
    ExchangeRateModule,
    StoragePoolModule,
    LogicalVdevModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService, StorageTopologyVisualizationService],
  exports: [DashboardService],
})
export class DashboardModule {}
