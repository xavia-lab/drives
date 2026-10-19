import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ServerSlotAllocation } from './entities/server-slot-allocation.entity';
import { ServerSlotAllocationController } from './server-slot-allocation.controller';
import { SlotAssignmentController } from './slot-assignment.controller';
import { DriveAllocationController } from './drive-allocation.controller';
import { ServerSlotAllocationService } from './server-slot-allocation.service';
import { ServerSlot } from '../physical-server/entities/server-slot.entity';
import { PhysicalServer } from '../physical-server/entities/physical-server.entity';
import { PhysicalDrive } from '../physical-drive/entities/physical-drive.entity';
import { PhysicalDriveLocation } from '../physical-drive/entities/physical-drive-location.entity';
import { DriveModel } from '../drive-model/entities/drive-model.entity';
import { Rack } from '../rack/entities/rack.entity';
import { Datacenter } from '../datacenter/entities/datacenter.entity';
import { User } from '../user/entities/user.entity';
import { DriveLifecycleEventModule } from '../drive-lifecycle-event/drive-lifecycle-event.module';

@Module({
  imports: [
    SequelizeModule.forFeature([
      ServerSlotAllocation,
      ServerSlot,
      PhysicalServer,
      PhysicalDrive,
      PhysicalDriveLocation,
      DriveModel,
      Rack,
      Datacenter,
      User,
    ]),
    DriveLifecycleEventModule,
  ],
  controllers: [
    ServerSlotAllocationController,
    SlotAssignmentController,
    DriveAllocationController,
  ],
  providers: [ServerSlotAllocationService],
  exports: [ServerSlotAllocationService],
})
export class ServerSlotAllocationModule {}
