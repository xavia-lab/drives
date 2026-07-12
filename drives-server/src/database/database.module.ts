import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { DatabaseService } from './database.service';

import { AuditLog } from '../modules/audit-log/entities/audit-log.entity';
import { Role } from '../modules/role/entities/role.entity';
import { User } from '../modules/user/entities/user.entity';

import { Media } from '../modules/media/entities/media.entity';
import { QRLink } from '../modules/qrcode/entities/qr-link.entity';

import { BusProtocol } from 'src/modules/bus-protocol/entities/bus-protocol.entity';
import { Capacity } from 'src/modules/capacity/entities/capacity.entity';
import { Country } from '../modules/country/entities/country.entity';
import { CpuModel } from '../modules/cpu-model/entities/cpu-model.entity';
import { Currency } from '../modules/currency/entities/currency.entity';
import { Datacenter } from '../modules/datacenter/entities/datacenter.entity';
import { DriveLifecycleEvent } from '../modules/drive-lifecycle-event/entities/drive-lifecycle-event.entity';
import { FormFactor } from 'src/modules/form-factor/entities/form-factor.entity';
import { Interface } from 'src/modules/interface/entities/interface.entity';
import { LogicalDisk } from '../modules/logical-disk/entities/logical-disk.entity';
import { LogicalVdev } from '../modules/logical-vdev/entities/logical-vdev.entity';
import { OperatingSystem } from '../modules/operating-system/entities/operating-system.entity';
import { PhysicalDrive } from '../modules/physical-drive/entities/physical-drive.entity';
import { Rack } from '../modules/rack/entities/rack.entity';
import { ServerSlot } from '../modules/server-slot/entities/server-slot.entity';
import { ServerSlotAllocation } from '../modules/server-slot-allocation/entities/server-slot-allocation.entity';
import { Server } from '../modules/server/entities/server.entity';
import { StorageModel } from 'src/modules/storage-model/entities/storage-model.entity';
import { StoragePool } from '../modules/storage-pool/entities/storage-pool.entity';
import { StorageType } from '../modules/storage-type/entities/storage-type.entity';
import { Vendor } from '../modules/vendor/entities/vendor.entity';
import { VirtualServer } from '../modules/virtual-server/entities/virtual-server.entity';
import { WarrantyClaim } from '../modules/warranty-claim/entities/warranty-claim.entity';

@Global()
@Module({
  imports: [
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const config = configService.getOrThrow('database');

        return {
          ...config,
          models: [
            AuditLog,
            Media,
            QRLink,
            User,
            Role,
            // Add other models here
            BusProtocol,
            Capacity,
            Country,
            CpuModel,
            Currency,
            Datacenter,
            DriveLifecycleEvent,
            FormFactor,
            Interface,
            LogicalDisk,
            LogicalVdev,
            OperatingSystem,
            PhysicalDrive,
            Rack,
            Server,
            ServerSlot,
            ServerSlotAllocation,
            StorageModel,
            StoragePool,
            StorageType,
            Vendor,
            VirtualServer,
            WarrantyClaim,
          ],
          autoLoadModels: true,
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [DatabaseService],
  exports: [DatabaseService, SequelizeModule],
})
export class DatabaseModule {}
