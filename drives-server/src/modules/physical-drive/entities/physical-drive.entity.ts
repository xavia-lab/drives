import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  PrimaryKey,
  AutoIncrement,
  BeforeValidate,
} from 'sequelize-typescript';
import { Op } from 'sequelize';
import { StorageModel } from '../../storage-model/entities/storage-model.entity';
import { Vendor } from '../../vendor/entities/vendor.entity';
import { Currency } from '../../currency/entities/currency.entity';
import { Capacity } from '../../capacity/entities/capacity.entity';

@Table({
  tableName: 'physical_drives',
  timestamps: true,
  underscored: true,
})
export class PhysicalDrive extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

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
    return `${this.getDataValue('serial_number')}`;
  }

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // --- Associations ---
  @ForeignKey(() => StorageModel)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare storageModelId: number;

  @BelongsTo(() => StorageModel, { onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
  declare storageModel: StorageModel;

  @ForeignKey(() => Vendor)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare retailerVendorId: number;

  @BelongsTo(() => Vendor, { onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
  declare retailerVendor: Vendor;

  @ForeignKey(() => Currency)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare currencyId: number;

  @BelongsTo(() => Currency, { onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
  declare currency: Currency;

  // --- Lifecycle Hook: Automated Enterprise Asset Label Generator ---
  @BeforeValidate
  static async generateAssetLabel(instance: PhysicalDrive, options: any) {
    // Intercept calculation steps if the label parameter was manually provided
    if (instance.label) return;

    const { transaction } = options;

    // 1. Fetch structural deep-lookup hierarchy required to map naming codes
    const storageModel = await StorageModel.findByPk(instance.storageModelId, {
      transaction,
      include: [
        { model: Vendor, as: 'manufacturer' },
        { model: Capacity, as: 'capacity' },
      ],
    });

    if (!storageModel) {
      throw new Error(
        `Label Generation Failed: Underlying StorageModel ID ${instance.storageModelId} does not exist.`,
      );
    }

    // 2. Extract constituent strings according to physical parameter rules
    const manufacturerName = storageModel.manufacturer?.name || 'XX';
    const modelNameStr = storageModel.name || 'XX';
    const capacityObj = storageModel.capacity;

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
    if (capacityObj) {
      const parsedVal = parseFloat(capacityObj.value.toString());
      if (Number.isInteger(parsedVal)) {
        rawValueStr = parsedVal.toString().padStart(4, '0');
      } else {
        // Formats fractional cloud sizes like 3.84TB gracefully to a consistent 4 character boundary
        rawValueStr = parsedVal.toFixed(1).padStart(4, '0');
      }
    }
    const unitCode = capacityObj?.unit?.slice(0, 2).toUpperCase() || 'XX';

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
      // Implement an active update lock to eliminate race condition bottlenecks during multi-drive bulk scan inputs
      lock: transaction ? transaction.LOCK.UPDATE : false,
    });

    let sequence = 1;
    if (lastMatchingDrive) {
      const lastSequenceMatch = lastMatchingDrive.label.match(/\d{3}$/);
      sequence = lastSequenceMatch ? parseInt(lastSequenceMatch[0], 10) + 1 : 1;
    }

    // 6. Bind the finalized structural bar-code value back to the model instance parameter list
    instance.label = `${baseLabelPrefix}-${sequence.toString().padStart(3, '0')}`;
  }
}
