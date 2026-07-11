import {
  Injectable,
  ConflictException,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { StorageType } from './entities/storage-type.entity';
import { BaseCrudService } from '../base/base-crud.service';
import { CreateStorageTypeDto } from './dto/create-storage-type.dto';
import { UpdateStorageTypeDto } from './dto/update-storage-type.dto';
import { QueryStorageTypeDto } from './dto/query-storage-type.dto';
import { QueryBuilderService } from '../../common/services/query-builder/query-builder.service';
import { PaginatedResponse } from '../../common/interfaces/paginated-response';

@Injectable()
export class StorageTypeService
  extends BaseCrudService<StorageType>
  implements OnModuleInit
{
  constructor(
    @InjectModel(StorageType)
    private StorageTypeModel: typeof StorageType,
    protected queryBuilder: QueryBuilderService,
  ) {
    super(StorageTypeModel, queryBuilder);
  }

  async onModuleInit() {
    await this.seedDefaultStorageTypes();
  }

  private async seedDefaultStorageTypes(): Promise<void> {
    const defaultStorageTypes: {
      name: string;
    }[] = [];

    for (const StorageTypeData of defaultStorageTypes) {
      const existing = await this.StorageTypeModel.findOne({
        where: { name: StorageTypeData.name },
      });

      if (!existing) {
        await this.StorageTypeModel.create({
          ...StorageTypeData,
          managed: true,
        });
        console.log(`Seeded default StorageType: ${StorageTypeData.name}`);
      }
    }
  }

  async createStorageType(
    createStorageTypeDto: CreateStorageTypeDto,
  ): Promise<StorageType> {
    const existingByName = await this.StorageTypeModel.findOne({
      where: { name: createStorageTypeDto.name },
    });

    if (existingByName) {
      throw new ConflictException(
        `StorageType with name "${createStorageTypeDto.name}" already exists`,
      );
    }

    return super.create(createStorageTypeDto);
  }

  async updateStorageType(
    id: number,
    updateStorageTypeDto: UpdateStorageTypeDto,
  ): Promise<StorageType> {
    const StorageType = await super.findOne(id);

    if (!StorageType) {
      throw new NotFoundException(`StorageType with ID ${id} not found`);
    }

    if (StorageType.managed) {
      throw new ConflictException(
        'System-managed StorageTypes cannot be updated',
      );
    }

    if (updateStorageTypeDto.name) {
      const existing = await this.StorageTypeModel.findOne({
        where: { name: updateStorageTypeDto.name },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `StorageType with name "${updateStorageTypeDto.name}" already exists`,
        );
      }
    }

    const updateData: Partial<StorageType> = {};
    if (updateStorageTypeDto.name !== undefined)
      updateData.name = updateStorageTypeDto.name;
    if (updateStorageTypeDto.wearTrackable !== undefined)
      updateData.wearTrackable = updateStorageTypeDto.wearTrackable;
    if (updateStorageTypeDto.managed !== undefined)
      updateData.managed = updateStorageTypeDto.managed;

    const result = await super.update(id, updateData);
    if (!result) {
      throw new NotFoundException(`StorageType with ID ${id} not found`);
    }
    return result;
  }

  async deleteStorageType(id: number): Promise<boolean> {
    const StorageType = await super.findOne(id);

    if (!StorageType) {
      throw new NotFoundException(`StorageType with ID ${id} not found`);
    }

    if (StorageType.managed) {
      throw new ConflictException(
        'System-managed StorageTypes cannot be deleted',
      );
    }

    return super.delete(id);
  }

  async findAllStorageTypes(
    query?: QueryStorageTypeDto,
  ): Promise<PaginatedResponse<StorageType>> {
    return super.findAll(query);
  }
}
