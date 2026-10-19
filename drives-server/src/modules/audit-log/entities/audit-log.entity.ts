import { Table, Column, DataType } from 'sequelize-typescript';
import { BaseModel } from '../../../shared/entities/base.model';

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
export class AuditLog extends BaseModel {
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

  // --- Identity Federation Actor ---

  // Stores the Keycloak subject (sub) of the operator who produced the event.
  // Deliberately NOT a FK to `users`: audit entries must remain append-only even
  // when the actor has never been JIT-provisioned or their user row is removed.
  @Column({
    type: DataType.UUID,
    allowNull: true, // Nullable to ensure automated system crons or webhook workers don't crash validation
    field: 'user_id',
  })
  declare userId: string | null;
}
