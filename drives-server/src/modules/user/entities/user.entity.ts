import {
  Table,
  Column,
  Model,
  PrimaryKey,
  DataType,
  Unique,
  BeforeCreate,
  BeforeUpdate,
} from 'sequelize-typescript';

@Table({
  tableName: 'users',
  timestamps: true, // Adds createdAt and updatedAt
  underscored: true,
})
export class User extends Model {
  @PrimaryKey
  @Column({
    type: DataType.UUID,
    allowNull: false,
    comment: 'Keycloak subject ID (sub)',
  })
  declare id: string;

  @Unique
  @Column({
    type: DataType.STRING(128),
    allowNull: false,
    validate: {
      isEmail: true,
    },
  })
  declare email: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: false,
  })
  declare username: string;

  @Column({
    type: DataType.STRING(128),
    allowNull: false,
  })
  declare name: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    field: 'last_login',
    defaultValue: DataType.NOW,
  })
  declare lastLogin: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'first_login',
    defaultValue: DataType.NOW,
  })
  declare firstLogin?: Date;

  @Column({
    type: DataType.STRING(32),
    field: 'first_name',
    allowNull: true,
  })
  declare firstName?: string;

  @Column({
    type: DataType.STRING(32),
    field: 'last_name',
    allowNull: true,
  })
  declare lastName?: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    field: 'is_active',
    defaultValue: true,
  })
  declare isActive: boolean;

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  declare roles?: string[];

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
  })
  declare realm?: string;

  @Column({
    type: DataType.STRING(64),
    field: 'client_id',
    allowNull: true,
  })
  declare clientId?: string;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare readonly deletedAt: Date;

  @Column(DataType.VIRTUAL)
  get title(): string {
    return `${this.name}`;
  }

  @BeforeCreate
  static setFirstLogin(instance: User) {
    if (!instance.firstLogin) {
      instance.firstLogin = new Date();
    }
    instance.lastLogin = new Date();
  }

  @BeforeUpdate
  static updateTimestamps(instance: User) {
    // Only update lastLogin if specific fields are being updated
    if (instance.changed('lastLogin') === false) {
      instance.lastLogin = new Date();
    }
  }

  // Helper method to convert to JSON safely
  toJSON() {
    const values = Object.assign({}, this.get());

    // Remove sensitive or unnecessary fields
    delete values.deletedAt;

    return values;
  }
}
