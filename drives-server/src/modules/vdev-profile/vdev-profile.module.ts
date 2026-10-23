import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { VdevProfile } from './entities/vdev-profile.entity';
import { LogicalVdev } from '../logical-vdev/entities/logical-vdev.entity';
import { VdevProfileService } from './vdev-profile.service';
import { VdevProfileController } from './vdev-profile.controller';

@Module({
  imports: [SequelizeModule.forFeature([VdevProfile, LogicalVdev])],
  controllers: [VdevProfileController],
  providers: [VdevProfileService],
  exports: [VdevProfileService],
})
export class VdevProfileModule {}
