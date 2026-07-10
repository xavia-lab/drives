import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuditLog } from './entities/audit-log.entity';
import { AuditLogService } from './audit-log.service';
import { AuditLogController } from './audit-log.controller';

@Module({
  imports: [
    SequelizeModule.forFeature([AuditLog]), // Hooks model tokens safely into your running application context
  ],
  controllers: [AuditLogController],
  providers: [AuditLogService],
  exports: [AuditLogService], // Exporting the service allows you to inject it directly into interceptors system-wide
})
export class AuditLogModule {}
