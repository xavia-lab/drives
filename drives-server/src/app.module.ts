import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import keycloakConfig from './config/keycloak.config';
import storageConfig from './config/storage.config';
import { DatabaseModule } from './database/database.module';
import { KeycloakModule } from './modules/keycloak/keycloak.module';
import { KeycloakAuthGuard } from './common/guards/keycloak.guard';
import { UserModule } from './modules/user/user.module';
import { StorageModule } from './modules/storage/storage.module';
import { QRCodeModule } from './modules/qrcode/qrcode.module';

import { BusProtocolModule } from './modules/bus-protocol/bus-protocol.module';
import { CapacityModule } from './modules/capacity/capacity.module';
import { CountryModule } from './modules/country/country.module';
import { CurrencyModule } from './modules/currency/currency.module';
import { DriveLifecycleEventModule } from './modules/drive-lifecycle-event/drive-lifecycle-event.module';
import { FormFactorModule } from './modules/form-factor/form-factor.module';
import { InterfaceModule } from './modules/interface/interface.module';
import { PhysicalDriveModule } from './modules/physical-drive/physical-drive.module';
import { StorageModelModule } from './modules/storage-model/storage-model.module';
import { StorageTypeModule } from './modules/storage-type/storage-type.module';
import { VendorModule } from './modules/vendor/vendor.module';

import { HealthModule } from './modules/health/health.module';
import { SystemModule } from './modules/system/system.module';
import { AuditLogModule } from './modules/audit-log/audit-log.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, keycloakConfig, storageConfig],
      // Add '.env' to the end of the array as a fallback
      envFilePath: [`.env.${process.env.NODE_ENV}.local`, '.env.local', '.env'],
    }),
    DatabaseModule,
    KeycloakModule,
    UserModule, // This must come before modules that use KeycloakAuthGuard
    AuditLogModule,
    QRCodeModule,
    StorageModule,

    BusProtocolModule,
    CapacityModule,
    CountryModule,
    CurrencyModule,
    DriveLifecycleEventModule,
    FormFactorModule,
    InterfaceModule,
    PhysicalDriveModule,
    StorageModelModule,
    StorageTypeModule,
    VendorModule,

    HealthModule,
    SystemModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: KeycloakAuthGuard,
    },
  ],
})
export class AppModule {}
