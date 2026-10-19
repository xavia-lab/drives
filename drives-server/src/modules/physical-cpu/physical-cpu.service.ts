import {
  Injectable,
  ConflictException,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { PhysicalCpu } from './entities/physical-cpu.entity';
import { CpuModel } from '../cpu-model/entities/cpu-model.entity';
import { Vendor } from '../vendor/entities/vendor.entity';
import { Currency } from '../currency/entities/currency.entity';
import { CreatePhysicalCpuDto } from './dto/create-physical-cpu.dto';
import { UpdatePhysicalCpuDto } from './dto/update-physical-cpu.dto';
import { QueryPhysicalCpuDto } from './dto/query-physical-cpu.dto';
import { PaginationService } from '../pagination/pagination.service';
import { PaginatedResponse } from '../pagination/interfaces/paginated-response';

@Injectable()
export class PhysicalCpuService implements OnModuleInit {
  constructor(
    @InjectModel(PhysicalCpu)
    private readonly physicalCpuModel: typeof PhysicalCpu,
    @InjectModel(CpuModel)
    private readonly cpuModelModel: typeof CpuModel,
    @InjectModel(Vendor)
    private readonly vendorModel: typeof Vendor,
    @InjectModel(Currency)
    private readonly currencyModel: typeof Currency,
    private readonly paginationService: PaginationService,
  ) {}

  async onModuleInit() {}

  // Optimized private helper to check foreign key constraints concurrently and aggregate errors
  private async validateForeignKeys(ids: {
    cpuModelId?: string;
    retailerVendorId?: string;
    currencyId?: string;
  }): Promise<void> {
    const checkPromises: Promise<string | null>[] = [];

    if (ids.cpuModelId) {
      checkPromises.push(
        this.cpuModelModel
          .findByPk(ids.cpuModelId)
          .then((exists) =>
            exists ? null : `CpuModel with ID ${ids.cpuModelId} not found`,
          ),
      );
    }
    if (ids.retailerVendorId) {
      checkPromises.push(
        this.vendorModel
          .findByPk(ids.retailerVendorId)
          .then((exists) =>
            exists
              ? null
              : `Retailer Vendor with ID ${ids.retailerVendorId} not found`,
          ),
      );
    }
    if (ids.currencyId) {
      checkPromises.push(
        this.currencyModel
          .findByPk(ids.currencyId)
          .then((exists) =>
            exists ? null : `Currency with ID ${ids.currencyId} not found`,
          ),
      );
    }

    const results = await Promise.all(checkPromises);
    const errors = results.filter((error): error is string => error !== null);

    if (errors.length > 0) {
      throw new NotFoundException(errors.join('\n'));
    }
  }

  async findAll(
    query?: QueryPhysicalCpuDto,
  ): Promise<PaginatedResponse<PhysicalCpu>> {
    return this.paginationService.paginate<PhysicalCpu>(
      this.physicalCpuModel,
      query,
    );
  }

  async findOne(id: string): Promise<PhysicalCpu | null> {
    return this.physicalCpuModel.findByPk(id);
  }

  async create(
    createPhysicalCpuDto: CreatePhysicalCpuDto,
  ): Promise<PhysicalCpu> {
    const existingBySerial = await this.physicalCpuModel.findOne({
      where: {
        serialNumber: createPhysicalCpuDto.serialNumber,
      },
    });

    if (existingBySerial) {
      throw new ConflictException(
        `PhysicalCpu with serial number "${createPhysicalCpuDto.serialNumber}" already exists`,
      );
    }

    // Aggregate check for all incoming foreign keys concurrently
    await this.validateForeignKeys(createPhysicalCpuDto);

    return this.physicalCpuModel.create(
      createPhysicalCpuDto as Partial<PhysicalCpu>,
    );
  }

  async update(
    id: string,
    updatePhysicalCpuDto: UpdatePhysicalCpuDto,
  ): Promise<PhysicalCpu> {
    const physicalCpuObject = await this.physicalCpuModel.findByPk(id);

    if (!physicalCpuObject) {
      throw new NotFoundException(`PhysicalCpu with ID ${id} not found`);
    }

    if (updatePhysicalCpuDto.serialNumber) {
      const existing = await this.physicalCpuModel.findOne({
        where: {
          serialNumber: updatePhysicalCpuDto.serialNumber,
        },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `PhysicalCpu with serial number "${updatePhysicalCpuDto.serialNumber}" already exists`,
        );
      }
    }

    // Validate passed keys for existence before performing the data update loop
    await this.validateForeignKeys(updatePhysicalCpuDto);

    const updateData: Partial<PhysicalCpu> = {};
    if (updatePhysicalCpuDto.serialNumber !== undefined)
      updateData.serialNumber = updatePhysicalCpuDto.serialNumber;
    if (updatePhysicalCpuDto.acquisitionCost !== undefined)
      updateData.acquisitionCost = updatePhysicalCpuDto.acquisitionCost;
    if (updatePhysicalCpuDto.purchaseDate !== undefined)
      updateData.purchaseDate = updatePhysicalCpuDto.purchaseDate;
    if (updatePhysicalCpuDto.warrantyExpiryDate !== undefined)
      updateData.warrantyExpiryDate = updatePhysicalCpuDto.warrantyExpiryDate;
    if (updatePhysicalCpuDto.cpuModelId !== undefined)
      updateData.cpuModelId = updatePhysicalCpuDto.cpuModelId;
    if (updatePhysicalCpuDto.retailerVendorId !== undefined)
      updateData.retailerVendorId = updatePhysicalCpuDto.retailerVendorId;
    if (updatePhysicalCpuDto.currencyId !== undefined)
      updateData.currencyId = updatePhysicalCpuDto.currencyId;

    return physicalCpuObject.update(updateData);
  }

  async delete(id: string): Promise<boolean> {
    const physicalCpuObject = await this.physicalCpuModel.findByPk(id);

    if (!physicalCpuObject) {
      throw new NotFoundException(`PhysicalCpu with ID ${id} not found`);
    }

    const deletedCount = await this.physicalCpuModel.destroy({
      where: { id },
    });
    return deletedCount > 0;
  }
}
