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
    allowNull: true, // e.g., 'Bookworm', 'Trixie', 'Noble Numbat'
  })
  declare codeName: string | null;

  @Column({
    type: DataType.STRING(64),
    allowNull: true, // e.g., 'Canonical', 'Proxmox', 'Red Hat'
  })
  declare vendor: string | null;

  @Column({
    type: DataType.STRING(64),
    allowNull: true, // e.g., 'Debian', 'RHEL', 'FreeBSD' (upstream distribution lineage)
  })
  declare family: string | null;

  @Column({
    type: DataType.INTEGER,
    allowNull: true, // e.g., 24 for Ubuntu 24.04 LTS
  })
  declare majorVersion: number | null;

  @Column({
    type: DataType.INTEGER,
    allowNull: true, // e.g., 4 for Ubuntu 24.04 LTS
  })
  declare minorVersion: number | null;

  @Column({
    type: DataType.DATEONLY,
    allowNull: true, // YYYY-MM-DD; null when no fixed EOL is published
  })
  declare eolDate: string | null;

  // --- Associations ---
}
