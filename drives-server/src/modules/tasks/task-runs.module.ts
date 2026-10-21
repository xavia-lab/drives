import { Global, Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { BackgroundTaskRun } from './entities/background-task-run.entity';
import { TaskRunService } from './task-run.service';

@Global()
@Module({
  imports: [SequelizeModule.forFeature([BackgroundTaskRun])],
  providers: [TaskRunService],
  exports: [TaskRunService],
})
export class TaskRunsModule {}
