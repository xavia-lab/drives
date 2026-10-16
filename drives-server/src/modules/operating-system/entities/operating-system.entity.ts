import { Table, Column, DataType } from 'sequelize-typescript';
import { BaseModel } from '../../../shared/entities/base.model';

@Table({
  tableName: 'operating_systems',
  timestamps: true,
  underscored: true,
})
export class OperatingSystem extends BaseModel {
  @Column({
    type: DataType.STRING(64),
    allowNull: false,
    unique: true, // e.g., 'Proxmox VE 8.x', 'Ubuntu Server 24.04 LTS'
  })
  declare name: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: true, // e.g., 'Canonical', 'Proxmox', 'Red Hat'
  })
  declare vendor: string | null;

  // --- Associations ---
}
