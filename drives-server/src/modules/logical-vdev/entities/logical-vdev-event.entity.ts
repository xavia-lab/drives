import {
  Table,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { BaseModel } from '../../../shared/entities/base.model';
import { LogicalVdev } from './logical-vdev.entity';
import { StoragePool } from '../../storage-pool/entities/storage-pool.entity';
import { User } from '../../user/entities/user.entity';

export enum VdevConfigAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

@Table({
  tableName: 'logical_vdev_events',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      name: 'logical_vdev_events_history_idx',
      using: 'btree',
      fields: ['logical_vdev_id', 'event_timestamp', 'display_key'],
    },
    {
      name: 'logical_vdev_events_pool_idx',
      using: 'btree',
      fields: ['storage_pool_id', 'event_timestamp'],
    },
    {
      name: 'logical_vdev_events_performed_by_idx',
      using: 'btree',
      fields: ['performed_by_user_id'],
    },
  ],
})
export class LogicalVdevEvent extends BaseModel {
  @ForeignKey(() => LogicalVdev)
  @Column({ type: DataType.UUID, allowNull: true, field: 'logical_vdev_id' })
  declare logicalVdevId: string | null;

  @BelongsTo(() => LogicalVdev, { onDelete: 'SET NULL', onUpdate: 'CASCADE' })
  declare logicalVdev: LogicalVdev | null;

  @ForeignKey(() => StoragePool)
  @Column({ type: DataType.UUID, allowNull: true, field: 'storage_pool_id' })
  declare storagePoolId: string | null;

  @BelongsTo(() => StoragePool, { onDelete: 'SET NULL', onUpdate: 'CASCADE' })
  declare storagePool: StoragePool | null;

  @Column({
    type: DataType.ENUM(...Object.values(VdevConfigAction)),
    allowNull: false,
  })
  declare action: VdevConfigAction;

  @Column({ type: DataType.JSONB, allowNull: true, field: 'before_snapshot' })
  declare beforeSnapshot: Record<string, unknown> | null;

  @Column({ type: DataType.JSONB, allowNull: true, field: 'after_snapshot' })
  declare afterSnapshot: Record<string, unknown> | null;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
    field: 'event_timestamp',
  })
  declare eventTimestamp: Date;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'performed_by_user_id',
  })
  declare performedByUserId: string | null;

  @BelongsTo(() => User, { onDelete: 'SET NULL', onUpdate: 'CASCADE' })
  declare performedByUser: User | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare notes: string | null;
}
