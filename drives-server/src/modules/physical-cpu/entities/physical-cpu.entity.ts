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
    allowNull: false,
    unique: true,
  })
  declare serialNumber: string;

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
    return `${this.getDataValue('serialNumber') as string}`;
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

    // 3. Transform native date strings from YYYY-MM-DD into a compressed numerical cluster string (YYYYMMDD)
    const rawDateStr = instance.purchaseDate.replace(/[^0-9]/g, ''); // "2021-09-08" => "20210908"
    if (rawDateStr.length !== 8) {
      throw new Error(
        `Label Generation Error: Invalid purchase date format "${instance.purchaseDate}". Expecting YYYY-MM-DD.`,
      );
    }

    // Assemble uniform prefix configuration string block (CPUs carry no capacity segment)
    const baseLabelPrefix = `${mfgCode}-${modelCode}-${rawDateStr}`;

    // 4. Evaluate existing assets inside a row lock to find the next available chronological sequence index
    const lastMatchingCpu = await PhysicalCpu.findOne({
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
    if (lastMatchingCpu) {
      const lastSequenceMatch = lastMatchingCpu.label.match(/\d{3}$/);
      sequence = lastSequenceMatch ? parseInt(lastSequenceMatch[0], 10) + 1 : 1;
    }

    // 5. Bind the finalized structural bar-code value back to the model instance parameter list
    instance.label = `${baseLabelPrefix}-${sequence.toString().padStart(3, '0')}`;
  }
}
