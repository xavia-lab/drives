import {
  Injectable,
  ConflictException,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { PhysicalDrive } from './entities/physical-drive.entity';
import { StorageModel } from '../storage-model/entities/storage-model.entity';
import { Vendor } from '../vendor/entities/vendor.entity';
import { Currency } from '../currency/entities/currency.entity';
import { CreatePhysicalDriveDto } from './dto/create-physical-drive.dto';
import { UpdatePhysicalDriveDto } from './dto/update-physical-drive.dto';
import { QueryPhysicalDriveDto } from './dto/query-physical-drive.dto';
import { PaginationService } from '../common/pagination/pagination.service';
import { PaginatedResponse } from '../common/interfaces/paginated-response';

@Injectable()
export class PhysicalDriveService implements OnModuleInit {
  constructor(
    @InjectModel(PhysicalDrive)
    private readonly physicalDriveModel: typeof PhysicalDrive,
    @InjectModel(StorageModel)
    private readonly storageModelModel: typeof StorageModel,
    @InjectModel(Vendor)
    private readonly vendorModel: typeof Vendor,
    @InjectModel(Currency)
    private readonly currencyModel: typeof Currency,
    private readonly paginationService: PaginationService, // 🌟 Clean composition injection
  ) {}

  async onModuleInit() {}

  // 🌟 Optimized private helper to check foreign key constraints concurrently and aggregate errors
  private async validateForeignKeys(ids: {
    storageModelId?: string;
    retailerVendorId?: string;
    currencyId?: string;
  }): Promise<void> {
    const checkPromises: Promise<string | null>[] = [];

    if (ids.storageModelId) {
      checkPromises.push(
        this.storageModelModel
          .findByPk(ids.storageModelId)
          .then((exists) =>
            exists
              ? null
              : `StorageModel with ID ${ids.storageModelId} not found`,
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
    query?: QueryPhysicalDriveDto,
  ): Promise<PaginatedResponse<PhysicalDrive & { itemNumber: number }>> {
    // 🌟 Clean delegation to the standalone service
    return this.paginationService.paginate<PhysicalDrive>(
      this.physicalDriveModel,
      query,
    );
  }

  async findOne(id: string): Promise<PhysicalDrive | null> {
    return this.physicalDriveModel.findByPk(id);
  }

  async create(
    createPhysicalDriveDto: CreatePhysicalDriveDto,
  ): Promise<PhysicalDrive> {
    const existingBySerial = await this.physicalDriveModel.findOne({
      where: {
        serialNumber: createPhysicalDriveDto.serialNumber,
      },
    });

    if (existingBySerial) {
      throw new ConflictException(
        `PhysicalDrive with serial number "${createPhysicalDriveDto.serialNumber}" already exists`,
      );
    }

    // 🌟 Aggregate check for all incoming foreign keys concurrently
    await this.validateForeignKeys(createPhysicalDriveDto as any);

    return this.physicalDriveModel.create(createPhysicalDriveDto as any);
  }

  async update(
    id: string,
    updatePhysicalDriveDto: UpdatePhysicalDriveDto,
  ): Promise<PhysicalDrive> {
    const physicalDriveObject = await this.physicalDriveModel.findByPk(id);

    if (!physicalDriveObject) {
      throw new NotFoundException(`PhysicalDrive with ID ${id} not found`);
    }

    if (updatePhysicalDriveDto.serialNumber) {
      const existing = await this.physicalDriveModel.findOne({
        where: {
          serialNumber: updatePhysicalDriveDto.serialNumber,
        },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `PhysicalDrive with serial number "${updatePhysicalDriveDto.serialNumber}" already exists`,
        );
      }
    }

    // 🌟 Validate passed keys for existence before performing the data update loop
    await this.validateForeignKeys(updatePhysicalDriveDto as any);

    const updateData: Partial<PhysicalDrive> = {};
    if (updatePhysicalDriveDto.serialNumber !== undefined)
      updateData.serialNumber = updatePhysicalDriveDto.serialNumber;
    if (updatePhysicalDriveDto.worldwideNameWwn !== undefined)
      updateData.worldwideNameWwn = updatePhysicalDriveDto.worldwideNameWwn;
    if (updatePhysicalDriveDto.acquisitionCost !== undefined)
      updateData.acquisitionCost = updatePhysicalDriveDto.acquisitionCost;
    if (updatePhysicalDriveDto.purchaseDate !== undefined)
      updateData.purchaseDate = updatePhysicalDriveDto.purchaseDate;
    if (updatePhysicalDriveDto.warrantyExpiryDate !== undefined)
      updateData.warrantyExpiryDate = updatePhysicalDriveDto.warrantyExpiryDate;
    if (updatePhysicalDriveDto.storageModelId !== undefined)
      updateData.storageModelId = updatePhysicalDriveDto.storageModelId;
    if (updatePhysicalDriveDto.retailerVendorId !== undefined)
      updateData.retailerVendorId = updatePhysicalDriveDto.retailerVendorId;
    if (updatePhysicalDriveDto.currencyId !== undefined)
      updateData.currencyId = updatePhysicalDriveDto.currencyId;

    return physicalDriveObject.update(updateData);
  }

  async delete(id: string): Promise<boolean> {
    const physicalDriveObject = await this.physicalDriveModel.findByPk(id);

    if (!physicalDriveObject) {
      throw new NotFoundException(`PhysicalDrive with ID ${id} not found`);
    }

    const deletedCount = await this.physicalDriveModel.destroy({
      where: { id },
    });
    return deletedCount > 0;
  }
}
