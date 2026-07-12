import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ServerSlotAllocation } from './entities/server-slot-allocation.entity';
import { ServerSlotAllocationController } from './server-slot-allocation.controller';
import { ServerSlotAllocationService } from './server-slot-allocation.service';
import { ServerSlot } from '../server-slot/entities/server-slot.entity';
import { PhysicalDrive } from '../physical-drive/entities/physical-drive.entity';
import { User } from '../user/entities/user.entity';

@Module({
  imports: [
    SequelizeModule.forFeature([
      ServerSlotAllocation,
      ServerSlot,
      PhysicalDrive,
      User,
    ]),
  ],
  controllers: [ServerSlotAllocationController],
  providers: [ServerSlotAllocationService],
  exports: [ServerSlotAllocationService],
})
export class ServerSlotAllocationModule {}
