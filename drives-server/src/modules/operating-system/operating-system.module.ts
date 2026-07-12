import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { OperatingSystemController } from './operating-system.controller';
import { OperatingSystemService } from './operating-system.service';
import { OperatingSystem } from './entities/operating-system.entity';

@Module({
  imports: [SequelizeModule.forFeature([OperatingSystem])],
  controllers: [OperatingSystemController],
  providers: [OperatingSystemService],
  exports: [OperatingSystemService], // Allows downstream inventory or network modules to inject OperatingSystemService
})
export class OperatingSystemModule {}
