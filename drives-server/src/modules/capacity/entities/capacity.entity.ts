import {
  Table,
  Column,
  DataType,
  Default,
  BeforeSave,
} from 'sequelize-typescript';
import { BaseModel } from '../../../shared/entities/base.model';
import { toBytes } from '../../../lib/utils/human.readable.bytes.converter';

// Strong type alignment for your allowed database ENUM values
export type CapacityUnit = 'B' | 'KB' | 'MB' | 'GB' | 'TB' | 'PB';

@Table({
  tableName: 'capacities',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      name: 'capacities_name',
      unique: true,
      fields: ['name'],
    },
  ],
})
export class Capacity extends BaseModel {
  @Column({
    type: DataType.STRING(32),
    allowNull: false,
  })
  declare name: string;

  @Column({
    type: DataType.DECIMAL(6, 2),
    allowNull: false,
  })
  declare value: number;

  @Column({
    // Updated from STRING(8) to ENUM matching your migration values
    type: DataType.ENUM('B', 'KB', 'MB', 'GB', 'TB', 'PB'),
    allowNull: false,
  })
  declare unit: CapacityUnit; // Applied TypeScript union type here

  @Default(false)
  @Column(DataType.BOOLEAN)
  declare managed: boolean;

  // Stored (denormalised) byte count so it can be sorted/filtered server-side.
  // Computed from value + unit on every save via the @BeforeSave hook below.
  // Bytes are whole numbers, so BIGINT is exact and index-friendly; the getter
  // coerces back to a number because `pg` returns bigint columns as strings.
  @Column({
    type: DataType.BIGINT,
    allowNull: false,
    defaultValue: 0,
    get() {
      const raw = this.getDataValue('absoluteCapacity') as
        string | number | null | undefined;
      return raw === null || raw === undefined ? 0 : Number(raw);
    },
  })
  declare absoluteCapacity: number;

  @BeforeSave
  static computeAbsoluteCapacity(instance: Capacity) {
    instance.absoluteCapacity = Math.round(
      toBytes(Number(instance.value), instance.unit),
    );
  }

  @Column(DataType.VIRTUAL)
  get title(): string {
    return `${this.name}`;
  }
}

// Create a type for creating capacities (without Sequelize methods)
export type CapacityCreateAttributes = Pick<
  Capacity,
  'name' | 'value' | 'unit' | 'managed'
>;
