import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { PhysicalDriveController } from './physical-drive.controller';
import { PhysicalDriveService } from './physical-drive.service';
import { PhysicalDrive } from './entities/physical-drive.entity';
import { QueryBuilderService } from '../../common/services/query-builder/query-builder.service';

@Module({
  imports: [SequelizeModule.forFeature([PhysicalDrive])],
  controllers: [PhysicalDriveController],
  providers: [PhysicalDriveService, QueryBuilderService],
  exports: [PhysicalDriveService],
})
export class PhysicalDriveModule {}
