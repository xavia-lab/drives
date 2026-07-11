import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  PrimaryKey,
  Default,
} from 'sequelize-typescript';
import sequelize from 'sequelize';

import { User } from '../../user/entities/user.entity';

// Explicit type layout for Refine-compliant historical payload objects
export interface RefineAuditPayload {
  previous?: Record<string, any> | null;
  current?: Record<string, any> | null;
}

@Table({
  tableName: 'audit_logs',
  timestamps: true,
  underscored: true,
})
export class AuditLog extends Model {
  @PrimaryKey
  @Default(sequelize.fn('uuidv7')) // Handles database-level UUIDv7 auto-generation
  @Column(DataType.UUID)
  declare id: string;

  @Column({
    type: DataType.STRING(32),
    allowNull: false,
  })
  declare action: string; // 'create' | 'update' | 'delete'

  @Column({
    type: DataType.STRING(64),
    allowNull: false,
  })
  declare resource: string; // e.g., 'physical-drives'

  @Column({
    type: DataType.STRING(64),
    allowNull: false,
    field: 'resource_id',
  })
  declare resourceId: string;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  declare payload: RefineAuditPayload | null;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  declare timestamp: Date;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // --- Identity Federation Foreign Key ---

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID, // Maintained as UUID to match your Keycloak-federated architecture
    allowNull: true, // Nullable to ensure automated system crons or webhook workers don't crash validation
    field: 'user_id',
  })
  declare userId: string | null;
}
