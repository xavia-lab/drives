import {
  Table,
  Column,
  DataType,
  ForeignKey,
  BelongsTo,
  BeforeValidate,
} from 'sequelize-typescript';
import { Op, Transaction } from 'sequelize';
import { BaseModel } from '../../../shared/entities/base.model';
import { CpuModel } from '../../cpu-model/entities/cpu-model.entity';
import { Vendor } from '../../vendor/entities/vendor.entity';
import { Currency } from '../../currency/entities/currency.entity';

// Define an explicit validation options interface to destroy the implicit any parameters check cascade
interface HookValidationOptions {
  transaction?: Transaction;
  [key: string]: unknown;
}

@Table({
  tableName: 'physical_cpus',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      name: 'physical_cpus_serial_number_idx',
      fields: ['serial_number'],
      unique: true,
    },
    {
      name: 'physical_cpus_cpu_model_idx',
      fields: ['cpu_model_id'],
    },
    {
      name: 'physical_cpus_financial_idx',
      fields: ['currency_id', 'acquisition_cost'],
    },
    {
      name: 'physical_cpus_physical_server_id_idx',
      fields: ['physical_server_id'],
    },
  ],
})
export class PhysicalCpu extends BaseModel {
  @Column({
    type: DataType.STRING(40),
    allowNull: false,
    unique: true, // Guarantees enterprise asset integrity bounds
  })
  declare label: string;

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    unique: true,
  })
  declare serialNumber: string | null;

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
    return (
      (this.getDataValue('serialNumber') as string | null) ??
      (this.getDataValue('label') as string)
    );
  }

  // --- Associations ---
  @ForeignKey(() => CpuModel)
  @Column({ type: DataType.UUID, allowNull: false })
  declare cpuModelId: string;

  @BelongsTo(() => CpuModel, { onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
  declare cpuModel: CpuModel;

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

  // Owning server (a chip is installed in at most one server). The foreign key
  // is declared as a plain column so the `PhysicalServer` entity can own the
  // `@HasMany` side without an import cycle; the DB-level constraint lives in
  // this resource's own migration.
  @Column({ type: DataType.UUID, allowNull: true })
  declare physicalServerId: string | null;

  // --- Lifecycle Hook: Automated Enterprise Asset Label Generator ---
  @BeforeValidate
  static async generateAssetLabel(
    instance: PhysicalCpu,
    options: HookValidationOptions,
  ) {
    // Intercept calculation steps if the label parameter was manually provided
    if (instance.label) return;

    const { transaction } = options;

    // 1. Fetch structural deep-lookup hierarchy required to map naming codes
    const cpuModel = await CpuModel.findByPk(instance.cpuModelId, {
      transaction,
      include: [{ model: Vendor, as: 'vendor' }],
    });

    if (!cpuModel) {
      throw new Error(
        `Label Generation Failed: Underlying CpuModel ID ${instance.cpuModelId} does not exist.`,
      );
    }

    // 2. Extract constituent strings according to physical parameter rules
    const manufacturerName =
      ((cpuModel.vendor as unknown as Record<string, unknown>)
        ?.name as string) || 'XX';
    const modelNameStr = cpuModel.name || 'XX';

    const mfgCode = manufacturerName
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 2)
      .toUpperCase();
    const modelCode = modelNameStr
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 2)
      .toUpperCase();

    const rawDateStr = instance.purchaseDate.replace(/[^0-9]/g, '');
    if (rawDateStr.length !== 8) {
      throw new Error(
        `Label Generation Error: Invalid purchase date format "${instance.purchaseDate}". Expecting YYYY-MM-DD.`,
      );
    }

    const baseLabelPrefix = `${mfgCode}-${modelCode}-${rawDateStr}`;

    // Evaluate existing assets inside a row lock to find the next available sequence index.
    const matching = await PhysicalCpu.findAll({
      where: { label: { [Op.like]: `${baseLabelPrefix}-%` } },
      attributes: ['label'],
      transaction,
      lock: transaction ? Transaction.LOCK.UPDATE : false,
    });
    const sequence =
      matching.reduce((max, cpu) => {
        const tail = cpu.label.match(/(\d+)$/);
        return Math.max(max, tail ? parseInt(tail[1], 10) : 0);
      }, 0) + 1;

    instance.label = `${baseLabelPrefix}-${sequence.toString().padStart(3, '0')}`;
  }
}
