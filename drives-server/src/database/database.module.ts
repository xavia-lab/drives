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
import { Currency } from '../modules/currency/entities/currency.entity';
import { DriveLifecycleEvent } from '../modules/drive-lifecycle-event/entities/drive-lifecycle-event.entity';
import { FormFactor } from 'src/modules/form-factor/entities/form-factor.entity';
import { Interface } from 'src/modules/interface/entities/interface.entity';
import { PhysicalDrive } from '../modules/physical-drive/entities/physical-drive.entity';
import { StorageModel } from 'src/modules/storage-model/entities/storage-model.entity';
import { StorageType } from '../modules/storage-type/entities/storage-type.entity';
import { Vendor } from '../modules/vendor/entities/vendor.entity';

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
            Currency,
            DriveLifecycleEvent,
            FormFactor,
            Interface,
            PhysicalDrive,
            StorageModel,
            StorageType,
            Vendor,
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
