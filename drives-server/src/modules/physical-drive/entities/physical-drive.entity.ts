import {
  Table,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
  BeforeValidate,
} from 'sequelize-typescript';
import { Op, Transaction } from 'sequelize';
import { BaseModel } from '../../../shared/entities/base.model';
import { DriveModel } from '../../drive-model/entities/drive-model.entity';
import { Vendor } from '../../vendor/entities/vendor.entity';
import { Currency } from '../../currency/entities/currency.entity';
import { Capacity } from '../../capacity/entities/capacity.entity';
import { PhysicalDriveLocation } from './physical-drive-location.entity';

// Define an explicit validation options interface to destroy the implicit any parameters check cascade
interface HookValidationOptions {
  transaction?: Transaction;
  [key: string]: unknown;
}

@Table({
  tableName: 'physical_drives',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      name: 'physical_drives_serial_number_idx',
      fields: ['serial_number'],
      unique: true,
    },
    {
      name: 'physical_drives_drive_model_idx',
      fields: ['drive_model_id'],
    },
    {
      name: 'physical_drives_financial_idx',
      fields: ['currency_id', 'acquisition_cost'],
    },
  ],
})
export class PhysicalDrive extends BaseModel {
  @Column({
    type: DataType.STRING(40),
    allowNull: false,
    unique: true, // Guarantees enterprise asset integrity bounds
  })
  declare label: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: false,
    unique: true,
  })
  declare serialNumber: string;

  @Column({
    type: DataType.STRING(32),
    allowNull: true,
    unique: true,
  })
  declare worldwideNameWwn: string | null;

  @Column({
    type: DataType.DECIMAL(12, 2),
    allowNull: false,
  })
  declare acquisitionCost: number;

  @Column({
    type: DataType.DATEONLY,
    allowNull: false,
  })
  declare purchaseDate: string;

  @Column({
    type: DataType.DATEONLY,
    allowNull: false,
  })
  declare warrantyExpiryDate: string;

  @Column(DataType.VIRTUAL)
  get title(): string {
    return `${this.serialNumber}`;
  }

  // --- Associations ---
  @ForeignKey(() => DriveModel)
  @Column({ type: DataType.UUID, allowNull: false })
  declare driveModelId: string;

  @BelongsTo(() => DriveModel, { onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
  declare driveModel: DriveModel;

  @ForeignKey(() => Vendor)
  @Column({ type: DataType.UUID, allowNull: false })
  declare retailerVendorId: string;

  @BelongsTo(() => Vendor, { onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
  declare retailerVendor: Vendor;

  @ForeignKey(() => Currency)
  @Column({ type: DataType.UUID, allowNull: false })
  declare currencyId: string;

  @BelongsTo(() => Currency, { onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
  declare currency: Currency;

  // Append-only location log. The drive's current datacenter is derived from
  // the latest row rather than stored on this record.
  @HasMany(() => PhysicalDriveLocation, { as: 'locations' })
  declare locations: PhysicalDriveLocation[];

  // --- Lifecycle Hook: Automated Enterprise Asset Label Generator ---
  @BeforeValidate
  static async generateAssetLabel(
    instance: PhysicalDrive,
    options: HookValidationOptions,
  ) {
    // Intercept calculation steps if the label parameter was manually provided
    if (instance.label) return;

    const { transaction } = options;

    // 1. Fetch structural deep-lookup hierarchy required to map naming codes
    const driveModel = await DriveModel.findByPk(instance.driveModelId, {
      transaction,
      include: [
        { model: Vendor, as: 'manufacturer' },
        { model: Capacity, as: 'capacity' },
      ],
    });

    if (!driveModel) {
      throw new Error(
        `Label Generation Failed: Underlying DriveModel ID ${instance.driveModelId} does not exist.`,
      );
    }

    // 2. Extract constituent strings according to physical parameter rules
    const manufacturerName =
      ((driveModel.manufacturer as unknown as Record<string, unknown>)
        ?.name as string) || 'XX';
    const modelNameStr = driveModel.name || 'XX';
    const capacityObj = driveModel.capacity as unknown as Record<
      string,
      unknown
    > | null;

    const mfgCode = manufacturerName
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 2)
      .toUpperCase();
    const modelCode = modelNameStr
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 2)
      .toUpperCase();

    // 3. Normalize fractional capacity metrics safely (e.g., 16 => "0016", 3.84 => "03.8")
    let rawValueStr = '0000';
    if (
      capacityObj &&
      capacityObj.value !== undefined &&
      capacityObj.value !== null
    ) {
      const rawVal = capacityObj.value;
      const primitiveValue =
        typeof rawVal === 'string' || typeof rawVal === 'number'
          ? rawVal
          : `${rawVal as string | number}`;

      const parsedVal = parseFloat(primitiveValue.toString());
      if (!isNaN(parsedVal)) {
        if (Number.isInteger(parsedVal)) {
          rawValueStr = parsedVal.toString().padStart(4, '0');
        } else {
          // Formats fractional cloud sizes like 3.84TB gracefully to a consistent 4 character boundary
          rawValueStr = parsedVal.toFixed(1).padStart(4, '0');
        }
      }
    }
    const unitCode =
      (capacityObj?.unit as string)?.slice(0, 2).toUpperCase() || 'XX';

    // 4. Transform native date strings from YYYY-MM-DD into a compressed numerical cluster string (YYYYMMDD)
    const rawDateStr = instance.purchaseDate.replace(/[^0-9]/g, ''); // "2021-09-08" => "20210908"
    if (rawDateStr.length !== 8) {
      throw new Error(
        `Label Generation Error: Invalid purchase date format "${instance.purchaseDate}". Expecting YYYY-MM-DD.`,
      );
    }

    // Assemble uniform prefix configuration string block
    const baseLabelPrefix = `${mfgCode}-${modelCode}-${rawValueStr}${unitCode}-${rawDateStr}`;

    // 5. Evaluate existing assets inside a row lock to find the next available chronological sequence index
    const lastMatchingDrive = await PhysicalDrive.findOne({
      where: {
        label: {
          [Op.like]: `${baseLabelPrefix}-%`,
        },
      },
      order: [['label', 'DESC']],
      transaction,
      lock: transaction ? Transaction.LOCK.UPDATE : false,
    });

    let sequence = 1;
    if (lastMatchingDrive) {
      const lastSequenceMatch = lastMatchingDrive.label.match(/\d{3}\$/);
      sequence = lastSequenceMatch ? parseInt(lastSequenceMatch[0], 10) + 1 : 1;
    }

    // 6. Bind the finalized structural bar-code value back to the model instance parameter list
    instance.label = `${baseLabelPrefix}-${sequence.toString().padStart(3, '0')}`;
  }
}
