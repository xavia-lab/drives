import {
  Injectable,
  ConflictException,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { StorageType } from './entities/storage-type.entity';
import { CreateStorageTypeDto } from './dto/create-storage-type.dto';
import { UpdateStorageTypeDto } from './dto/update-storage-type.dto';
import { QueryStorageTypeDto } from './dto/query-storage-type.dto';
import { PaginationService } from '../common/pagination/pagination.service';
import { PaginatedResponse } from '../common/interfaces/paginated-response';

@Injectable()
export class StorageTypeService implements OnModuleInit {
  constructor(
    @InjectModel(StorageType)
    private readonly storageTypeModel: typeof StorageType,
    private readonly paginationService: PaginationService, // 🌟 Clean composition injection
  ) {}

  async onModuleInit() {
    await this.seedDefaultStorageTypes();
  }

  private async seedDefaultStorageTypes(): Promise<void> {
    const defaultStorageTypes: {
      name: string;
    }[] = [];

    for (const storageTypeData of defaultStorageTypes) {
      const existing = await this.storageTypeModel.findOne({
        where: { name: storageTypeData.name },
      });

      if (!existing) {
        await this.storageTypeModel.create({
          ...storageTypeData,
          managed: true,
        });
        console.log(`Seeded default StorageType: ${storageTypeData.name}`);
      }
    }
  }

  async findAll(
    query?: QueryStorageTypeDto,
  ): Promise<PaginatedResponse<StorageType & { itemNumber: number }>> {
    // 🌟 Clean delegation to the standalone service
    return this.paginationService.paginate<StorageType>(
      this.storageTypeModel,
      query,
    );
  }

  async findOne(id: string): Promise<StorageType | null> {
    return this.storageTypeModel.findByPk(id);
  }

  async createStorageType(
    createStorageTypeDto: CreateStorageTypeDto,
  ): Promise<StorageType> {
    const existingByName = await this.storageTypeModel.findOne({
      where: { name: createStorageTypeDto.name },
    });

    if (existingByName) {
      throw new ConflictException(
        `StorageType with name "${createStorageTypeDto.name}" already exists`,
      );
    }

    return this.storageTypeModel.create(createStorageTypeDto as any);
  }

  async updateStorageType(
    id: string,
    updateStorageTypeDto: UpdateStorageTypeDto,
  ): Promise<StorageType> {
    const storageType = await this.storageTypeModel.findByPk(id);

    if (!storageType) {
      throw new NotFoundException(`StorageType with ID ${id} not found`);
    }

    if (storageType.managed) {
      throw new ConflictException(
        'System-managed StorageTypes cannot be updated',
      );
    }

    if (updateStorageTypeDto.name) {
      const existing = await this.storageTypeModel.findOne({
        where: { name: updateStorageTypeDto.name },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `StorageType with name "${updateStorageTypeDto.name}" already exists`,
        );
      }
    }

    // Filter down to only passed payload items to keep the query clean
    const updateData: Partial<StorageType> = {};
    if (updateStorageTypeDto.name !== undefined)
      updateData.name = updateStorageTypeDto.name;
    if (updateStorageTypeDto.wearTrackable !== undefined)
      updateData.wearTrackable = updateStorageTypeDto.wearTrackable;
    if (updateStorageTypeDto.managed !== undefined)
      updateData.managed = updateStorageTypeDto.managed;

    return storageType.update(updateData);
  }

  async deleteStorageType(id: string): Promise<boolean> {
    const storageType = await this.storageTypeModel.findByPk(id);

    if (!storageType) {
      throw new NotFoundException(`StorageType with ID ${id} not found`);
    }

    if (storageType.managed) {
      throw new ConflictException(
        'System-managed StorageTypes cannot be deleted',
      );
    }

    const deletedCount = await this.storageTypeModel.destroy({ where: { id } });
    return deletedCount > 0;
  }
}
