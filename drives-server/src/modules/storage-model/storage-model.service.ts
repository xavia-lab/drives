import {
  Injectable,
  ConflictException,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { StorageModel } from './entities/storage-model.entity';
import { Capacity } from '../capacity/entities/capacity.entity';
import { FormFactor } from '../form-factor/entities/form-factor.entity';
import { Interface } from '../interface/entities/interface.entity';
import { Vendor } from '../vendor/entities/vendor.entity';
import { StorageType } from '../storage-type/entities/storage-type.entity';
import { CreateStorageModelDto } from './dto/create-storage-model.dto';
import { UpdateStorageModelDto } from './dto/update-storage-model.dto';
import { QueryStorageModelDto } from './dto/query-storage-model.dto';
import { PaginationService } from '../common/pagination/pagination.service';
import { PaginatedResponse } from '../common/interfaces/paginated-response';

@Injectable()
export class StorageModelService implements OnModuleInit {
  constructor(
    @InjectModel(StorageModel)
    private readonly storageModelModel: typeof StorageModel,
    @InjectModel(Capacity)
    private readonly capacityModel: typeof Capacity,
    @InjectModel(FormFactor)
    private readonly formFactorModel: typeof FormFactor,
    @InjectModel(Interface)
    private readonly interfaceModel: typeof Interface,
    @InjectModel(Vendor)
    private readonly vendorModel: typeof Vendor,
    @InjectModel(StorageType)
    private readonly storageTypeModel: typeof StorageType,
    private readonly paginationService: PaginationService,
  ) {}

  async onModuleInit() {}

  // Private helper to check foreign key constraints concurrently and aggregate errors
  private async validateForeignKeys(ids: {
    capacityId?: string;
    formFactorId?: string;
    interfaceId?: string;
    manufacturerId?: string;
    storageTypeId?: string;
  }): Promise<void> {
    const checkPromises: Promise<string | null>[] = [];

    if (ids.capacityId) {
      checkPromises.push(
        this.capacityModel
          .findByPk(ids.capacityId)
          .then((exists) =>
            exists ? null : `Capacity with ID ${ids.capacityId} not found`,
          ),
      );
    }
    if (ids.formFactorId) {
      checkPromises.push(
        this.formFactorModel
          .findByPk(ids.formFactorId)
          .then((exists) =>
            exists ? null : `FormFactor with ID ${ids.formFactorId} not found`,
          ),
      );
    }
    if (ids.interfaceId) {
      checkPromises.push(
        this.interfaceModel
          .findByPk(ids.interfaceId)
          .then((exists) =>
            exists ? null : `Interface with ID ${ids.interfaceId} not found`,
          ),
      );
    }
    if (ids.manufacturerId) {
      checkPromises.push(
        this.vendorModel
          .findByPk(ids.manufacturerId)
          .then((exists) =>
            exists
              ? null
              : `Manufacturer (Vendor) with ID ${ids.manufacturerId} not found`,
          ),
      );
    }
    if (ids.storageTypeId) {
      checkPromises.push(
        this.storageTypeModel
          .findByPk(ids.storageTypeId)
          .then((exists) =>
            exists
              ? null
              : `StorageType with ID ${ids.storageTypeId} not found`,
          ),
      );
    }

    // 1. Run all database lookups concurrently (Performance optimization)
    const results = await Promise.all(checkPromises);

    // 2. Filter out null values to isolate the errors
    const errors = results.filter((error): error is string => error !== null);

    // 3. Aggregate errors into a single exception with line breaks if any exist
    if (errors.length > 0) {
      throw new NotFoundException(errors.join('\n'));
    }
  }

  async findAll(
    query?: QueryStorageModelDto,
  ): Promise<PaginatedResponse<StorageModel & { itemNumber: number }>> {
    return this.paginationService.paginate<StorageModel>(
      this.storageModelModel,
      query,
    );
  }

  async findOne(id: string): Promise<StorageModel | null> {
    return this.storageModelModel.findByPk(id);
  }

  async create(
    createStorageModelDto: CreateStorageModelDto,
  ): Promise<StorageModel> {
    const existingByName = await this.storageModelModel.findOne({
      where: {
        name: createStorageModelDto.name,
        modelNumber: createStorageModelDto.modelNumber,
      },
    });

    if (existingByName) {
      throw new ConflictException(
        `StorageModel with name "${createStorageModelDto.name} | ${createStorageModelDto.modelNumber}" already exists`,
      );
    }

    // 🌟 Check all incoming IDs for existence before creation
    await this.validateForeignKeys(createStorageModelDto);

    return this.storageModelModel.create(createStorageModelDto as any);
  }

  async update(
    id: string,
    updateStorageModelDto: UpdateStorageModelDto,
  ): Promise<StorageModel> {
    const storageModelObject = await this.storageModelModel.findByPk(id);

    if (!storageModelObject) {
      throw new NotFoundException(`StorageModel with ID ${id} not found`);
    }

    if (updateStorageModelDto.name || updateStorageModelDto.modelNumber) {
      const searchName = updateStorageModelDto.name ?? storageModelObject.name;
      const searchModelNumber =
        updateStorageModelDto.modelNumber ?? storageModelObject.modelNumber;

      const existing = await this.storageModelModel.findOne({
        where: { name: searchName, modelNumber: searchModelNumber },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `StorageModel with name "${searchName} | ${searchModelNumber}" already exists`,
        );
      }
    }

    // 🌟 Check all passed IDs for existence before executing the update loop
    await this.validateForeignKeys(updateStorageModelDto);

    const updateData: Partial<StorageModel> = {};
    if (updateStorageModelDto.name !== undefined)
      updateData.name = updateStorageModelDto.name;
    if (updateStorageModelDto.modelNumber !== undefined)
      updateData.modelNumber = updateStorageModelDto.modelNumber;
    if (updateStorageModelDto.maxEnduranceTbw !== undefined)
      updateData.maxEnduranceTbw = updateStorageModelDto.maxEnduranceTbw;
    if (updateStorageModelDto.capacityId !== undefined)
      updateData.capacityId = updateStorageModelDto.capacityId;
    if (updateStorageModelDto.formFactorId !== undefined)
      updateData.formFactorId = updateStorageModelDto.formFactorId;
    if (updateStorageModelDto.interfaceId !== undefined)
      updateData.interfaceId = updateStorageModelDto.interfaceId;
    if (updateStorageModelDto.manufacturerId !== undefined)
      updateData.manufacturerId = updateStorageModelDto.manufacturerId;
    if (updateStorageModelDto.storageTypeId !== undefined)
      updateData.storageTypeId = updateStorageModelDto.storageTypeId;

    return storageModelObject.update(updateData);
  }

  async delete(id: string): Promise<boolean> {
    const storageModelObject = await this.storageModelModel.findByPk(id);

    if (!storageModelObject) {
      throw new NotFoundException(`StorageModel with ID ${id} not found`);
    }

    const deletedCount = await this.storageModelModel.destroy({
      where: { id },
    });
    return deletedCount > 0;
  }
}
