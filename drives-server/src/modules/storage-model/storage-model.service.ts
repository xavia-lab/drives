import {
  Injectable,
  ConflictException,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { StorageModel } from './entities/storage-model.entity';
import { BaseCrudService } from '../base/base-crud.service';
import { CreateStorageModelDto } from './dto/create-storage-model.dto';
import { UpdateStorageModelDto } from './dto/update-storage-model.dto';
import { QueryStorageModelDto } from './dto/query-storage-model.dto';
import { QueryBuilderService } from '../../common/services/query-builder/query-builder.service';
import { PaginatedResponse } from '../../common/interfaces/paginated-response';

@Injectable()
export class StorageModelService
  extends BaseCrudService<StorageModel>
  implements OnModuleInit
{
  constructor(
    @InjectModel(StorageModel)
    private storageModelModel: typeof StorageModel,
    protected queryBuilder: QueryBuilderService,
  ) {
    super(storageModelModel, queryBuilder);
  }

  async onModuleInit() {
    await this.seedDefaultStorageModels();
  }

  private async seedDefaultStorageModels(): Promise<void> {
    const defaultStorageModels: {
      name: string;
      modelNumber: string;
      maxEnduranceTbw: number;
      capacityId: number;
      interfaceId: number;
      formFactorId: number;
      manufacturerId: number;
      storageTypeId: number;
    }[] = [];

    for (const storageModelData of defaultStorageModels) {
      const existing = await this.storageModelModel.findOne({
        where: {
          name: storageModelData.name,
          modelNumber: storageModelData.modelNumber,
        },
      });

      if (!existing) {
        await this.storageModelModel.create({
          ...storageModelData,
          managed: true,
        });
        console.log(`Seeded default storage-model: ${storageModelData.name}`);
      }
    }
  }

  async createStorageModel(
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

    return super.create(createStorageModelDto);
  }

  async updateStorageModel(
    id: number,
    updateStorageModelDto: UpdateStorageModelDto,
  ): Promise<StorageModel> {
    const storageModelObject = await super.findOne(id);

    if (!storageModelObject) {
      throw new NotFoundException(`StorageModel with ID ${id} not found`);
    }

    if (updateStorageModelDto.name) {
      const existing = await this.storageModelModel.findOne({
        where: {
          name: updateStorageModelDto.name,
          modelNumber: updateStorageModelDto.modelNumber,
        },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `StorageModel with name "${updateStorageModelDto.name} | ${updateStorageModelDto.modelNumber}" already exists`,
        );
      }
    }

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

    const result = await super.update(id, updateData);
    if (!result) {
      throw new NotFoundException(`StorageModel with ID ${id} not found`);
    }
    return result;
  }

  async deleteStorageModel(id: number): Promise<boolean> {
    const storageModelObject = await super.findOne(id);

    if (!storageModelObject) {
      throw new NotFoundException(`StorageModel with ID ${id} not found`);
    }

    return super.delete(id);
  }

  async findAllStorageModels(
    query?: QueryStorageModelDto,
  ): Promise<PaginatedResponse<StorageModel>> {
    return super.findAll(query);
  }
}
