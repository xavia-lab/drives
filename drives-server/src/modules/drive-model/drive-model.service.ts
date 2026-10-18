import {
  Injectable,
  ConflictException,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { DriveModel } from './entities/drive-model.entity';
import { Capacity } from '../capacity/entities/capacity.entity';
import { FormFactor } from '../form-factor/entities/form-factor.entity';
import { Interface } from '../interface/entities/interface.entity';
import { Vendor } from '../vendor/entities/vendor.entity';
import { StorageType } from '../storage-type/entities/storage-type.entity';
import { CreateDriveModelDto } from './dto/create-drive-model.dto';
import { UpdateDriveModelDto } from './dto/update-drive-model.dto';
import { QueryDriveModelDto } from './dto/query-drive-model.dto';
import { PaginationService } from '../common/pagination/pagination.service';
import { PaginatedResponse } from '../common/interfaces/paginated-response';

@Injectable()
export class DriveModelService implements OnModuleInit {
  constructor(
    @InjectModel(DriveModel)
    private readonly driveModelModel: typeof DriveModel,
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
    query?: QueryDriveModelDto,
  ): Promise<PaginatedResponse<DriveModel>> {
    return this.paginationService.paginate<DriveModel>(
      this.driveModelModel,
      query,
    );
  }

  async findOne(id: string): Promise<DriveModel | null> {
    return this.driveModelModel.findByPk(id);
  }

  async create(createDriveModelDto: CreateDriveModelDto): Promise<DriveModel> {
    const existingByName = await this.driveModelModel.findOne({
      where: {
        name: createDriveModelDto.name,
        modelNumber: createDriveModelDto.modelNumber,
      },
    });

    if (existingByName) {
      throw new ConflictException(
        `DriveModel with name "${createDriveModelDto.name} | ${createDriveModelDto.modelNumber}" already exists`,
      );
    }

    // Check all incoming IDs for existence before creation
    await this.validateForeignKeys(createDriveModelDto);

    // Fixed: Cast creation parameters using a safe partial model layer instead of 'any'
    return this.driveModelModel.create(
      createDriveModelDto as Partial<DriveModel>,
    );
  }

  async update(
    id: string,
    updateDriveModelDto: UpdateDriveModelDto,
  ): Promise<DriveModel> {
    const driveModelObject = await this.driveModelModel.findByPk(id);

    if (!driveModelObject) {
      throw new NotFoundException(`DriveModel with ID ${id} not found`);
    }

    if (updateDriveModelDto.name || updateDriveModelDto.modelNumber) {
      const searchName = updateDriveModelDto.name ?? driveModelObject.name;
      const searchModelNumber =
        updateDriveModelDto.modelNumber ?? driveModelObject.modelNumber;

      const existing = await this.driveModelModel.findOne({
        where: { name: searchName, modelNumber: searchModelNumber },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `DriveModel with name "${searchName} | ${searchModelNumber}" already exists`,
        );
      }
    }

    // Check all passed IDs for existence before executing the update loop
    await this.validateForeignKeys(updateDriveModelDto);

    const updateData: Partial<DriveModel> = {};
    if (updateDriveModelDto.name !== undefined)
      updateData.name = updateDriveModelDto.name;
    if (updateDriveModelDto.modelNumber !== undefined)
      updateData.modelNumber = updateDriveModelDto.modelNumber;
    if (updateDriveModelDto.maxEnduranceTbw !== undefined)
      updateData.maxEnduranceTbw = updateDriveModelDto.maxEnduranceTbw;
    if (updateDriveModelDto.capacityId !== undefined)
      updateData.capacityId = updateDriveModelDto.capacityId;
    if (updateDriveModelDto.formFactorId !== undefined)
      updateData.formFactorId = updateDriveModelDto.formFactorId;
    if (updateDriveModelDto.interfaceId !== undefined)
      updateData.interfaceId = updateDriveModelDto.interfaceId;
    if (updateDriveModelDto.manufacturerId !== undefined)
      updateData.manufacturerId = updateDriveModelDto.manufacturerId;
    if (updateDriveModelDto.storageTypeId !== undefined)
      updateData.storageTypeId = updateDriveModelDto.storageTypeId;

    return driveModelObject.update(updateData);
  }

  async delete(id: string): Promise<boolean> {
    const driveModelObject = await this.driveModelModel.findByPk(id);

    if (!driveModelObject) {
      throw new NotFoundException(`DriveModel with ID ${id} not found`);
    }

    const deletedCount = await this.driveModelModel.destroy({
      where: { id },
    });
    return deletedCount > 0;
  }
}
