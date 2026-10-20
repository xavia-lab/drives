import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import keycloakConfig from './config/keycloak.config';
import storageConfig from './config/storage.config';
import { PaginationModule } from './modules/pagination/pagination.module';
import { DatabaseModule } from './database/database.module';
import { KeycloakModule } from './modules/keycloak/keycloak.module';
import { KeycloakAuthGuard } from './common/guards/keycloak.guard';
import { UserModule } from './modules/user/user.module';
import { StorageModule } from './modules/storage/storage.module';
import { QRCodeModule } from './modules/qrcode/qrcode.module';

import { BusProtocolModule } from './modules/bus-protocol/bus-protocol.module';
import { CapacityModule } from './modules/capacity/capacity.module';
import { CountryModule } from './modules/country/country.module';
import { CpuModelModule } from './modules/cpu-model/cpu-model.module';
import { CurrencyModule } from './modules/currency/currency.module';
import { DatacenterModule } from './modules/datacenter/datacenter.module';
import { DriveLifecycleEventModule } from './modules/drive-lifecycle-event/drive-lifecycle-event.module';
import { FormFactorModule } from './modules/form-factor/form-factor.module';
import { InterfaceModule } from './modules/interface/interface.module';
import { LogicalDiskModule } from './modules/logical-disk/logical-disk.module';
import { LogicalVdevModule } from './modules/logical-vdev/logical-vdev.module';
import { OperatingSystemModule } from './modules/operating-system/operating-system.module';
import { PhysicalDriveModule } from './modules/physical-drive/physical-drive.module';
import { PhysicalCpuModule } from './modules/physical-cpu/physical-cpu.module';
import { PoolTypeModule } from './modules/pool-type/pool-type.module';
import { RackModule } from './modules/rack/rack.module';
import { PhysicalServerModule } from './modules/physical-server/physical-server.module';
import { ServerSlotAllocationModule } from './modules/server-slot-allocation/server-slot-allocation.module';
import { DriveModelModule } from './modules/drive-model/drive-model.module';
import { StoragePoolModule } from './modules/storage-pool/storage-pool.module';
import { StorageTypeModule } from './modules/storage-type/storage-type.module';
import { VendorModule } from './modules/vendor/vendor.module';
import { VirtualServerModule } from './modules/virtual-server/virtual-server.module';
import { WarrantyClaimModule } from './modules/warranty-claim/warranty-claim.module';

import { HealthModule } from './modules/health/health.module';
import { SystemModule } from './modules/system/system.module';
import { MetadataModule } from './modules/metadata/metadata.module';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, keycloakConfig, storageConfig],
      // Add '.env' to the end of the array as a fallback
      envFilePath: [`.env.${process.env.NODE_ENV}.local`, '.env.local', '.env'],
    }),
    PaginationModule,
    DatabaseModule,
    MetadataModule,
    KeycloakModule,
    UserModule, // This must come before modules that use KeycloakAuthGuard
    AuditLogModule,
    DashboardModule,
    QRCodeModule,
    StorageModule,

    BusProtocolModule,
    CapacityModule,
    CountryModule,
    CpuModelModule,
    CurrencyModule,
    DatacenterModule,
    DriveLifecycleEventModule,
    FormFactorModule,
    InterfaceModule,
    LogicalDiskModule,
    LogicalVdevModule,
    OperatingSystemModule,
    PhysicalDriveModule,
    PhysicalCpuModule,
    PoolTypeModule,
    RackModule,
    PhysicalServerModule,
    ServerSlotAllocationModule,
    DriveModelModule,
    StoragePoolModule,
    StorageTypeModule,
    VendorModule,
    VirtualServerModule,
    WarrantyClaimModule,

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
