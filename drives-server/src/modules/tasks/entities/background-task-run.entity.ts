import { Table, Column, DataType } from 'sequelize-typescript';
import { BaseModel } from '../../../shared/entities/base.model';

export enum BackgroundTaskTrigger {
  SCHEDULED = 'SCHEDULED',
  MANUAL = 'MANUAL',
}

export enum BackgroundTaskRunStatus {
  RUNNING = 'RUNNING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  SKIPPED = 'SKIPPED',
}

@Table({
  tableName: 'background_task_runs',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      name: 'background_task_runs_task_started_idx',
      fields: ['task_key', 'started_at'],
    },
    {
      name: 'background_task_runs_status_idx',
      fields: ['status'],
    },
    {
      name: 'background_task_runs_user_idx',
      fields: ['triggered_by_user_id'],
    },
  ],
})
export class BackgroundTaskRun extends BaseModel {
  @Column({
    type: DataType.STRING(64),
    allowNull: false,
    field: 'task_key',
  })
  declare taskKey: string;

  @Column({
    type: DataType.ENUM(...Object.values(BackgroundTaskTrigger)),
    allowNull: false,
    field: 'trigger_type',
  })
  declare triggerType: BackgroundTaskTrigger;

  @Column({
    type: DataType.ENUM(...Object.values(BackgroundTaskRunStatus)),
    allowNull: false,
    defaultValue: BackgroundTaskRunStatus.RUNNING,
  })
  declare status: BackgroundTaskRunStatus;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    field: 'started_at',
  })
  declare startedAt: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'finished_at',
  })
  declare finishedAt: Date | null;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    field: 'duration_ms',
  })
  declare durationMs: number | null;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  declare result: Record<string, unknown> | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    field: 'error_message',
  })
  declare errorMessage: string | null;

  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'triggered_by_user_id',
  })
  declare triggeredByUserId: string | null;

  @Column({
    type: DataType.STRING(128),
    allowNull: true,
    field: 'instance_id',
  })
  declare instanceId: string | null;
}
